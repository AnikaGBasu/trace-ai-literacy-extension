# Complete prompts, schemas, and regeneration rules

The plain-text prompts in `10_code_and_data/prompts/` are reproduced in full in `complete_prompts.md`.

| File | Function |
| --- | --- |
| task_classifier_as_implemented.txt | Browser classifier: task and subject; goal and cognitive process are supplied by the local task map |
| response_evaluator_as_implemented.txt | Browser intervention-response evaluator: engagement scores 0, 1, or 2 |
| task_classifier_reference.txt | Reference four-field task classifier with category boundaries and unknown handling |
| intervention_contextualizer_reference.txt | Reference contextualizer that preserves the selected intervention contract |
| response_evaluator_reference.txt | Reference evaluator with strict 0–2 validation and an explicit additional-check field |
| final_assessment_scorer_reference.txt | Reference condition-blind final-assessment scorer using task-specific keys |

Reference prompt version: **reference-prompts-1.0.0**. The two browser prompts are exported directly from `classifier.js` and `responseEvaluator.js` in extension version 1.1.1.

## User-message construction

The browser serializes each request with `JSON.stringify(payload, null, 2)`.

Classifier fields: `student_prompt`, `ai_response_excerpt`, `selected_text`, `event_type`, `time_since_response`, `selected_text_length`, and `user_mode`.

Evaluator fields: `intervention_family`, `cognitive_risk`, `risk_level`, `mode`, `application_question`, `student_response`, and `rubric`. The literal rubric payload is: “0 for no meaningful engagement, 1 for partial engagement that is relevant but vague or incomplete, 2 for meaningful engagement that is specific and complete”.

Reference packets are defined in `analysis/reference_requests.py`; complete examples appear in `prompts/example_request_packets.json`. The final-assessment packet includes the complete item text, rubric, and task key.

## JSON schemas

Schemas are provided for the two browser-requested output shapes and all four reference operations. The browser uses OpenAI JSON-object mode and permissive parsing. The reference schemas require every listed field and set `additionalProperties: false`.

Reference validation checks task-to-process routing, preservation of the contextualizer's four immutable contract values, score-label consistency, mode-specific recommendations, text limits, rubric-unit sums, and own-words scoring status. These checks are implemented in `analysis/reference_requests.py`.

## Regeneration and failure rules

**Browser calls:** no automatic HTTP retries or structural regeneration. Parse failures invoke fallback. The UI timeout is 12 seconds and does not cancel the underlying request. Evaluator fallback is 0 for an empty response and 1 for a nonempty response.

**Reference calls:** one initial response plus at most **two structural regeneration attempts**. Retain the same system prompt and input packet. Append this instruction:

“Your previous output failed validation. Return a replacement JSON object that satisfies the supplied schema and unchanged task contract. Do not change the student's data or the scoring rubric.”

Include the bounded structural validation error, excluding response text and credentials. Transport errors receive no network retries. After three invalid outputs, fail for review; contextualization may fall back to the unchanged template. A valid judgment is not regenerated to obtain a different score.

The reference utility accepts a completion callback; it performs no network request itself. Browser calls and reference utilities have separate entry points.
