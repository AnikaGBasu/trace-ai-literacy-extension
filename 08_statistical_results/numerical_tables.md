# Full numerical results

Table 2 gives task means (sample SD) or counts/35 (%). Table 3 reproduces the mean ratings and Holm-adjusted p-values printed in manuscript Figure 3. Machine-readable task results retain full numerical precision.

## Table 2 — task outcomes

| Measure | Normal | Generic | Personalized |
| --- | --- | --- | --- |
| Memory | 2.60 (0.55) | 2.97 (0.51) | 3.34 (0.54) |
| Own-words processing | 1.63 (0.49) | 2.09 (0.45) | 2.37 (0.55) |
| Transfer | 2.40 (0.50) | 3.00 (0.54) | 3.09 (0.51) |
| Identifies need to verify | 15/35 (42.86%) | 28/35 (80.00%) | 30/35 (85.71%) |
| Verification quality | 0.71 (0.52) | 1.14 (0.36) | 1.57 (0.56) |
| Detects incorrect claim | 12/35 (34.29%) | 24/35 (68.57%) | 27/35 (77.14%) |
| Calibration error | 1.15 (0.36) | 0.70 (0.25) | 0.53 (0.25) |
| Confidence | 3.74 (0.51) | 3.83 (0.45) | 4.03 (0.30) |
| Task annoyance | 1.03 (0.17) | 2.20 (0.41) | 3.26 (0.56) |

## Table 3 — post-trial ratings

| Measure | Generic | Personalized | p_H |
| --- | --- | --- | --- |
| Helps understanding | 3.40 | 4.00 | <.001 |
| Helps verification | 3.20 | 4.14 | <.001 |
| Annoyance | 2.29 | 3.06 | <.001 |
| Effort is reasonable | 3.74 | 3.29 | <.001 |
| Agency | 3.66 | 3.80 | .096 |
| Would use again | 3.37 | 3.69 | .005 |

## Omnibus tests

| outcome | test | n | df | statistic | p_raw | kendall_W | p_holm_exploratory_9 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| memory_explanation_score | Friedman | 35 | 2 | 35.2195 | 2.24999e-08 | 0.503136 | 1.12499e-07 |
| own_words_score | Friedman | 35 | 2 | 35.878 | 1.61875e-08 | 0.512544 | 9.71252e-08 |
| transfer_score | Friedman | 35 | 2 | 29.9529 | 3.13185e-07 | 0.427899 | 1.25274e-06 |
| verification_needed_identified | Cochran Q | 35 | 2 | 20.9474 | 2.82707e-05 | NA | 8.48121e-05 |
| verification_quality_score | Friedman | 35 | 2 | 39.2 | 3.07488e-09 | 0.56 | 2.15242e-08 |
| incorrect_claim_detected | Cochran Q | 35 | 2 | 14 | 0.000911882 | NA | 0.00182376 |
| confidence_calibration_error | Friedman | 35 | 2 | 58.7794 | 1.72271e-13 | 0.839706 | 1.37817e-12 |
| confidence_rating | Friedman | 35 | 2 | 13.1667 | 0.00138323 | 0.188095 | 0.00182376 |
| task_annoyance_rating | Friedman | 35 | 2 | 68.5985 | 1.27062e-15 | 0.979979 | 1.14356e-14 |

## Paired task tests

