const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
for (const file of ['classifier.js','interventions.js','responseEvaluator.js','unlockPolicy.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../source_extension_code',file),'utf8'), sandbox);
}
const root = sandbox.window.BeforeYouCopy;
const c = root.classifier, p = root.unlockPolicy;
const text238 = Array(238).fill('word').join(' ');
const event = (fraction, latency) => ({ selected_text_length: 1200,
  ai_response_length: 1200/fraction, selected_text:text238, time_since_response:latency });

test('reading rate is exactly 238 words per minute', () => {
  assert.equal(c.estimateReadingTimeSeconds(text238),60);
});
test('factual lookup retains a zero bypass score', () => {
  const r = c.computeOffloadingRisk(event(.1,60),'factual_lookup');
  assert.equal(r.task_score,0); assert.equal(r.risk_score,0); assert.equal(r.risk_level,'low');
});
test('copy and processing boundaries include the intended equalities', () => {
  for (const [fraction, score] of [[.249,0],[.25,1],[.75,1],[.751,2]])
    assert.equal(c.computeOffloadingRisk(event(fraction,60),'explanation').copy_proportion_score,score);
  for (const [seconds, score] of [[0,2],[14.999,2],[15,1],[44.999,1],[45,0]])
    assert.equal(c.computeOffloadingRisk(event(.5,seconds),'explanation').copy_latency_score,score);
  assert.equal(c.computeOffloadingRisk(event(.5,null),'explanation').copy_latency_score,1);
});
test('all seven attainable risk values have explicit bands', () => {
  const expected = ['low','low','low','medium','high','high','high'];
  expected.forEach((label,total) => assert.equal(c.deriveRiskLevelFromScore(total/6),label));
});
test('medium and high unlock only at achievable 0–2 thresholds', () => {
  assert.equal(p.decide({mode:'medium',response_score:0,followup_used:false}).action,'follow_up');
  assert.equal(p.decide({mode:'medium',response_score:1}).action,'unlock');
  assert.equal(p.decide({mode:'high',response_score:1,additional_step_completed:true}).action,'follow_up');
  assert.equal(p.decide({mode:'high',response_score:2,additional_step_completed:true}).action,'unlock');
  assert.equal(p.decide({mode:'high',response_score:2,additional_step_completed:false}).action,'follow_up');
  assert.equal(p.decide({mode:'high',response_score:0,followup_used:true}).action,'offer_skip');
  assert.equal(p.decide({mode:'high',response_score:0,skipped:true}).action,'unlock');
});
test('evaluator sanitization never exports engagement outside 0–2', () => {
  for (const score of [-5,0,1,2,3,5,100,'bad',null,undefined]) {
    const result = root.responseEvaluator.sanitizeEvaluation({response_score:score},root.interventions.INTERVENTIONS.general_reflection);
    assert.ok([0,1,2].includes(result.response_score));
  }
});
test('classification keeps full local risk inputs out of the API payload', async () => {
  let sent;
  root.llmClient = {callJson: async request => {
    sent = JSON.parse(request.userPrompt);
    return {task_type:'explanation',subject_area:'science'};
  }};
  const r = await c.classifyCopyEvent({student_prompt:'Explain a concept',ai_response_excerpt:'x'.repeat(2000),
    ai_response_length:10000, selected_text:'word',selected_text_for_risk:text238,
    selected_text_length:1200,time_since_response:15});
  assert.equal(r.risk_score,2/6);
  assert.equal(r.risk_level,'low');
  assert.ok(!('ai_response_length' in sent));
  assert.ok(!('selected_text_for_risk' in sent));
});
