# Risk and response-evaluator validation

| Measure | Risk classification | Response-engagement evaluator |
| --- | --- | --- |
| Examples | 100 | 100 |
| Categories | low, medium, high | 0, 1, 2 |
| Matching system and human labels | 86 | 92 |
| Nonmatching labels | 14 | 8 |
| Exact agreement | 86% | 92% |
| Human annotator roles | Research-team member and educator | Research-team member and educator |

The evaluator's human reference scores were assigned jointly by the research-team member and educator. The reported 92% measures evaluator agreement with those human reference scores.

The companion reference protocol specifies case selection, annotator instructions, disagreement handling, and worksheet fields. For completed worksheets, `analysis/validate_annotations.py` calculates a confusion matrix with human labels as rows and system labels as columns, category support, per-category agreement, precision, and overall exact agreement.

Per-category agreement is the diagonal cell divided by the human-label row total. Precision is the diagonal cell divided by the system-label column total. Overall exact agreement is the sum of diagonal cells divided by the number of labeled examples.
