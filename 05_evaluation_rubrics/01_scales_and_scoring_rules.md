# Evaluation rubrics and score boundaries

Reference rubrics and scoring examples • rubrics-1.0.0.

## Scale register

| Construct | Allowed values | Unit |
| --- | --- | --- |
| Intervention-response engagement | **0, 1, 2 only** | One response to an intervention; first response and follow-up should be distinguished |
| Memory / explanation | 0, 1, 2, 3, 4 | Unaided task explanation |
| Own-words processing | 0, 1, 2, 3 | Same unaided explanation, rated independently |
| Transfer | 0, 1, 2, 3, 4 | Unaided application to the new scenario |
| Identifies need to verify | 0 or 1 | Recognition answer before the explicit verification-plan request |
| Verification quality | 0, 1, 2 | Quality of the requested verification plan |
| Detects incorrect claim | 0 or 1 | Identification of the planted questionable claim |
| Confidence; task and survey annoyance; comparison survey ratings | 1, 2, 3, 4, 5 | Participant self-report; never an engagement score |
| Confidence-calibration error | Nonnegative numeric value | Recorded derived outcome; lower values indicate closer calibration |

## General scoring instructions

Score only the requested construct using the relevant task key. Accept equivalent wording, valid examples, accurate diagrams described in text, and correct reasoning without technical jargon. Do not reward length, fluency, advanced vocabulary, agreement with the intervention, or favorable survey ratings. Do not penalize spelling or grammar unless meaning becomes indeterminate. Do not infer a student's demographic characteristics, motivation, misconduct, or ability from a response.

For a submitted “I don't know,” irrelevant text, or an empty submitted answer, apply the rubric's zero anchor. A missing record caused by withdrawal or technical loss is **missing**, not a score of zero. The 105 task outcome records contain no missing scores.

For point-based memory and transfer scoring, award each keyed unit independently, one point at most per unit. A claim immediately contradicted by the same response does not earn that unit unless the student explicitly resolves the contradiction. Do not subtract additional points after withholding credit. A misconception about one unit does not cancel another clearly correct unit. Record the supporting span and any unresolved ambiguity for each decision.

## Memory / explanation, 0–4

Each task has four task-specific content units in `02_task_answer_keys.md`. Award one point for each correct unit. Score **0** for none, **1** for one, **2** for two, **3** for three, and **4** for all four. A list of topic words without their relationships does not automatically earn a point. The examples in the answer key illustrate every score for every task.

## Own-words processing, 0–3

Assess reconstruction of the same explanation independently from scientific accuracy. Use the retained, deidentified AI excerpt only as a wording comparator. Technical terms alone do not establish copying.

| Score | Anchor | Example using the comparator below |
| --- | --- | --- |
| 0 | No assessable reconstruction: empty/irrelevant response, or essentially copied wording and structure throughout. | “Collaborative filtering recommends items by comparing patterns of user preferences. Similar users may like similar items.” |
| 1 | Mainly retains the comparator's sentence structure and sequence, with local substitutions or one limited original addition. | “Collaborative filtering suggests things by comparing users' preference patterns. Similar people may enjoy similar things.” |
| 2 | Mostly reconstructs the explanation in independently composed language or organization; one passage remains closely dependent on the comparator or the reorganization is limited. | “A service can use the choices of people whose ratings resemble mine. Similar users may like similar items, so it suggests an item I have not tried.” |
| 3 | Clearly reconstructs relationships with independent organization, explanation, or a fitting original example; no substantial verbatim passage beyond necessary terms. | “Imagine two listeners whose ratings keep matching. A song one listener enjoys can become a candidate for the other, even before that listener has heard it. The match is useful evidence, not a promise.” |

Example comparator: “Collaborative filtering recommends items by comparing patterns of user preferences. Similar users may like similar items.” These examples are rubric anchors. In actual scoring, use that task's actual comparator. If it is unavailable, return `not_scorable` for own-words comparison and route to review; do not invent an AI excerpt or treat short common phrases as proof of copying.

