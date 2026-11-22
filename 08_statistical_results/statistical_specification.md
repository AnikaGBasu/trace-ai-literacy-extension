# Statistical specification

The task analysis contains 35 participants and 105 complete observations, one per participant in each of Normal, Generic, and Personalized. Pairing uses participant IDs. Table 2 and the task tests are calculated from `data/task_outcomes.csv`. Table 3 reproduces the means and Holm-adjusted comparisons printed in manuscript Figure 3; the preference table reproduces the manuscript's counts and displayed percentages.

## Outcomes and descriptive statistics

The seven objective outcomes are memory, own-words processing, transfer, verification recognition, verification quality, incorrect-claim detection, and confidence-calibration error. Confidence and task annoyance are participant self-reports. Calibration error is analyzed as stored in `confidence_calibration_error`.

`task_descriptives.csv` reports n, missing count, mean, sample SD (n−1 denominator), median, first and third quartiles, observed range, and 95% participant-bootstrap intervals for each outcome and condition. Quartiles use linear interpolation. Binary Table 2 rows show count/35 and percentage. `task_score_frequencies.csv` reports the complete observed score distributions.

## Omnibus tests

Ordinal and continuous outcomes use tie-corrected Friedman tests with 35 paired participants, three conditions, and df = 2. Report the chi-square approximation p-value and Kendall's `W = chi-square / (35 × 2)`.

Binary outcomes use Cochran's Q with df = 2 and chi-square approximation p-values. All three repeated binary responses enter each test.

Primary omnibus p-values are unadjusted. The separate `p_holm_exploratory_9` column applies Holm adjustment across the nine omnibus tests as a sensitivity analysis.

## Paired tests and multiplicity

Differences are **B − A**, with comparisons Normal→Generic, Normal→Personalized, and Generic→Personalized. Positive effects mean the second condition has higher values; lower annoyance and calibration error are preferable.

Ordinal outcomes use two-sided Wilcoxon signed-rank tests with `zero_method="wilcox"`, `correction=False`, and `method="approx"` in SciPy 1.15.3. Zero differences are discarded before ranking; ties receive average ranks. The normal approximation includes the tie correction. Differences are rounded to 10 decimals before ranking to prevent floating-point subtraction from separating equal decimal differences.

Each Wilcoxon row includes the smaller rank sum, positive and negative rank sums, z, zero/nonzero and positive/negative counts, raw p, and Holm-adjusted p.

Binary outcomes use exact two-sided McNemar tests. The paired cells are n00, n01, n10, and n11, where the first digit is condition A. The test is the two-sided binomial test of n01 among n01+n10 discordant pairs under probability 0.5; with no discordance p = 1. No continuity correction is used.

Holm adjustment sorts m p-values in ascending order, computes `p_H(i) = min(1, max_{j≤i} [(m−j+1) × p_(j)])`, and restores the original row order.

| Family | Comparisons |
| --- | --- |
| objective_21 | Seven objective outcomes × three condition pairs |
| task_self_report_6 | Confidence and task annoyance × three condition pairs |
| exploratory_36 | Nine outcomes × four order, task-set, and carryover checks |

The post-trial comparisons form a separate survey family in the manuscript. Table 3 retains its reported adjusted p-values and precision. All task comparisons are included regardless of significance; p-values are adjusted before display rounding. CSV results retain 12 significant digits.

## Effect sizes and confidence intervals

Friedman effect size is Kendall's W. The ordinal paired effect is matched rank-biserial correlation, `(W_plus − W_minus)/(W_plus + W_minus)`, among nonzero differences. For all-zero differences the effect is recorded as 0 and its undefined bootstrap interval is NA. The binary paired effect is the risk difference, `(n01 − n10)/35`.

Each pair also includes mean and median differences and a 95% participant-bootstrap interval for the mean difference. For binary outcomes, the mean difference equals the paired risk difference. Intervals are descriptive and are not simultaneous intervals adjusted for multiplicity.

Bootstrap settings: NumPy `default_rng(20260907)`; **20,000** resamples; sample the 35 participant IDs with replacement and retain all three conditions for each selected ID. Use the same index matrix for every outcome. Take the 2.5th and 97.5th percentiles with linear interpolation. Rank-biserial estimates rerank the nonzero differences within each resample; omit all-zero resamples and report the valid-resample count. Kendall's W is reported as a point estimate.

## Exploratory order, task-set, and carryover checks

`order_set_carryover_checks.csv` contains 36 exploratory sensitivity tests:

- Task position and task set: fit each outcome with participant fixed effects, condition, task position, and task set; jointly test each term with a participant-cluster-robust Wald F test, finite-sample covariance correction, and denominator df = 34.
- First-order carryover: add indicators for previous Generic and previous Personalized. With period effects included, previous Normal is the comparison reference; both previous-condition indicators are zero in the first period. Jointly test the two coefficients and check full design-matrix rank.
- Sequence heterogeneity: compare each participant's Personalized−Normal contrast across the six condition sequences using Kruskal–Wallis, df = 5.

These regressions treat the outcome values numerically, including linear-probability models for binary outcomes. They supplement the primary repeated-measures nonparametric tests. All 36 p-values receive Holm adjustment in one exploratory family. Task-set tests compare A, B, and C. The allocation tables give counts by condition sequence, task position, and task set.
