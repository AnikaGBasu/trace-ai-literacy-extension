"""Reference packet and validation utilities. No network or model calls on import."""
from pathlib import Path
import json
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
FILES = {'classifier':'classifier_reference', 'contextualizer':'contextualizer_reference',
         'evaluator':'evaluator_reference', 'final_assessment':'final_assessment_reference'}
REGENERATION = ('Your previous output failed validation. Return a replacement JSON object that '
                'satisfies the supplied schema and unchanged task contract. Do not change the '
                "student's data or the scoring rubric.")
BLINDED_FIELDS = {'scoring_id','task_set','item_texts','answer_key','rubric_text','responses','ai_excerpt'}


def final_packet(*, scoring_id, task_set, item_texts, answer_key, rubric_text, responses, ai_excerpt=None):
    """Only explicitly named fields enter the scoring packet; caller deidentifies text."""
    return dict(scoring_id=scoring_id, task_set=task_set, item_texts=item_texts,
                answer_key=answer_key, rubric_text=rubric_text, responses=responses, ai_excerpt=ai_excerpt)


def validate(kind, value, packet):
    schema = json.loads((ROOT/'prompts'/f'{FILES[kind]}.schema.json').read_text())
    errors = list(Draft202012Validator(schema).iter_errors(value))
    if errors:
        # Do not include schema error messages that can echo student text.
        raise ValueError('JSON schema violation at an output field')
    if kind == 'classifier':
        routes = json.loads((ROOT/'taxonomy/task_routes.json').read_text())['routes']
        if value['cognitive_process'] != routes[value['task_type']]['cognitive_process']:
            raise ValueError('cognitive_process does not match task route')
    elif kind == 'contextualizer':
        for key in ['intervention_family','required_action','response_format','unlock_criterion']:
            if value[key] != packet['contract'][key]:
                raise ValueError('immutable contextualization contract changed')
        for key, limit in [('teach',70),('apply',55),('followup',55),('high_extra',55)]:
            if len(value[key].split()) > limit:
                raise ValueError('contextualization word limit exceeded')
    elif kind == 'evaluator':
        score = value['response_score']
        if value['response_label'] != ['empty','partial','meaningful'][score]:
            raise ValueError('response label does not match 0–2 score')
        mode = packet['mode']
        if mode not in {'gentle','medium','high'}:
            raise ValueError('effective mode is required')
        allow = mode == 'gentle' or (mode == 'medium' and score >= 1) or (
            mode == 'high' and score == 2 and value['additional_step_completed'])
        if value['unlock_recommendation'] != ('allow' if allow else 'follow_up'):
            raise ValueError('unlock recommendation does not match mode and score')
    elif kind == 'final_assessment':
        if set(packet) != BLINDED_FIELDS:
            raise ValueError('assessment packet must use only the blinded field allowlist')
        if value['scoring_id'] != packet['scoring_id']:
            raise ValueError('scoring identifier changed')
        for prefix in ['memory','transfer']:
            score_key = 'memory_explanation_score' if prefix == 'memory' else 'transfer_score'
            if sum(value[prefix+'_units']) != value[score_key]:
                raise ValueError('unit sum does not equal score')
        absent = not packet.get('ai_excerpt')
        if absent and (value['own_words_score'] is not None or value['own_words_status'] != 'not_scorable' or not value['needs_review']):
            raise ValueError('missing wording comparator must be marked not_scorable')
        if (value['own_words_score'] is None) != (value['own_words_status'] == 'not_scorable'):
            raise ValueError('own-words score/status mismatch')
        if value['needs_review'] and not value['review_reason'].strip():
            raise ValueError('review flag requires a reason')
    return value


def regenerate(kind, packet, completion):
    """completion(user_message) is supplied by the caller. Maximum 3 responses.

    Network exceptions propagate; this utility does not retry transport failures.
    Only malformed/invalid returned output triggers regeneration.
    """
    message = json.dumps(packet, ensure_ascii=False, indent=2)
    last_error = ''
    for attempt in range(3):
        extra = '' if not attempt else '\n\n'+REGENERATION+'\nValidation issue: '+last_error
        raw = completion(message+extra)
        try:
            value = json.loads(raw) if isinstance(raw,str) else raw
            return validate(kind,value,packet)
        except (ValueError, TypeError, KeyError) as error:
            last_error = 'Malformed JSON' if isinstance(error,json.JSONDecodeError) else 'Invalid schema or task contract'
    raise ValueError('Three invalid model outputs; review required')
