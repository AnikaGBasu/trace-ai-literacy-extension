# Condition blinding and scoring record

The paper specifies fixed, condition-blind scoring. The following reference packet procedure separates assessment content from condition and participant metadata.

1. A data preparer assigns a random scoring ID to each assessment response. Keep the study-ID/condition/round mapping in a separate restricted file outside the scorer's packet and outside the public release.
2. The scorer receives only the scoring ID, task-set identifier, exact item text, task-specific rubric/key, written answer, and, for own-words comparison only, the relevant deidentified AI wording. Do not send condition, condition order, task order, intervention text, reflection/evaluator scores, survey ratings, preference, filenames encoding condition, or participant identifiers.
3. Where a response explicitly names the condition, replace only that incidental label with `[interface label removed]`. Preserve substantive response content. Record this edit in the restricted masking log. If masking would remove evidence needed for scoring, flag the case for review.
4. Randomize scoring order using a stored seed, independently of presentation order. Do not group records by participant or condition. Use the same rubric and model settings across all sets and conditions.
5. Validate the output against the final-assessment JSON schema. For a structurally invalid output, repeat the same masked packet with the structural correction instruction, at most twice. For semantic ambiguity, record a review flag and obtain a condition-blind human decision. Do not repeatedly sample until a desired score appears.
6. Freeze the scoring file and its hash before the data preparer rejoins condition labels. Log the rubric and prompt versions with every record. Corrections after unblinding require an explicit reason and retained original value.

The numeric analysis uses the recorded final task scores; scoring packets are a separate workflow.
