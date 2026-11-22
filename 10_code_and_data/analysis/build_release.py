"""Package the complete supplement and a standalone code/data ZIP locally.

No upload or external publication is performed. Run after all checks and
document generation. Source data are never modified by this packager.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import zipfile

CODE=Path(__file__).resolve().parents[1]
ROOT=CODE.parent
EXCLUDED={'.git','.venv','__pycache__','.DS_Store'}


def included(path,root):
    return path.is_file() and not path.is_symlink() and not (set(path.relative_to(root).parts)&EXCLUDED) and path.suffix!='.pyc'


def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def manifest(root):
    rows=[]
    for p in sorted(root.rglob('*')):
        if included(p,root) and p.name!='SHA256SUMS.txt':rows.append(f'{sha(p)}  {p.relative_to(root).as_posix()}')
    (root/'SHA256SUMS.txt').write_text('\n'.join(rows)+'\n')


def write_zip(destination,root,prefix):
    with zipfile.ZipFile(destination,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for p in sorted(root.rglob('*')):
            if not included(p,root) or p.resolve()==destination.resolve():continue
            name=prefix+'/'+p.relative_to(root).as_posix()
            info=zipfile.ZipInfo(name,date_time=(2000,1,1,0,0,0));info.create_system=0
            archive.writestr(info,p.read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
    with zipfile.ZipFile(destination) as archive:
        assert archive.testzip() is None
        assert all(not n.startswith('/') and '..' not in Path(n).parts for n in archive.namelist())


def main():
    if not (ROOT/'01_model_and_inference').exists():raise SystemExit('Requires complete Supplementary directory.')
    # These are interpreter-created caches, not source material.
    for p in list(ROOT.rglob('__pycache__')):
        if p.is_dir():shutil.rmtree(p)
    for p in ROOT.rglob('*.pyc'):p.unlink()
    text_suffixes={'.md','.txt','.csv','.json','.js','.html','.py','.css','.svg'}
    patterns=[re.compile(r'sk-[A-Za-z0-9_-]{24,}'),re.compile(r'/Users/[A-Za-z][^/\s]+/'),
              re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')]
    violations=[]
    for p in ROOT.rglob('*'):
        if included(p,ROOT) and p.suffix in text_suffixes:
            content=p.read_text()
            if any(pattern.search(content) for pattern in patterns):violations.append(str(p.relative_to(ROOT)))
    if violations:raise SystemExit('Sensitive-pattern review required in: '+', '.join(violations))
    import csv
    with (CODE/'data/task_outcomes.csv').open() as f:
        header=next(csv.reader(f))
        assert 'student_response' not in header and 'topic' not in header
    manifest(CODE)
    write_zip(ROOT/'TRACE_code_and_data.zip',CODE,'TRACE_code_and_data')
    manifest(ROOT)
    write_zip(ROOT.parent/'Supplementary.zip',ROOT,'Supplementary')
    print('Created TRACE_code_and_data.zip and Supplementary.zip; both ZIP integrity checks passed.')
    for p in [ROOT/'TRACE_code_and_data.zip',ROOT.parent/'Supplementary.zip']:
        print(p.name,round(p.stat().st_size/1024/1024,2),'MiB',sha(p))


if __name__=='__main__':main()
