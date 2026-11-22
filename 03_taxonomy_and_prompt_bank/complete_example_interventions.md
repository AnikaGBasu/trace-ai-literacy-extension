# Complete example interventions

Illustrative interventions • reference-examples-1.0.0. Examples show context, routing, prompt text, response, evaluator JSON, and copying decision.

## Example 1 — action-potential explanation, High friction

**Student prompt:** “Explain how an action potential carries a message along a neuron.”

**Selected AI-output context:** An explanation of a changing membrane voltage, propagation along an axon, and signaling at the terminal.

**Classification:** `task_type=explanation`; `subject_area=science`; `student_goal=understand_concept`; `cognitive_process=comprehension`; `intervention_family=active_recall`.

**Illustrative risk features:** C=2, L=1, B=1; R=4/6, band score 0.67, high. 

**Teach:** “An explanation can feel familiar before you can reconstruct it. Explaining the signal's journey yourself helps you check which links you understand.”

**Apply:** “In your own words, explain the main idea of how the signal moves along the neuron and name one part of the process that matters.”

**Additional check:** “Which link in that explanation would be hardest to explain without the AI text?”

**Example student response:** “The voltage change triggers the next region of the membrane, so the signal is renewed along the axon. The part I am least sure about is how arrival at the terminal leads to a message for the next cell.”

**Illustrative evaluator JSON:**

```json
{"response_score":2,"response_label":"meaningful","reason":"The response reconstructs propagation and identifies a specific uncertainty for the additional check.","feedback":"You explained the signal's movement and located a useful question about communication at the terminal.","additional_step_completed":true,"unlock_recommendation":"allow"}
```

**Outcome:** High criterion met; copying enabled. A skip remains available without penalty.

## Example 2 — factual verification with one follow-up

**Student prompt:** “Does a new user get equally good personalized recommendations immediately?”

**Selected AI-output context:** A claim that a user's lack of history makes no difference to collaborative-filtering personalization.

**Classification:** `task_type=factual_lookup`; `subject_area=coding`; `student_goal=verify_claim`; `cognitive_process=evidence_checking`; `intervention_family=verification`.

**Illustrative risk features:** C=2, L=2, B=0; R=4/6, high. Friction selected for this demonstration: Medium.

**Teach:** “A confident statement about a system's limits still needs evidence. A useful check names both the claim and a suitable independent source.”

**Apply:** “Name the claim about new-user recommendations you would verify and where you would check it.”

**First example response:** “Whatever, just copy it.”

**Illustrative evaluator JSON:**

```json
{"response_score":0,"response_label":"empty","reason":"The response does not identify a claim or a verification source.","feedback":"Name the new-user claim and one independent place you could check it.","additional_step_completed":true,"unlock_recommendation":"follow_up"}
```

**Follow-up:** “Which part of the new-user claim would you check, and where?”

**Example follow-up response:** “I would check whether no history affects personalization in technical documentation on collaborative filtering and cold start.”

**Illustrative evaluator JSON:**

```json
{"response_score":2,"response_label":"meaningful","reason":"The response identifies the no-history claim and a relevant independent source type.","feedback":"You chose a specific limitation and a source that can explain the assumptions behind it.","additional_step_completed":true,"unlock_recommendation":"allow"}
```

**Outcome:** Copying enabled. Only one follow-up was used; no score above 2 was needed.

## Example 3 — writing generation and authorship

**Student prompt:** “Write a short introduction arguing that our class should create a shared reading corner.”

**Selected AI-output context:** A polished draft describing comfort, access to books, and peer recommendations.

**Classification:** `task_type=writing_generation`; `subject_area=writing`; `student_goal=compose_own_response`; `cognitive_process=authorship`; `intervention_family=authorship_reflection`.

**Illustrative risk features:** C=2, L=0, B=2; R=4/6, high. Friction: High.

**Teach:** “A draft can help organize an idea, while your final wording should reflect choices you can explain. Identify your contribution before adopting the text.”

**Apply:** “What idea about the reading corner is yours, and how would you express it in your own voice?”

**Additional check:** “Which part of the draft would you leave out or change because it does not match your meaning?”

**Example response:** “My idea is that classmates could recommend books directly to each other. I would write, ‘A reading corner could help us find books through friends' suggestions.’ I would remove the claim that it will make everyone enjoy reading, because that promises too much.”

**Illustrative evaluator JSON:**

```json
{"response_score":2,"response_label":"meaningful","reason":"The response identifies an original idea, supplies independent wording, and rejects a specific overstatement.","feedback":"You kept your purpose and revised a claim you could not justify. Those choices make the draft reflect your judgment.","additional_step_completed":true,"unlock_recommendation":"allow"}
```

**Outcome:** Copying enabled after the completed reflection/check.

## Example 4 — the standardized Generic condition

**Context:** Any copy event in the manuscript's always-on condition. Use the same template wording across topics; do not substitute a topic-specific question. 

**Teach:** “AI text can be useful. Before using it, briefly check what you understand and what needs checking.”

**Apply:** “In your own words, state the main idea you plan to use and name one claim or part you would check before relying on it.”

**Example response:** “Confirmation bias can make me favor information that fits my belief. I would check the claim that showing someone opposing evidence automatically removes the bias.”

**Illustrative feedback:** “You identified an idea and something to check. Use that reflection when deciding how to use the output.”

**Illustrative engagement score, if evaluated:** 2. **Outcome:** Standardized reflection completed; copying enabled.
