# Study administration protocol

Reference instrument • materials-1.0.0.

## Session sequence

1. Show the consent/assent information and record the participant's affirmative form-button selection before any study task. Use the participant's study ID throughout. See Section 09 for the consent information and form template.
2. Administer the presurvey privately. Do not show the participant other people's answers or a suggested response.
3. Introduce the ChatGPT interface, study-note workspace, copy operation, popup response, and optional skip. Complete the separate practice task. Exclude practice outcomes and events from experimental analyses.
4. Follow the participant's assigned sequence. Each participant completes all three conditions and all three sets once. Use a fresh conversation and empty notes for each round.
5. Present the assigned task page. Start a timer for **seven minutes of active ChatGPT interaction**. Pause this timer while an intervention is visible, resume on dismissal, and separately record the intervention duration. Do not deduct reflection time from the seven minutes.
6. Allow follow-up questions, copying, paraphrasing, and independent note writing. Provide no content coaching. Other AI systems, web search, and external reference materials are unavailable during the learning period.
7. At seven active minutes, hide ChatGPT and notes. Administer memory and transfer first. Collect confidence before showing the verification claims or corrective information. Then administer verification recognition, verification plan, and incorrect-claim identification on successive pages. Keep submitted pages locked to prevent later claims from changing earlier responses.
8. Collect task annoyance. Save the task response record and numeric self-reports under the study ID and task ID. Do not provide the answer key between experimental rounds.
9. Clear the previous task's conversation and notes from view. Begin the next assigned round. 
10. After all three rounds, administer the post-trial comparison survey and open-ended questions. Debrief the participant and correct the deliberately questionable claims. End the session and follow the data-handling procedure.

Assessment and questionnaire stages use completion-based timing. Record their durations separately from active learning time.

## Condition implementation sheet

| Analysis label | Manuscript label | Required behavior |
| --- | --- | --- |
| normal_chatgpt | Normal | No visible reflection. Common logger records and silently scores every copy event. |
| generic_extension | Always-on / Generic | Every copy event triggers the same standardized generic reflection. Copying can continue after completion or skip. |
| personalized_extension | Adaptive Personalized | Evaluate every copy event. Show a task-specific, contextualized Teach–Apply–Feedback intervention for high-risk events; retain records for non-triggered events. Allow one targeted follow-up when needed, and an optional bypass. |

Normal/Generic/Personalized identify study conditions. Gentle/Medium/High identify friction settings within an intervention; they are not three study conditions. 

Study administration requires a separate controller for condition assignment, the active-time clock, and common trial logging. The browser package supplies copy detection, task routing, reflection presentation, and response evaluation.

## Counterbalancing

The allocation appears in `08_statistical_results/assignment_schedule.csv`. It contains six sequences, with five groups of six and one group of five participants. Within each sequence, task sets cycle ABC, BCA, CAB. The schedule places each task set 11–12 times in each condition.

Task sets: A — action potentials; B — collaborative filtering; C — confirmation bias.

## Researcher script

Before practice: “We are comparing ways of using an AI chat interface while learning. Use the interface as instructed. There is no preferred survey answer. Your task responses are for this study and do not affect school grades. You may skip a reflection or stop participating.”

Before each learning period: “Read the task goal, then use ChatGPT and the notes workspace to learn the concept. You have seven minutes of active chat time. If a reflection appears, the learning timer will pause until it closes. You may ask questions, copy text, write your own notes, or combine these approaches.”

At the transition: “The learning period is finished. ChatGPT and your notes will now be hidden. Answer the next questions from memory. It is fine to say what you do not know.”

If asked for help with content: “Please give your best answer based on what you learned. I can help with the interface, but I cannot explain the topic during the task.”

If a popup is unwanted: “You may select Skip for Now and continue. A reason is optional. Skipping does not affect your participation.”

If the system fails: record the affected task/event, time, condition, and failure type without copying private content into the error record. Stop the active timer during troubleshooting. Preserve the incomplete record. Do not manufacture an outcome, silently substitute a condition, or replace a participant's response with an example answer.

## Researcher session record

Fields: study ID; task ID; assigned condition and set; task position; active learning seconds; total popup seconds; assessment seconds; technical interruption seconds; completion status; withdrawal status; deviations; excluded-from-analysis flag and reason. No real name, school, personal email, ChatGPT account identifier, chat URL, or exact birth date belongs in this record. Blank templates are provided in the code/data package.
