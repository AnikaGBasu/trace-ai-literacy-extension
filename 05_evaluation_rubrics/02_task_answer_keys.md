# Task-specific answer keys

Reference answer keys • rubrics-1.0.0. **Researcher/scorer copy. Do not show during experimental rounds.** Sample answers illustrate scoring anchors.

## A — action potentials

### Memory units

| Unit | One-point requirement |
| --- | --- |
| A-M1 | Identifies an action potential as a brief electrical change in membrane voltage that begins when sufficient stimulation/threshold is reached. |
| A-M2 | Explains that controlled ion movement through membrane channels produces the voltage change; an accurate description of inward sodium and outward potassium is sufficient. |
| A-M3 | Explains propagation as the signal being regenerated along the axon or successive membrane regions, rather than copied text or a single ion travelling the whole distance. |
| A-M4 | Connects arrival at the terminal to communication with another cell, for example triggering transmitter release at a chemical synapse. |

Do not require exact voltages, channel names, myelin, or an exhaustive account of synaptic chemistry. Those details can be correct without earning extra points.

Memory examples:

- **0:** “Neurons are tiny bones.”
- **1:** “An action potential is a brief change in a neuron's membrane voltage when stimulation reaches a threshold.”
- **2:** “Enough stimulation starts a short voltage change across the membrane. Ions moving through channels cause the change.”
- **3:** “Enough stimulation starts a short membrane-voltage change as ion channels let ions move. This excites the next region, so the signal is regenerated along the axon.”
- **4:** “Enough stimulation starts a brief membrane-voltage change through controlled ion movement. The change activates successive regions along the axon. When it reaches the terminal, it can trigger transmitter release that carries the message to the next cell.”

### Transfer units

| Unit | One-point requirement |
| --- | --- |
| A-T1 | Predicts reduced or absent communication through the affected neuron's normal action-potential pathway. |
| A-T2 | Explains that failure to generate/propagate the electrical signal prevents its normal arrival at the terminal. |
| A-T3 | Connects the missing terminal signal to reduced/absent evoked transmitter release or downstream activation through this pathway. |
| A-T4 | Limits the conclusion: the scenario concerns this neuron's pathway and does not establish that every neuron, the whole nervous system, or all forms of signaling stop. |

Transfer examples:

- **0:** “The next cell will get a stronger message because the signal cannot move.”
- **1:** “The next cell would receive less information through this neuron.”
- **2:** “This neuron would fail to pass on the usual signal because the electrical change cannot reach its terminal.”
- **3:** “The electrical signal cannot reach the terminal, so the usual transmitter release would not be triggered and the next cell would not receive this neuron's usual message.”
- **4:** “Without propagation, the electrical signal cannot reach the terminal to trigger the usual transmitter release, so communication through this route would fail. That does not show that all touch signaling stops, because other pathways are not described.”

### Verification key