## Transfer, 0–4

Each novel scenario has four task-specific reasoning units in the answer key: an appropriate prediction or diagnosis, a mechanism connecting it to the concept, a scenario-specific consequence or feasible next step, and a justified boundary or qualification. Award one point per unit. These are keyed to the scenario, not points for merely using the words “because” or “however.”

## Verification recognition, 0–1

Use V1 only. **1:** The student explicitly identifies at least one specific claim as needing an outside check, including a conditional decision such as “I am unsure, so I would check A2.” The claim need not be the planted false claim. **0:** The student declines an outside check, accepts the claims solely because the AI sounds confident, gives no relevant recognition, or is merely unsure without identifying a check. A generic assertion “AI can be wrong” with no connection to a listed claim is insufficient.

Examples: **0** “No; the answer sounds scientific.” **1** “I would check A2 because the claim that stronger stimulation increases each spike's height needs evidence.”

## Verification quality, 0–2

Use V2 independently of V1 and V3. It is possible to show no spontaneous recognition at V1 but give a good plan when explicitly asked at V2. The three items are scored independently.

| Score | Anchor | Example |
| --- | --- | --- |
| 0 | No actionable, relevant plan; repeats the claim, appeals only to the same AI, or gives an unrelated source. | “I would ask the chatbot if it is sure.” |
| 1 | Identifies a relevant claim or issue and a plausible but underspecified source/check; omits what evidence would resolve the issue. | “I would check A2 in a biology textbook.” |
| 2 | Identifies the claim, chooses an appropriate independent source, and specifies the information or comparison needed to confirm, qualify, or correct it. | “For A2, I would use the action-potential section of a biology textbook and compare spike amplitude with firing frequency as stimulus strength changes. If amplitude stays similar while frequency changes, I would correct the claim.” |

Do not require a live search, exact URL, named paper, or completed empirical study. A correct plan is assessable while outside materials are unavailable. An authoritative-sounding but irrelevant source does not earn 2.

## Incorrect-claim detection, 0–1

Use V3 only. **1:** Selects the planted claim (A2, B3, or C1) as questionable/incorrect; uncertainty may accompany a correct identification. **0:** Selects another claim, accepts all claims, or gives no identification. The requested explanation is retained for audit, but this binary outcome records identification; do not silently make it a second 0–2 quality scale. If multiple claims are selected indiscriminately, return 0 unless the planted claim is clearly distinguished as the deliberately erroneous one.

Examples: **0** “B1 is wrong; recommendations cannot use interactions.” **1** “B3: there is no personal history to identify this user's preferences.”

## Intervention-response engagement, 0–2

| Score | Manuscript anchor | Active-recall example | Verification example |
| --- | --- | --- | --- |
| **0** | No meaningful engagement: empty, irrelevant, filler. | “ok thanks” | “just let me copy” |
| **1** | Partial engagement: relevant but vague or incomplete. | “Neurons send messages.” | “I should check the facts online.” |
| **2** | Meaningful engagement: specific and completes the requested reflection or verification. | “The neuron's membrane voltage changes briefly, and that change is regenerated along the axon so the signal reaches the terminal.” | “I would check whether a stronger stimulus makes each spike taller in an independent biology text, looking for the difference between spike size and firing frequency.” |

Score relative to the actual question. If the prompt asks for a main idea **and** a detail, both are needed for 2. If it asks for a claim **and** where to check, both are needed for 2. A short complete answer may earn 2. A long filler answer earns 0. Correct terminology without the requested explanation can earn at most 1. Engagement is a low-stakes interface judgment, not a final-assessment grade or a verified measure of factual mastery.

Friction decisions: Gentle enables copying after an answer or skip. Medium enables copying for **1 or 2**; **0** produces at most one follow-up. High enables copying for **2** after the additional reflection/check has been completed. An optional bypass remains available during voluntary participation. No path requires 3, 4, or 5 engagement points. Unavailable model evaluation and user skips are flagged separately from meaningful engagement.
