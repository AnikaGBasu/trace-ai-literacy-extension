"""Build schemas and readable prompt/taxonomy appendices from the release sources."""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SUPP = ROOT.parent


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n')


def obj(properties):
    return {'$schema':'https://json-schema.org/draft/2020-12/schema', 'type':'object',
            'additionalProperties':False, 'required':list(properties), 'properties':properties}


def enum(items):
    return {'type':'string', 'enum':items}


def main():
    # Extraction executes only bundled source in a VM without Chrome or network APIs.
    js = """
const fs=require('fs'),vm=require('vm'); const s={window:{},console};vm.createContext(s);
for(const f of ['classifier.js','responseEvaluator.js','interventions.js'])vm.runInContext(fs.readFileSync('source_extension_code/'+f,'utf8'),s);
const r=s.window.BeforeYouCopy;
process.stdout.write(JSON.stringify({classifier:r.classifier.SYSTEM_PROMPT,evaluator:r.responseEvaluator.SYSTEM_PROMPT,routes:r.classifier.TASK_RULES,bypass:r.classifier.TASK_BYPASS_SCORE,bank:r.interventions.INTERVENTIONS}));
"""
    extracted = json.loads(subprocess.check_output(['node','-e',js], cwd=ROOT, text=True))
    for key, filename in [('classifier','task_classifier_as_implemented.txt'),('evaluator','response_evaluator_as_implemented.txt')]:
        (ROOT/'prompts'/filename).write_text(extracted[key]+'\n')
    write_json(ROOT/'taxonomy/prompt_bank_source.json', {'version':'prompt-bank-1.0.0', 'families':extracted['bank']})
    write_json(ROOT/'taxonomy/task_routes.json', {'version':'task-routes-1.0.0',
               'routes':extracted['routes'],'bypass_scores':extracted['bypass']})
    tasks = list(extracted['routes'])
    subjects = ['math','science','writing','coding','social_studies','language_learning','general']
    string = {'type':'string','minLength':1}
    score = lambda high: {'type':'integer','minimum':0,'maximum':high}
    classifier = obj({'task_type':enum(tasks),'subject_area':enum(subjects)})
    write_json(ROOT/'prompts/classifier_source_requested.schema.json', classifier)
    classifier_ref = obj({**classifier['properties'],'student_goal':string,
                          'cognitive_process':enum([r['cognitive_process'] for r in extracted['routes'].values()])})
    write_json(ROOT/'prompts/classifier_reference.schema.json', classifier_ref)
    ep = {'response_score':score(2),'response_label':enum(['empty','partial','meaningful']),
          'reason':string,'feedback':string,'unlock_recommendation':enum(['allow','follow_up'])}
    write_json(ROOT/'prompts/evaluator_source_requested.schema.json',obj(ep))
    write_json(ROOT/'prompts/evaluator_reference.schema.json', obj({**ep,'additional_step_completed':{'type':'boolean'}}))
    contextual = obj({'intervention_family':enum(list(extracted['bank'])),'required_action':string,
                      'response_format':enum(['short_open_text','single_choice']), 'unlock_criterion':string,
                      'teach':string,'apply':string,'followup':string,'high_extra':string})
    write_json(ROOT/'prompts/contextualizer_reference.schema.json',contextual)
    fields = ['memory_explanation_score','own_words_score','transfer_score','verification_needed_identified',
              'verification_quality_score','incorrect_claim_detected']
    units = {'type':'array','minItems':4,'maxItems':4,'items':score(1)}
    final = obj({'scoring_id':string,'memory_explanation_score':score(4),'memory_units':units,
                 'own_words_score':{'type':['integer','null'],'minimum':0,'maximum':3},
                 'own_words_status':enum(['scored','not_scorable']), 'transfer_score':score(4),'transfer_units':units,
                 'verification_needed_identified':score(1),'verification_quality_score':score(2),
                 'incorrect_claim_detected':score(1),'reasons':obj({f:string for f in fields}),
                 'needs_review':{'type':'boolean'},'review_reason':{'type':'string'}})
    write_json(ROOT/'prompts/final_assessment_reference.schema.json',final)
    generic = {'version':'generic-template-1.0.0',
               'intervention_family':'general_reflection','title':'Pause before using this output',
               'teach':'AI text can be useful. Before using it, briefly check what you understand and what needs checking.',
               'apply':'In your own words, state the main idea you plan to use and name one claim or part you would check before relying on it.',
               'feedbackIfGood':'You identified an idea and something to check. Use that reflection when deciding how to use the output.',
               'takeaway':'Explain the idea and identify what needs checking before relying on it.',
               'gentleQuestion':'What is one step you want to take before using this output?',
               'gentleOptions':['Explain the main idea in my own words.','Identify something that needs checking.','Revise the output for my purpose.'],
               'followup':'Add the missing part: the main idea in your words, or one specific thing to check.',
               'highExtra':'Describe how you would check the part you identified.'}
    write_json(ROOT/'taxonomy/generic_template.json',generic)
    definitions = {
        'explanation':('Understand a concept, process, or relationship.','Explain why neurons fire.','A single factual date is factual_lookup.','Active comprehension'),
        'factual_lookup':('Retrieve a discrete fact, date, number, or short factual answer.','What year did this event occur?','Why/how a mechanism works is explanation.','Epistemic evaluation'),
        'writing_generation':('Compose new prose for a deliverable.','Draft an introduction to my essay.','Editing a supplied draft is revision.','Authorship and original generation'),
        'revision':('Modify existing writing for meaning, voice, clarity, or structure.','Make this paragraph clearer.','Creating prose without a draft is writing_generation.','Authorial intent and voice'),
        'problem_solving':('Solve a specific mathematical, scientific, logical, or multistep problem.','Solve 3x + 4 = 19 and explain each step.','Explaining the concept of an equation is explanation.','Multi-step reasoning'),
        'coding_help':('Write, debug, explain, or repair code.','Why does this loop skip the last item?','A conceptual explanation with no code focus can be explanation.','Debugging and causal reasoning'),
        'summarization':('Condense or synthesize provided source material.','Summarize the main ideas of this passage.','Writing a new passage is writing_generation.','Selection and synthesis'),
        'brainstorming':('Generate candidate ideas, options, or plans for selection.','Suggest three possible project topics.','Developing reasons for one claim is argumentation.','Idea evaluation and selection'),
        'argumentation':('Develop or evaluate claims using reasons, evidence, or opposing perspectives.','Give the strongest objection to this argument.','Listing possible topics alone is brainstorming.','Evidence weighing'),
        'translation':('Translate or examine meaning, grammar, or tone across languages/in language learning.','Translate this sentence and explain the verb form.','Same-language prose polishing is revision.','Linguistic processing'),
        'unknown':('Task goal cannot be determined from available context.','An isolated selected phrase without a task goal.','Do not force a label merely from the subject.','Undetermined'),
    }
    rows = []
    for task, route in extracted['routes'].items():
        definition, example, boundary, paper_process = definitions[task]
        rows.append({'task_type':task,'definition':definition,'example_request':example,'boundary':boundary,
                     'paper_process_at_risk':paper_process, **route,
                     'bypass_score':extracted['bypass'][task]})
    write_json(ROOT/'taxonomy/taxonomy_full.json',{'version':'taxonomy-1.0.0','tasks':rows})
    if (SUPP/'03_taxonomy_and_prompt_bank').exists():
        doc = '# Complete taxonomy and prompt bank\n\n'
        doc += 'The taxonomy lists all 11 task categories, their cognitive processes, intervention families, and bypass scores. The browser template bank and reference Generic template are reproduced in full. Release versions are listed below.\n\n'
        for row in rows:
            doc += f'## {row["task_type"]}\n\n'
            for key, value in row.items():
                if key != 'task_type': doc += f'- **{key}:** {value}\n'
            doc += '\n'
        doc += '## Complete browser intervention templates\n\nEach family includes Teach, Apply, feedback, takeaway, Gentle question and options, follow-up, and the High additional check. The browser selects these static templates; reference contextualization examples appear in the companion file.\n\n'
        for family, template in extracted['bank'].items():
            doc += f'### {family}\n\n'
            for key,value in template.items():
                doc += f'**{key}**\n\n'
                if isinstance(value,list): doc += '\n'.join(f'{i+1}. {v}' for i,v in enumerate(value))+'\n\n'
                else: doc += value+'\n\n'
        doc += '## Reference Generic template\n\n'
        for key,value in generic.items():
            doc += f'**{key}:** '+ ('; '.join(value) if isinstance(value,list) else value)+'\n\n'
        doc += '## Versions\n\nBrowser prompt bank: prompt-bank-1.0.0. Task routes: task-routes-1.0.0. Taxonomy definitions: taxonomy-1.0.0. Reference Generic template: generic-template-1.0.0. Reference prompts: reference-prompts-1.0.0. Browser extension: 1.1.1.\n'
        (SUPP/'03_taxonomy_and_prompt_bank/complete_taxonomy_and_prompt_bank.md').write_text(doc)
        promptdoc = '# Complete LLM prompt text\n\nBrowser and reference prompts, followed by their JSON schemas. Request construction and regeneration rules are specified in the companion README.\n\n'
        for p in sorted((ROOT/'prompts').glob('*.txt')):
            promptdoc += f'## {p.name}\n\n```text\n{p.read_text().rstrip()}\n```\n\n'
        for p in sorted((ROOT/'prompts').glob('*.schema.json')):
            promptdoc += f'## {p.name}\n\n```json\n{p.read_text().rstrip()}\n```\n\n'
        (SUPP/'02_complete_prompts/complete_prompts.md').write_text(promptdoc)
    print('Extracted 2 exact source prompts, 11 template families; built 6 schemas and full taxonomy.')


if __name__ == '__main__':
    main()
