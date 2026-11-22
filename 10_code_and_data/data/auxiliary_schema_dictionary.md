# Worksheet and result schemas

## Validation label worksheets

Risk labels: low, medium, high. Engagement labels: 0, 1, 2. Each worksheet contains 100 case slots.

| Field | Meaning |
| --- | --- |
| example_id | Case ID; R001–R100 for risk or E001–E100 for engagement |
| human_label | Frozen joint or consensus human reference label |
| system_label | System prediction under the recorded model, prompt, and code configuration |
| researcher_initial_label | Independent initial research-team label, if collected |
| educator_initial_label | Independent initial educator label, if collected |
| consensus_reason | Non-identifying rationale for resolving a disagreement |
| case_status | unfilled_template, complete, unrateable, unresolved, or excluded |

## Session record

`study_id` is the study pseudonym; `task_id` identifies one trial; `condition`, `task_set`, and `task_order` identify allocation. `active_learning_seconds`, `popup_seconds`, `assessment_seconds`, and `technical_interruption_seconds` are nonnegative durations. `completion_status`, `withdrawal_status`, `deviations`, `excluded_from_analysis`, and `exclusion_reason` describe session administration.

## Statistical results

`*_ci_low` and `*_ci_high` are the 2.5th and 97.5th bootstrap percentiles. `p_raw` is unadjusted; `p_holm` uses the stated family; additional omnibus and exploratory corrections name their families in the column. `p_holm_reported` preserves the manuscript's displayed survey comparison, including inequality signs.

`condition_A` and `condition_B` define the difference B−A. `W_plus` and `W_minus` are directional rank sums. `statistic` is the named test statistic. `n00`, `n01`, `n10`, and `n11` are paired binary cells, with A first. `effect_type` identifies the effect measure. `effect_bootstrap_valid` counts bootstrap samples with at least one nonzero difference. `missing`, `n`, and `n_pairs` give the corresponding record counts.

`analysis_type=exploratory` identifies order, set, and carryover sensitivity tests. The released analysis fields are separate from the browser export schema in `source_extension_code/csvExport.js`.