| outcome | condition_A | condition_B | statistic | p_raw | p_holm | effect |
| --- | --- | --- | --- | --- | --- | --- |
| memory_explanation_score | normal_chatgpt | generic_extension | 8 | 0.000789113 | 0.0063129 | 0.866667 |
| memory_explanation_score | normal_chatgpt | personalized_extension | 0 | 8.94473e-07 | 1.61005e-05 | 1 |
| memory_explanation_score | generic_extension | personalized_extension | 8 | 0.000789113 | 0.0063129 | 0.866667 |
| own_words_score | normal_chatgpt | generic_extension | 0 | 6.33425e-05 | 0.000886795 | 1 |
| own_words_score | normal_chatgpt | personalized_extension | 0 | 8.94473e-07 | 1.61005e-05 | 1 |
| own_words_score | generic_extension | personalized_extension | 15 | 0.00752632 | 0.0376316 | 0.714286 |
| transfer_score | normal_chatgpt | generic_extension | 11 | 2.66915e-05 | 0.000400372 | 0.913043 |
| transfer_score | normal_chatgpt | personalized_extension | 10.5 | 2.4785e-05 | 0.00039656 | 0.923913 |
| transfer_score | generic_extension | personalized_extension | 35 | 0.405381 | 1 | 0.230769 |
| verification_needed_identified | normal_chatgpt | generic_extension | 1 | 0.000976562 | 0.0063129 | 0.371429 |
| verification_needed_identified | normal_chatgpt | personalized_extension | 1 | 0.000274658 | 0.00357056 | 0.428571 |
| verification_needed_identified | generic_extension | personalized_extension | 2 | 0.6875 | 1 | 0.0571429 |
| verification_quality_score | normal_chatgpt | generic_extension | 9 | 0.000274727 | 0.00357056 | 0.882353 |
| verification_quality_score | normal_chatgpt | personalized_extension | 0 | 6.59848e-07 | 1.25371e-05 | 1 |
| verification_quality_score | generic_extension | personalized_extension | 9 | 0.000274727 | 0.00357056 | 0.882353 |
| incorrect_claim_detected | normal_chatgpt | generic_extension | 4 | 0.0118179 | 0.0472717 | 0.342857 |
| incorrect_claim_detected | normal_chatgpt | personalized_extension | 1 | 0.000274658 | 0.00357056 | 0.428571 |
| incorrect_claim_detected | generic_extension | personalized_extension | 7 | 0.629059 | 1 | 0.0857143 |
| confidence_calibration_error | normal_chatgpt | generic_extension | 0 | 3.2786e-07 | 6.78634e-06 | -1 |
| confidence_calibration_error | normal_chatgpt | personalized_extension | 0 | 3.23159e-07 | 6.78634e-06 | -1 |
| confidence_calibration_error | generic_extension | personalized_extension | 80.5 | 0.000300615 | 0.00357056 | -0.713012 |
| confidence_rating | normal_chatgpt | generic_extension | 0 | 0.0832645 | 0.0832645 | 1 |
| confidence_rating | normal_chatgpt | personalized_extension | 6.5 | 0.00389242 | 0.0116773 | 0.833333 |
| confidence_rating | generic_extension | personalized_extension | 5 | 0.0196307 | 0.0392613 | 0.777778 |
| task_annoyance_rating | normal_chatgpt | generic_extension | 0 | 2.77738e-08 | 1.66643e-07 | 1 |
| task_annoyance_rating | normal_chatgpt | personalized_extension | 0 | 8.32202e-08 | 4.16101e-07 | 1 |
| task_annoyance_rating | generic_extension | personalized_extension | 0 | 9.51327e-08 | 4.16101e-07 | 1 |

Table 3 values are reported at manuscript precision; p_H denotes the Holm-adjusted paired Wilcoxon comparison.


## Preference

| condition | n | percent_reported |
| --- | --- | --- |
| normal_chatgpt | 12 | 34.2 |
| generic_extension | 1 | 2.9 |
| personalized_extension | 22 | 62.8 |

## Exploratory order, task-set and carryover checks

