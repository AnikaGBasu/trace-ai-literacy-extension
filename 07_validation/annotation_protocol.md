# Reference annotation protocol

Protocol version: annotation-1.0.0. The worksheets and procedure below support a 100-case risk evaluation and a 100-response engagement evaluation.

## Risk-example selection



1. Freeze a deidentified copy-event pool and record its version, extraction date, and inclusion criteria before examining human agreement. Eligible events require a known task context, complete selected/full-response lengths, selected word count, and a valid nonnegative latency. Exclude practice, duplicate events, failed capture, and missing-input fallback events; record each reason.
2. Compute system risk with the frozen code/version. Sample without replacement using seed `20260907`, aiming for 34 low, 33 medium, and 33 high cases. Sampling is stratified to cover the three bands; its accuracy estimate is conditional on this sample and is not a natural-prevalence accuracy estimate. If any stratum is undersupplied, report the shortage and revise the sampling plan before annotation rather than silently duplicating cases.
3. Within available strata, inspect coverage of task routes and participants. Record each case's source participant pseudonym in the restricted selection log to identify clustering; omit it from the annotator display. Preserve the exact selected IDs and the full candidate count, not just the random seed.
4. Prepare randomly ordered case cards with the student goal/context, deidentified selected/AI text where necessary, lengths, elapsed time, and task type. Withhold system risk labels, score components, intervention response, condition, and task outcomes.
5. Ask the research-team member and educator to assess the likelihood that the copy event bypasses the student's intended cognitive work using the instructions below. Keep their initial records separate if independent judgments are collected.
6. Freeze the agreed human reference labels before comparing them with the system. Retain disagreements and reconciliation reasons in a restricted audit record. Supply only deidentified labels and non-identifying reasons for release.

### Risk annotator instructions

“Judge this event, not the student's character. Consider how much of the AI response is being adopted, whether the elapsed time plausibly allowed processing of the selected passage, and whether adopting the answer could replace the cognitive work intended by the task. Copying itself is not misconduct. Use **low** when little intended cognitive work appears bypassed, **medium** when the evidence is mixed or some work may be bypassed, and **high** when direct adoption plausibly substitutes for substantial intended work with little sign of processing. Give a brief reason grounded in the case. If the context is insufficient, mark the case unrateable; do not force a label.”

These human judgments are an external plausibility comparison. A separate **calculation audit** may use the exact C/L/B cutoffs in Section 04, but must not be mislabeled as independent cognitive-risk validation.

## Evaluator-response selection

1. Freeze a pool of actual intervention responses with the exact question, required action, friction mode, any required extra check, and a deidentified response. Include relevant empty/filler submissions as eligible 0 candidates; distinguish a missing technical record from an intentionally empty response.
2. Exclude practice, duplicate stored copies of the same response, missing-question cases, and unavailable-model fallbacks. Keep initial responses and follow-ups identifiable as stages; sample one response stage per event to avoid treating duplicate versions as independent cases.
3. Sample 100 unique response stages without replacement using seed `20260907`, targeting 34 model-0, 33 model-1, and 33 model-2 examples if the pool supports it. Record achieved counts, eligibility/exclusion counts, and coverage of families and participants. Record the sampling strata alongside the agreement estimate.
4. Shuffle the display order. Provide the two annotators with the exact question, required action, any extra check, response, and the **0–2** rubric. Hide model scores/feedback, condition, and participant outcomes.
5. For joint labeling, the team member and educator examine each response together and agree on one reference score with a short rationale. If independent first ratings are collected, preserve them separately from the final joint label.
6. Freeze the reference scores before revealing the evaluator's scores. Compare exact integer matches; adjacent-category disagreements still count as disagreements.

### Evaluator annotator instructions

“Use the actual requested action. Assign **0** to no meaningful engagement, **1** to relevant but vague/incomplete engagement, and **2** to specific engagement that completes the requested reflection/check. Do not use a 1–5 scale. Do not reward length, agreement, confidence, or polished language. Briefly identify the evidence supporting the score. If the question or response is technically missing, flag the case rather than assigning a performance score.”

## Disagreement and reporting

Document each annotator's initial label if collected, the agreed reference label, the point of disagreement, and the rubric clause used to resolve it. Discuss against the rubric without seeing the model label. If agreement cannot be reached, retain `unresolved` and report it; do not drop it without a count or substitute a new favorable case. Any rubric change creates a new version and requires rescoring all affected cases under that version. Report the number of resolved, unresolved, and unrateable cases.

The included `analysis/validate_annotations.py` consumes actual completed labels, requires 100 complete unique examples, and writes confusion matrices, per-category support/agreement/precision, overall agreement, and the original reported-total crosscheck. The 100-row worksheets provide the input columns. The script requires completed human and system labels.
