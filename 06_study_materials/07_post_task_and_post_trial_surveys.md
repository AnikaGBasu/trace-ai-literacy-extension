# Post-task and post-trial surveys

Reference instrument • materials-1.0.0.

## Post-task core items — all three conditions

Record these once per round using the prompts in each task packet:

| Field | Exact item | Anchors |
| --- | --- | --- |
| confidence_rating | How confident are you that your explanation and application answers are correct? | 1 Not at all; 2 Slightly; 3 Moderately; 4 Very; 5 Extremely confident |
| task_annoyance_rating | How annoyed did you feel by the interface while completing this learning task? | 1 Not at all; 2 Slightly; 3 Moderately; 4 Very; 5 Extremely annoyed |

Confidence is collected before claim exposure. Annoyance refers to the learning interface during the whole round. Do not replace either item with the intervention response-engagement score. `confidence_calibration_error` is a derived analysis field; participants are not asked to calculate it.

## Post-trial introduction

You have finished all three learning rounds. Think about each version in which a reflection prompt could appear. Use the condition labels shown in the study: **Generic** and **Personalized**. Rate each version separately based on what you experienced. There is no preferred answer. You may choose “Not applicable — I did not experience this” or “Prefer not to answer.”

## Core comparison items

For each row, enter one Generic rating and one Personalized rating.

| Field suffix | Statement | Generic | Personalized |
| --- | --- | --- | --- |
| understanding_help_rating | This version helped me understand the topic. | 1–5 | 1–5 |
| verification_help_rating | This version helped me think about checking AI-generated claims. | 1–5 | 1–5 |
| effort_reasonable_rating | The effort this version asked of me was reasonable. | 1–5 | 1–5 |
| agency_rating | I felt in control of how I used the AI output. | 1–5 | 1–5 |
| would_use_again | I would choose to use this version again for schoolwork. | 1–5 | 1–5 |

Agreement anchors: **1 Strongly disagree; 2 Disagree; 3 Neither agree nor disagree; 4 Agree; 5 Strongly agree**.

Rate separately: **“Overall, how annoying did you find this version?”** Generic ___; Personalized ___. Store as `generic_annoyance_rating` and `personalized_annoyance_rating`. Anchors: **1 Not at all annoyed; 2 Slightly annoyed; 3 Moderately annoyed; 4 Very annoyed; 5 Extremely annoyed**.

The `would_use_again` fields are ordinal **1–5 ratings**, despite lacking `_rating` in their names. They are not binary outcomes.

## Additional comparison items

The comparison instrument also covers prompt relevance, repetitiveness, interruption frequency, and willingness to keep the tool enabled.

| Field suffix | Exact item | Anchors |
| --- | --- | --- |
| prompt_relevance_rating | The reflection prompts were relevant to what I was trying to do. | Agreement 1–5 |
| repetitiveness_rating | The reflection prompts felt repetitive. | Agreement 1–5 |
| interruption_frequency_rating | How often did a reflection interrupt you at a moment when you did not want one? | 1 Never; 2 Rarely; 3 Sometimes; 4 Often; 5 Very often |
| keep_enabled_rating | I would keep this version enabled during similar schoolwork. | Agreement 1–5 |

Collect each item for Generic and Personalized. Do not combine these responses into a composite without a specified scoring rule. “Not applicable” is not a neutral score of 3.

## Preference item

**If you could choose one of the three versions for similar schoolwork, which would you choose?**

- Normal ChatGPT — no visible reflection prompts.
- Generic — a standardized reflection at every copy attempt.
- Personalized — selected copy attempts receive a task-specific reflection and feedback.
- Prefer not to answer.

Store a selected study condition using `normal_chatgpt`, `generic_extension`, or `personalized_extension`. Keep a skipped/prefer-not-to-answer preference missing. These neutral descriptions identify the interfaces without telling the participant which one should be more effective.
