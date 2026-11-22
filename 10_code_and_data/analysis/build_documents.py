"""Build anonymized PDF/DOCX reading copies from the complete Supplementary tree.

Run only from a full-folder distribution; the standalone code ZIP lacks the
numbered manuscript appendices. All canonical text remains in Markdown/JSON.
"""
from pathlib import Path
import re
import html
import textwrap
import os
import tempfile
os.environ.setdefault('MPLCONFIGDIR',str(Path(tempfile.gettempdir())/'trace-matplotlib'))
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
                               Table, TableStyle, Image, KeepTogether)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import matplotlib

CODE=Path(__file__).resolve().parents[1]
ROOT=CODE.parent
FONT=Path(matplotlib.get_data_path())/'fonts/ttf'
for name,file in [('SupplementSans','DejaVuSans.ttf'),('SupplementBold','DejaVuSans-Bold.ttf'),
                  ('SupplementItalic','DejaVuSans-Oblique.ttf'),('SupplementMono','DejaVuSansMono.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(FONT/file)))
pdfmetrics.registerFontFamily('SupplementSans',normal='SupplementSans',bold='SupplementBold',italic='SupplementItalic',boldItalic='SupplementBold')
STYLES=getSampleStyleSheet()
STYLES.add(ParagraphStyle(name='BodySupp',fontName='SupplementSans',fontSize=9.3,leading=14,spaceAfter=8,textColor=colors.HexColor('#172435')))
STYLES.add(ParagraphStyle(name='CellSupp',parent=STYLES['BodySupp'],fontSize=7.3,leading=10,spaceAfter=0,splitLongWords=True))
STYLES.add(ParagraphStyle(name='CodeSupp',fontName='SupplementMono',fontSize=7.1,leading=9.4,spaceAfter=0,splitLongWords=True))
for n,size in [(1,22),(2,15),(3,11.5)]:
    STYLES.add(ParagraphStyle(name=f'HSupp{n}',fontName='SupplementBold',fontSize=size,leading=size*1.3,
                             textColor=colors.HexColor('#087F8C'),spaceBefore=13,spaceAfter=9,keepWithNext=True))


def inline(text):
    text=html.escape(text)
    text=re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',r'<link href="\2" color="#087F8C">\1</link>',text)
    text=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',text)
    text=re.sub(r'`([^`]+)`',r'<font name="SupplementMono">\1</font>',text)
    return text


def blocks(text):
    lines=text.splitlines();i=0
    while i<len(lines):
        line=lines[i]
        if not line.strip():i+=1;continue
        if line.startswith('```'):
            code=[];i+=1
            while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
            yield 'code','\n'.join(code);i+=1;continue
        if line.startswith('|') and i+1<len(lines) and re.match(r'^\|[\s:|\-]+\|$',lines[i+1]):
            rows=[]
            while i<len(lines) and lines[i].startswith('|'):
                if not re.match(r'^\|[\s:|\-]+\|$',lines[i]):
                    cells=[];current='';in_code=False
                    for char in lines[i].strip()[1:-1]:
                        if char=='`':in_code=not in_code
                        if char=='|' and not in_code:cells.append(current.strip());current=''
                        else:current+=char
                    cells.append(current.strip());rows.append(cells)
                i+=1
            if any(len(row)!=len(rows[0]) for row in rows):raise ValueError('Inconsistent Markdown table column count')
            yield 'table',rows;continue
        match=re.match(r'^(#{1,6})\s+(.*)',line)
        if match:yield 'heading',(min(len(match[1]),3),match[2]);i+=1;continue
        if re.match(r'^\s*([-*]|\d+\.)\s+',line):
            yield 'bullet',line;i+=1;continue
        paragraph=[line];i+=1
        while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|[-*] |\d+\. )',lines[i]):paragraph.append(lines[i]);i+=1
        yield 'paragraph',' '.join(paragraph)


def column_widths(rows,width):
    n=len(rows[0]);weights=[]
    for j in range(n):
        values=[len(r[j]) if j<len(r) else 0 for r in rows]
        # Give prose columns more space without starving narrow numeric columns.
        weights.append(max(6,min(50,(sum(values)/len(values))**.68*3)))
    total=sum(weights)
    return [width*w/total for w in weights]


def pdf_flow(text,width,stage_pages=False):
    story=[]
    for kind,value in blocks(text):
        if kind=='heading':
            level,title=value
            if stage_pages and level==2 and (title.startswith('Assessment page') or title.startswith('Researcher answer')):
                story.append(PageBreak())
            story.append(Paragraph(inline(title),STYLES[f'HSupp{level}']))
        elif kind=='table':
            count=len(value[0]);rows=[row+['']*(count-len(row)) for row in value]
            data=[[Paragraph(inline(cell),STYLES['CellSupp']) for cell in row] for row in rows]
            table=Table(data,colWidths=column_widths(rows,width),repeatRows=1,hAlign='LEFT')
            table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#DDEDEF')),
                                      ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F4F7F8')]),
                                      ('LINEBELOW',(0,0),(-1,0),.7,colors.HexColor('#087F8C')),
                                      ('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),6),
                                      ('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),
                                      ('BOTTOMPADDING',(0,0),(-1,-1),6)]))
            story.extend([table,Spacer(1,10)])
        elif kind=='code':
            for line in value.splitlines():
                # Wrapping affects print layout only; canonical prompt files remain exact.
                for part in textwrap.wrap(line,width=max(40,int(width/4.3)),replace_whitespace=False,drop_whitespace=False) or [' ']:
                    story.append(Paragraph(html.escape(part).replace('  ','&#160;&#160;'),STYLES['CodeSupp']))
            story.append(Spacer(1,9))
        else:story.append(Paragraph(inline(value),STYLES['BodySupp']))
    return story


