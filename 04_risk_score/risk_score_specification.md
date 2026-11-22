# Risk-score specification

Formula reference: manuscript pp. 3–4. Implementation: `source_extension_code/classifier.js`.

## Inputs and formula

Let `s` be the selected text, `a` the complete AI response from which text is selected, and `t` the nonnegative elapsed seconds between the recorded response timestamp and the copy event.

- `selected_length = s.length` and `response_length = a.length`, using JavaScript UTF-16 string lengths.
- `copy_proportion = selected_length / response_length`.
- `word_count = s.trim().split(/\s+/).filter(Boolean).length` for nonempty text.
- `estimated_reading_seconds = word_count × 60 / 238`.
- `processing_ratio = t / estimated_reading_seconds`.
- `R = (C + L + B) / 6`, with each component in `{0,1,2}`.

The denominator is exactly **6**. The theoretical range is 0–1. The seven attainable values are 0, 1/6, 2/6, 3/6, 4/6, 5/6, and 1. No regeneration count, prior response score, subject label, or selected friction mode is added to this formula.

## Feature cutoffs

| Feature | 0 points | 1 point | 2 points |
| --- | --- | --- | --- |
| Copy proportion, C | `< 0.25` | `0.25 ≤ proportion ≤ 0.75` | `> 0.75` |
| Normalized latency, L | `ratio ≥ 0.75` | `0.25 ≤ ratio < 0.75` | `ratio < 0.25` |
| Cognitive bypass, B | factual_lookup | explanation, revision, summarization, brainstorming, translation, unknown, coding_help | writing_generation, problem_solving, argumentation |

The code assigns **1** to `coding_help`. The legacy alias `information_lookup` normalizes to `factual_lookup`.

The value **238 words per minute** is the manuscript's reference for silent reading of English nonfiction. It comes from an adult reading-rate meta-analysis; this implementation does not calibrate reading rate for individual adolescents. [Brysbaert (2019)](https://biblio.ugent.be/publication/8647789).

## Risk bands and rounding

The manuscript prints **0.00–0.33 low**, **0.34–0.66 medium**, and **0.67–1.00 high**. The reference implementation retains raw `R` and applies these bands to `Math.round(R * 100) / 100`:

| C + L + B | Raw R | Two-decimal band score | Classification |
| --- | --- | --- | --- |
| 0 | 0 | 0.00 | low |
| 1 | 1/6 | 0.17 | low |
| 2 | 2/6 | 0.33 | low |
| 3 | 3/6 | 0.50 | medium |
| 4 | 4/6 | 0.67 | high |
| 5 | 5/6 | 0.83 | high |
| 6 | 1 | 1.00 | high |

## Missing inputs and implementation details

- Missing/zero selected or full-response length: C defaults to 1 in the source. This is a missing-input fallback, not evidence of medium copying.
- Missing, nonfinite, or negative latency, or empty selected text: L defaults to 1. A measured zero latency receives L = 2 when selected text is nonempty.
- Unknown task: B = 1. An unavailable classifier instead returns the explicit nominal medium-risk fallback described in Section 01.
- A factual lookup retains B = 0.
- Local risk uses the full selected text for word count and the full response length for copy proportion, independently of the shorter API excerpts.
- The response timestamp is a browser detection/save timestamp, not a server-issued generation timestamp. The logger's timing is an operational latency measure.
- A selection from an unrelated response, a changed response, or an invalid denominator can make copy proportion misleading. The source does not validate every such DOM-context error. Retain a data-quality flag in any new study logger; do not interpret fallback values as valid behavioral observations.

## Worked examples

Lengths below describe example event contexts. A selection with 238 words has a 60-second estimated reading time.

| Event | Task | Selected/full characters | Words | Latency (s) | Proportion | Processing ratio | C | L | B | R | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E01 | factual_lookup | 100/1000 | 20 | 10 | 0.10 | 1.9833 | 0 | 0 | 0 | 0.00 | low |
| E02 | explanation | 1200/4800 | 238 | 45 | 0.25 | 0.75 | 1 | 0 | 1 | 2/6 → 0.33 | low |
| E03 | explanation | 1200/2400 | 238 | 30 | 0.50 | 0.50 | 1 | 1 | 1 | 3/6 = 0.50 | medium |
| E04 | explanation | 1200/1600 | 238 | 15 | 0.75 | 0.25 | 1 | 1 | 1 | 3/6 = 0.50 | medium |
| E05 | explanation | 1200/1599 | 238 | 15 | 0.75047 | 0.25 | 2 | 1 | 1 | 4/6 → 0.67 | high |
| E06 | writing_generation | 1200/1200 | 238 | 5 | 1.00 | 0.08333 | 2 | 2 | 2 | 1.00 | high |
| E07 | coding_help | 1200/2400 | 238 | 10 | 0.50 | 0.16667 | 1 | 2 | 1 | 4/6 → 0.67 | high |
| E08 | factual_lookup | 100/1000 | 20 | 0 | 0.10 | 0 | 0 | 2 | 0 | 2/6 → 0.33 | low |

E01 reading time is `20 × 60 / 238 = 5.0420 s`; its processing ratio is `10 / 5.0420 = 1.9833`. E04 and E05 isolate the **strictly greater than 75%** copy cutoff. E02 and E04 show that latency exactly 0.75 receives 0 and exactly 0.25 receives 1.

Adaptive trigger in the browser: show an intervention only for `risk_level === "high"` in As-needed timing. Constant timing shows an intervention regardless of risk.
