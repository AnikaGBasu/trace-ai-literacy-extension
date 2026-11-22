# Data files

| File | Contents | Rows |
| --- | --- | --- |
| task_outcomes.csv | Participant/task IDs, condition allocation, task set, and numeric outcomes | 105 |
| manuscript_survey_summary.csv | Mean ratings and Holm-adjusted p-values printed in manuscript Figure 3 | 6 |
| manuscript_preference_summary.csv | Condition preference counts and displayed percentages from the manuscript | 3 |

Task data contain 35 participants, each observed once per condition. Outcome values are analyzed directly. The survey summary is an aggregate table; it is not a participant-level survey dataset. Preference percentages retain the paper's display precision.

`data_dictionary.csv`, in the parent directory, defines every input field. Files ending in `_template.csv` are blank collection worksheets and are not inputs to the task analysis. `auxiliary_schema_dictionary.md` defines their columns and the statistical output fields.