def footer(canvas,doc):
    canvas.saveState();w,h=doc.pagesize
    canvas.setFillColor(colors.white);canvas.rect(0,0,w,h,fill=1,stroke=0)
    canvas.setStrokeColor(colors.HexColor('#CEDADD'));canvas.line(48,39,w-48,39)
    canvas.setFont('SupplementSans',7.5);canvas.setFillColor(colors.HexColor('#536477'))
    canvas.drawString(48,26,'TRACE | Supplementary materials')
    canvas.drawRightString(w-48,26,str(doc.page));canvas.restoreState()


def write_pdf(path,parts,title='Supplementary materials',wide=False,stage_pages=False):
    size=landscape(letter) if wide else letter
    class BookmarkedDocument(SimpleDocTemplate):
        def afterFlowable(self, flowable):
            if isinstance(flowable,Paragraph) and flowable.style.name=='HSupp1':
                key='section-'+str(getattr(self,'section_count',0))
                self.section_count=getattr(self,'section_count',0)+1
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(flowable.getPlainText(),key,level=0)
    doc=BookmarkedDocument(str(path),pagesize=size,leftMargin=48,rightMargin=48,topMargin=44,bottomMargin=50,
                          title=title,author='',subject='TRACE supplementary resources',creator='',producer='')
    story=[];width=size[0]-96
    for i,(label,text) in enumerate(parts):
        if i:story.append(PageBreak())
        story+=pdf_flow(text,width,stage_pages)
    def fixed_canvas(*args,**kwargs):
        kwargs['invariant']=True
        return Canvas(*args,**kwargs)
    doc.build(story,onFirstPage=footer,onLaterPages=footer,canvasmaker=fixed_canvas)


def docx_inline(paragraph,text):
    # Retain URLs in the editable copy; inline formatting remains editable.
    text=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'\1 (\2)',text)
    for token in re.split(r'(\*\*.*?\*\*|`[^`]+`)',text):
        run=paragraph.add_run(token[2:-2] if token.startswith('**') else token[1:-1] if token.startswith('`') else token)
        if token.startswith('**'):run.bold=True
        if token.startswith('`'):run.font.name='Courier New';run.font.size=Pt(8)


