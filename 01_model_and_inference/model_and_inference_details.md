# Model and inference details

Implementation reference: `10_code_and_data/source_extension_code/`, extension version 1.1.1.

| Setting | Value or implementation |
| --- | --- |
| Provider | OpenAI for the direct API path; a user-configured backend can instead receive requests |
| Exact configured model identifier | `gpt-4o-mini` |
| API endpoint | `POST https://api.openai.com/v1/chat/completions` |
| API style | Chat Completions, direct HTTP `fetch`; no OpenAI SDK dependency |
| Messages | One `system` message and one `user` message |
| Temperature | **0.1**, explicitly set for classifier and intervention-response evaluator |
| top_p | **API default** — omitted |
| max_tokens / max_completion_tokens | **API default** — neither field is sent; no explicit output-token limit |
| seed | **API default** — omitted |
| frequency_penalty | **API default** — omitted |
| presence_penalty | **API default** — omitted |
| n | **API default** — omitted |
| stop | **API default** — omitted |
| stream | **API default** — omitted; code consumes a completed JSON HTTP response |
| logit_bias, logprobs, top_logprobs | **API default** — omitted |
| service_tier, user, store | **API default** — omitted |
| response_format | Explicit `{ "type": "json_object" }` on direct OpenAI calls |
| Strict JSON-schema mode | Not requested; no `json_schema` or `strict: true` in browser client |
| Tools/function calling | Not requested |
| Network/HTTP retry count | **0** automatic retries in browser client; failed calls are handled by fallback |
| Schema-regeneration retries | **0** in the browser classifier/evaluator; reference regeneration rules appear in Section 02 |
| UI timeout | 12,000 ms for classifier; 12,000 ms for evaluator |
| Timeout behavior | `Promise.race` releases the UI to a fallback; it does not abort the underlying `fetch` |

“API default” means the request leaves that parameter unset. No numeric provider default is substituted for an omitted parameter. For a backend, the browser sends `system_prompt`, `user_prompt`, `temperature`, `response_format: "json_object"`, and `task`; it does not transmit the model identifier. The backend controls its model identifier, token limits, defaults, and retry policy.

## Calls present in the browser code

| Task identifier | System prompt | User message |
| --- | --- | --- |
| `copy_event_classifier` | Complete source prompt in Section 02 | Pretty-printed JSON containing `student_prompt`, `ai_response_excerpt`, `selected_text`, `event_type`, `time_since_response`, `selected_text_length`, `user_mode` |
| `reflection_evaluator` | Complete source prompt in Section 02 | Pretty-printed JSON containing `intervention_family`, `cognitive_risk`, `risk_level`, `mode`, `application_question`, `student_response`, `rubric` |

Classifier excerpt limits: student prompt 800 characters; AI excerpt 2,000 characters; selected text 1,500 characters. These are JavaScript string lengths, not model-token limits. The browser source separately supplies the full selected text and full AI-response length to **local** risk calculation; those additional fields are not added to the model user message.

The browser implements classification and response evaluation. Section 02 additionally supplies reference prompts and strict validation schemas for contextualization and final-assessment scoring. These reference operations use the separate request utility in `analysis/reference_requests.py`.

## Parsing and fallback behavior

The API response is read from `choices[0].message.content`. JSON parsing takes the substring between the first `{` and last `}` if present. Backend responses may wrap JSON in `result`, `json`, `content`, or a Chat Completions `choices` structure, or supply the object directly.

Classifier failure yields `task_type: "unknown"`, medium risk, nominal `risk_score: 0.5`, and a manual-task-choice flag. In As-needed timing this fallback is below the high-risk trigger and copying proceeds without a reflection. In Constant timing a manual task selector can appear. This nominal fallback score is not a calculated `(C+L+B)/6` score.

Evaluator failure assigns 1 to a nonempty response and 0 to an empty response; the timeout path follows the same rule. These are fallback values, not verified engagement judgments. Normal evaluation sanitization converts the result to a number, rounds to an integer, clamps to 0–2, and supplies missing feedback fields. It does not reject every invalid schema or retry. High mode uses a score of 2 together with completion of the additional check; Medium uses at least 1.
