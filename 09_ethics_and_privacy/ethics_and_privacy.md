# Ethics, consent, and privacy

## Consent interaction

Participation required an affirmative button click on the consent form. Study participation was voluntary, and the intervention allowed participants to skip a reflection and continue. The companion participant-information document and HTML file provide a reference form with separate agreement and decline buttons.

## Data collection

Participant and task IDs link task outcomes, ratings, and interaction records. Copy-event processing uses the student prompt, relevant AI excerpt, selected text, copy-event type, selection and response lengths, elapsed time, and configured friction.

The study protocol specifies logging copy attempts across conditions, including event order, selection proportion, estimated reading time, processing ratio, risk score, intervention delivery and duration, evaluator score, follow-up, skip, and copy completion. Normal-condition copy events are evaluated silently.

## Browser data handling

| Data | Handling |
| --- | --- |
| Participant identifier | Locally generated ID in `chrome.storage.local` |
| Latest AI response and user prompt | Local `lastAIOutput` and `lastUserPrompt`, with timestamps; these fields can contain full texts |
| Classifier transmission | Up to 800 prompt characters, 2,000 AI-response characters, and 1,500 selected-text characters, plus event metadata |
| Evaluator transmission | Application question, submitted reflection, and intervention-family/risk/mode context |
| Destination | Direct OpenAI endpoint or configured backend |
| Event record | Participant/event ID, timestamp, page URL, selection length, latency, task/risk/family, mode, response score, follow-up/skip/copy status, reflection text, and diagnostic fields |
| Selected excerpts in event logs | Off by default; controlled by `saveSelectedExcerpts`. The setting is separate from classifier transmission. |
| Reflection text | Retained as `student_response` in local logs and exports |
| Log cap | Most recent 1,000 events |
| Clear Logs | Removes the study-log key; other settings and latest-context fields have separate storage keys |
| Credentials | Entered locally for direct API use or managed by the configured backend |

The source does not automatically anonymize transmitted text. Removing names from a record is insufficient to anonymize free text or chat URLs.

## Submission data

The task dataset contains study pseudonyms P01–P35, task IDs, condition allocation, task-set labels, and numeric outcomes. It contains 105 rows. Survey and preference results are provided as manuscript-level aggregates.

The archives exclude student answer text, free-text reflections, browser logs, chat URLs, precise interaction timestamps, contact details, account identifiers, institution names, credentials, browser storage, and identity mappings. Document author and organization properties are empty. Archive entries use relative paths; SHA-256 manifests identify file contents.

## Event-export anonymization procedure

Prepare an export copy. Remove names, contacts, URLs, account identifiers, exact timestamps, API settings, prompts, selected passages, reflections, free-text skip reasons, and diagnostic error text. Retain analysis variables and replace identifiers using a mapping stored separately. Express timing as elapsed durations and event order. Review categorical fields and small cells for indirect identification. Document every retained field and inspect the final archive, including document properties.