def write_docx(path,parts):
    doc=Document();s=doc.sections[0];s.top_margin=Inches(.65);s.bottom_margin=Inches(.65);s.left_margin=Inches(.65);s.right_margin=Inches(.65)
    normal=doc.styles['Normal'];normal.font.name='Calibri';normal.font.size=Pt(10)
    normal.paragraph_format.space_after=Pt(7)
    for level in range(1,4):
        style=doc.styles[f'Heading {level}'];style.font.name='Calibri';style.font.color.rgb=RGBColor.from_string('087F8C')
    for idx,(label,text) in enumerate(parts):
        if idx:doc.add_page_break()
        for kind,value in blocks(text):
            if kind=='heading':doc.add_heading(value[1],level=value[0])
            elif kind=='table':
                table=doc.add_table(rows=1,cols=len(value[0]));table.style='Light Shading Accent 1'
                for row_idx,row in enumerate(value):
                    cells=table.rows[0].cells if row_idx==0 else table.add_row().cells
                    for j,cell in enumerate(row):
                        p=cells[j].paragraphs[0];docx_inline(p,cell)
                        for run in p.runs:run.font.size=Pt(8)
                hdr=OxmlElement('w:tblHeader');table.rows[0]._tr.get_or_add_trPr().append(hdr)
            elif kind=='code':
                for line in value.splitlines():
                    p=doc.add_paragraph();p.paragraph_format.space_after=Pt(0)
                    run=p.add_run(line);run.font.name='Courier New';run.font.size=Pt(7)
            else:docx_inline(doc.add_paragraph(),value)
    for field in ['author','last_modified_by','keywords','comments','category','identifier']:
        setattr(doc.core_properties,field,'')
    doc.core_properties.title='TRACE — Supplementary materials';doc.core_properties.subject='Supplementary methods, instruments, code, and numerical results'
    from datetime import datetime,timezone
    doc.core_properties.created=datetime(2000,1,1,tzinfo=timezone.utc);doc.core_properties.modified=datetime(2000,1,1,tzinfo=timezone.utc)
    p=doc.sections[0].footer.paragraphs[0];p.add_run('TRACE | Supplementary materials   ')
    field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');p._p.append(field)
    doc.save(path)
    # Clear application/company fields, including default python-docx comments.
    import zipfile
    from lxml import etree
    with zipfile.ZipFile(path) as z:entries={n:z.read(n) for n in z.namelist()}
    app=etree.fromstring(entries['docProps/app.xml'])
    for el in app.iter():
        if etree.QName(el).localname in ['Company','Manager','Application']:el.text=''
    entries['docProps/app.xml']=etree.tostring(app,xml_declaration=True,encoding='UTF-8',standalone=True)
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
        for name,content in entries.items():
            info=zipfile.ZipInfo(name,date_time=(2000,1,1,0,0,0));info.create_system=0;z.writestr(info,content,compress_type=zipfile.ZIP_DEFLATED)


def main():
    if not (ROOT/'01_model_and_inference').exists():
        raise SystemExit('This command needs the complete Supplementary folder, not only the standalone code ZIP.')
    import shutil
    for folder in ['results','figures']:
        for p in (CODE/folder).iterdir():
            if p.is_file():shutil.copyfile(p,ROOT/'08_statistical_results'/p.name)
    groups=[('01_model_and_inference',['model_and_inference_details.md']),
            ('02_complete_prompts',['README.md','complete_prompts.md']),
            ('03_taxonomy_and_prompt_bank',['complete_taxonomy_and_prompt_bank.md','complete_example_interventions.md']),
            ('04_risk_score',['risk_score_specification.md']),
            ('05_evaluation_rubrics',['01_scales_and_scoring_rules.md','02_task_answer_keys.md','03_condition_blinding.md']),
            ('06_study_materials',None),('07_validation',['validation_details.md','annotation_protocol.md']),
            ('08_statistical_results',['statistical_specification.md','numerical_tables.md']),
            ('09_ethics_and_privacy',['ethics_and_privacy.md','consent_information_and_button_text.md']),
            ('10_code_and_data',['README.md'])]
    cover='# Supplementary materials\n\n## TRACE\n\nThink Twice Before You Copy: An Adaptive Browser Extension for Teaching Generative AI Literacy\n\n'
    cover+='Complete instruments, implementation details, rubrics, prompts, and numerical results.\n\n'
    cover+='Machine-readable prompts, reference instruments, numerical tables, and reproduction instructions accompany this reading copy.\n\n'
    cover+='## Contents\n\n'
    for folder,_ in groups:cover+=folder.replace('_',' ')+'\n\n'
    cover+='## Scoring scales\n\nIntervention engagement: **0–2**. Memory/transfer: 0–4. Own-words processing: 0–3. Participant self-reports: 1–5.\n'
    parts=[('Cover',cover)]
    for folder,names in groups:
        files=[ROOT/folder/n for n in names] if names else sorted((ROOT/folder).glob('*.md'))
        for p in files:parts.append((p.name,p.read_text()))
    write_pdf(ROOT/'Supplementary_Materials.pdf',parts)
    write_docx(ROOT/'Supplementary_Materials.docx',parts)
    for p in (ROOT/'06_study_materials').glob('*_participant.md'):
        write_pdf(p.with_suffix('.pdf'),[(p.stem,p.read_text())],title=p.stem,stage_pages=True)
    practice=ROOT/'06_study_materials/03_practice_task.md'
    write_pdf(practice.with_suffix('.pdf'),[(practice.stem,practice.read_text())],title='Practice task',stage_pages=True)
    statparts=[('Specification',(ROOT/'08_statistical_results/statistical_specification.md').read_text()),
               ('Tables',(ROOT/'08_statistical_results/numerical_tables.md').read_text())]
    write_pdf(ROOT/'08_statistical_results/Full_Statistical_Tables.pdf',statparts,title='Full statistical tables',wide=True)
    print('Built compiled PDF/DOCX, 3 staged participant packets, practice PDF, and full statistical tables PDF.')


if __name__=='__main__':main()
