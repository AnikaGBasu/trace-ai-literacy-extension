from pathlib import Path
import copy
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'analysis'))
from reference_requests import validate, regenerate, final_packet


class ReferenceContracts(unittest.TestCase):
    def evaluator(self):
        return dict(response_score=2,response_label='meaningful',reason='Specific and complete.',
                    feedback='You identified the claim and a check.',unlock_recommendation='allow',
                    additional_step_completed=True)

    def test_engagement_rejects_out_of_range_and_inconsistent_labels(self):
        for invalid in [-1,3,4,5,1.5]:
            value=self.evaluator();value['response_score']=invalid
            with self.assertRaises(ValueError):validate('evaluator',value,{'mode':'high'})
        value=self.evaluator();value['response_label']='partial'
        with self.assertRaises(ValueError):validate('evaluator',value,{'mode':'high'})

    def test_high_requires_additional_check(self):
        value=self.evaluator();value['additional_step_completed']=False
        with self.assertRaises(ValueError):validate('evaluator',value,{'mode':'high'})
        value['unlock_recommendation']='follow_up'
        validate('evaluator',value,{'mode':'high'})

    def test_only_two_regenerations_and_no_retry_for_transport(self):
        calls=[]
        def malformed(message):calls.append(message);return 'not json'
        with self.assertRaises(ValueError):regenerate('evaluator',{'mode':'medium'},malformed)
        self.assertEqual(len(calls),3)
        calls.clear()
        def unavailable(message):calls.append(message);raise ConnectionError('unavailable')
        with self.assertRaises(ConnectionError):regenerate('evaluator',{'mode':'medium'},unavailable)
        self.assertEqual(len(calls),1)

    def test_context_contract_cannot_change(self):
        contract=dict(intervention_family='active_recall',required_action='main idea and detail',
                      response_format='short_open_text',unlock_criterion='medium score >= 1')
        value={**contract,'teach':'Explain the idea to check understanding.',
               'apply':'Explain the main idea and a detail.','followup':'Add a detail.','high_extra':'What needs checking?'}
        validate('contextualizer',value,{'contract':contract})
        value['intervention_family']='verification'
        with self.assertRaises(ValueError):validate('contextualizer',value,{'contract':contract})

    def test_missing_comparator_is_not_invented(self):
        packet=final_packet(scoring_id='SYNTHETIC01',task_set='A',item_texts={'A-M':'Explain.'},
                            answer_key='A key',rubric_text='Rubric',responses={'memory':'A response'})
        fields=['memory_explanation_score','own_words_score','transfer_score',
                'verification_needed_identified','verification_quality_score','incorrect_claim_detected']
        value=dict(scoring_id='SYNTHETIC01',memory_explanation_score=1,memory_units=[1,0,0,0],
                   own_words_score=None,own_words_status='not_scorable',transfer_score=0,transfer_units=[0,0,0,0],
                   verification_needed_identified=0,verification_quality_score=0,incorrect_claim_detected=0,
                   reasons={f:'Submitted answer assessed against the key.' for f in fields},
                   needs_review=True,review_reason='Comparator unavailable.')
        validate('final_assessment',value,packet)
        bad=copy.deepcopy(value);bad['own_words_score']=3;bad['own_words_status']='scored'
        with self.assertRaises(ValueError):validate('final_assessment',bad,packet)
        bad=copy.deepcopy(packet);bad['condition']='personalized_extension'
        with self.assertRaises(ValueError):validate('final_assessment',value,bad)


if __name__=='__main__':unittest.main()