| outcome | check | statistic | df_num | df_den | p_raw | p_holm_exploratory_36 |
| --- | --- | --- | --- | --- | --- | --- |
| memory_explanation_score | task_order | 0.480016 | 2 | 34 | 0.622903 | 1 |
| memory_explanation_score | task_set | 0.384754 | 2 | 34 | 0.683544 | 1 |
| memory_explanation_score | previous_condition | 0.304945 | 2 | 34 | 0.739159 | 1 |
| memory_explanation_score | sequence_heterogeneity_of_P_minus_N | 2.95261 | 5 | NA | 0.707293 | 1 |
| own_words_score | task_order | 0.0208012 | 2 | 34 | 0.979426 | 1 |
| own_words_score | task_set | 0.643126 | 2 | 34 | 0.531922 | 1 |
| own_words_score | previous_condition | 0.435817 | 2 | 34 | 0.650298 | 1 |
| own_words_score | sequence_heterogeneity_of_P_minus_N | 1.18048 | 5 | NA | 0.946736 | 1 |
| transfer_score | task_order | 0.098729 | 2 | 34 | 0.906247 | 1 |
| transfer_score | task_set | 0.626659 | 2 | 34 | 0.540433 | 1 |
| transfer_score | previous_condition | 0.279523 | 2 | 34 | 0.757865 | 1 |
| transfer_score | sequence_heterogeneity_of_P_minus_N | 1.71697 | 5 | NA | 0.886755 | 1 |
| verification_needed_identified | task_order | 0.177622 | 2 | 34 | 0.83803 | 1 |
| verification_needed_identified | task_set | 0.156349 | 2 | 34 | 0.855872 | 1 |
| verification_needed_identified | previous_condition | 0.232174 | 2 | 34 | 0.794055 | 1 |
| verification_needed_identified | sequence_heterogeneity_of_P_minus_N | 1.72126 | 5 | NA | 0.886211 | 1 |
| verification_quality_score | task_order | 0.68317 | 2 | 34 | 0.511811 | 1 |
| verification_quality_score | task_set | 0.701151 | 2 | 34 | 0.503044 | 1 |
| verification_quality_score | previous_condition | 0.000178539 | 2 | 34 | 0.999821 | 1 |
| verification_quality_score | sequence_heterogeneity_of_P_minus_N | 2.53152 | 5 | NA | 0.771741 | 1 |
| incorrect_claim_detected | task_order | 0.0853804 | 2 | 34 | 0.918359 | 1 |
| incorrect_claim_detected | task_set | 0.113464 | 2 | 34 | 0.893073 | 1 |
| incorrect_claim_detected | previous_condition | 0.0117406 | 2 | 34 | 0.988332 | 1 |
| incorrect_claim_detected | sequence_heterogeneity_of_P_minus_N | 4.1774 | 5 | NA | 0.524168 | 1 |
| confidence_calibration_error | task_order | 0.390854 | 2 | 34 | 0.679479 | 1 |
| confidence_calibration_error | task_set | 0.211789 | 2 | 34 | 0.810195 | 1 |
| confidence_calibration_error | previous_condition | 0.795237 | 2 | 34 | 0.459692 | 1 |
| confidence_calibration_error | sequence_heterogeneity_of_P_minus_N | 2.57094 | 5 | NA | 0.765775 | 1 |
| confidence_rating | task_order | 1.15669 | 2 | 34 | 0.326594 | 1 |
| confidence_rating | task_set | 0.7345 | 2 | 34 | 0.487202 | 1 |
| confidence_rating | previous_condition | 0.123927 | 2 | 34 | 0.883842 | 1 |
| confidence_rating | sequence_heterogeneity_of_P_minus_N | 2.20556 | 5 | NA | 0.820033 | 1 |
| task_annoyance_rating | task_order | 0.0372231 | 2 | 34 | 0.9635 | 1 |
| task_annoyance_rating | task_set | 0.836874 | 2 | 34 | 0.441787 | 1 |
| task_annoyance_rating | previous_condition | 1.43486 | 2 | 34 | 0.252205 | 1 |
| task_annoyance_rating | sequence_heterogeneity_of_P_minus_N | 0.89167 | 5 | NA | 0.970822 | 1 |

Task-set checks compare sets A, B, and C while controlling for condition and task position. Preference percentages retain the manuscript display precision.