Planted claim: **A2**. Corrective principle: action potentials are all-or-none events; stimulus intensity is not encoded by making each individual spike proportionally taller. A check should distinguish spike amplitude from firing frequency. A1, A3, and A4 are appropriate introductory statements, while any of them can still be selected for a reasonable external check. Accept relevant textbook or independent educational reference plans. [OpenStax, The Action Potential](https://openstax.org/books/anatomy-and-physiology/pages/12-4-the-action-potential).

## B — collaborative filtering

### Memory units

| Unit | One-point requirement |
| --- | --- |
| B-M1 | Identifies users' interactions, ratings, or preference histories as the input. |
| B-M2 | Explains the use of shared preference/interaction patterns across users or items, rather than only item descriptions. |
| B-M3 | Links those patterns to predicting a user's interest in an unseen/untried item and making a suggestion. |
| B-M4 | Explains uncertainty or a relevant limitation, such as sparse history, changing preferences, or an imperfect prediction. |

Accept user-based, item-based, or latent-factor explanations that establish these relationships. Do not require matrix algebra, implementation details, or a named platform.

Memory examples:

- **0:** “The service reads everyone's mind.”
- **1:** “It uses records of what users rated or listened to.”
- **2:** “It uses people's ratings and finds patterns in which users tend to like the same things.”
- **3:** “It looks for shared patterns in users' ratings, then uses what similar users enjoyed to suggest something the current user has not tried.”
- **4:** “It learns patterns from users' ratings or listening. If my pattern resembles other listeners', their choices can help predict an item I have not tried. That is uncertain because matching some past choices does not guarantee matching every future preference.”

### Transfer units

| Unit | One-point requirement |
| --- | --- |
| B-T1 | Identifies weak/uncertain personalization for the new user, often called user cold start. |
| B-T2 | Explains that other users' histories do not establish this person's place in the preference patterns without some signal about this person. |
| B-T3 | Proposes a feasible next step, such as asking for initial ratings or collecting early interactions; a clearly labeled nonpersonalized popularity fallback also earns this unit. |
| B-T4 | Notes that the first ratings/fallback are limited or uncertain and do not guarantee accurate personalization; distinguishes a hybrid approach if suggesting extra information outside the specified system. |

Transfer examples:

- **0:** “It knows the new user's favorites exactly.”
- **1:** “It will have trouble personalizing for the new user.”
- **2:** “It cannot reliably tailor the results because there is no history connecting this user to other users' preference patterns.”
- **3:** “With no personal history, it cannot reliably match this user to the patterns it knows. It could ask the user to rate several songs to get an initial signal.”
- **4:** “The other histories do not reveal which patterns fit this new user, so personalized guesses are weak. Asking for a few ratings could start a match, but a small sample may miss their tastes and would need updating.”

### Verification key

Planted claim: **B3**. Corrective principle: a new user without relevant information presents a cold-start problem. Large histories from other users do not guarantee equally accurate personalization. Suitable verification plans consult independent technical documentation or research and look for the no-history assumption, cold start, and the role of initial interactions or side information. [Collaborative filtering basics](https://developers.google.com/machine-learning/recommendation/collaborative/basics), [limitations and new-user extensions](https://developers.google.com/machine-learning/recommendation/collaborative/summary).

## C — confirmation bias

### Memory units

| Unit | One-point requirement |
| --- | --- |
| C-M1 | Identifies preferential treatment of information that supports an existing belief/expectation. |
| C-M2 | Describes a specific mechanism: selective searching, asymmetric interpretation, discounting conflicting evidence, or selective recall. |
| C-M3 | Explains a consequence for judgment, such as a conclusion becoming more confident without a fair evaluation of evidence. |
| C-M4 | Gives a fitting example or a corrective strategy that examines potentially disconfirming evidence using comparable standards. |

Do not require assuming dishonesty or conscious intent. Disagreement by itself is not sufficient evidence of confirmation bias.

Memory examples:

- **0:** “It is when everyone agrees and therefore must be right.”
- **1:** “It is favoring information that supports what you already believe.”
- **2:** “It is favoring support for an existing belief, such as searching only for articles that agree with you.”
- **3:** “Someone can search only for support for an existing belief. This can make their conclusion feel stronger even though they have not fairly checked the other evidence.”
- **4:** “A prior belief can steer someone toward supportive sources and make them dismiss contrary results. Their confidence can then grow without a fair comparison. One check is to identify a result that would count against the belief and evaluate it by the same standard used for supportive results.”

### Transfer units

| Unit | One-point requirement |
| --- | --- |
| C-T1 | Identifies selective weighting of the two supportive results while dismissing the conflicting observations. |
| C-T2 | Explains how this selective treatment protects the prior music belief without establishing the causal claim. |
| C-T3 | Proposes a fair comparison, for example recording all results and comparing music/no-music study sessions under comparable conditions. |
| C-T4 | Notes that six observations and uncontrolled differences cannot establish that music always helps or never helps; other factors could influence the results. |

Transfer examples:

- **0:** “The student proved that music always helps.”
- **1:** “The student is keeping the two favorable cases and dismissing the conflicting cases.”
- **2:** “The student keeps the favorable cases and calls the others exceptions, so the original belief is protected without a fair test.”
- **3:** “The student dismisses the conflicting cases to preserve the belief. They should record all results and compare similar study sessions with and without music.”
- **4:** “They count support but dismiss challenges, which shields the original belief. A fairer check would record all sessions and compare music and silence under similar conditions. These six results alone cannot show that music caused the differences, because difficulty and preparation might vary.”

### Verification key

Planted claim: **C1**. Corrective principle: conflicting evidence can be discounted or reinterpreted; exposure does not automatically eliminate biased processing. A useful plan consults independent psychological research or a research-based textbook and examines how people respond to disconfirming information. [Nickerson, Confirmation Bias: A Ubiquitous Phenomenon in Many Guises](https://doi.org/10.1037/1089-2680.2.2.175), [Lord, Ross, and Lepper, Biased Assimilation and Attitude Polarization](https://doi.org/10.1037/0022-3514.37.11.2098).

## Matching across task sets

Each set has one mechanism explanation, one novel application with four keyed units, four short verification claims, one planted error, the same independent recognition/plan/detection questions, and identical self-report anchors.
