# TRACE code and data

Companion package for **Think Twice Before You Copy: An Adaptive Browser Extension for Teaching Generative AI Literacy**. It includes extension version **1.1.1**, browser and reference prompts, the complete task taxonomy and template bank, task outcomes, manuscript survey aggregates, statistical scripts, and figure-generation scripts.

## Reproduce the numerical results

Environment: **Python 3.10.11**, **Node.js 20.11.1**. Python dependencies are pinned in `requirements-lock.txt`. The browser extension has no npm dependencies or build step.

From this directory:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-lock.txt
.venv/bin/python analysis/check_integrity.py
.venv/bin/python analysis/reproduce.py
.venv/bin/python analysis/make_figures.py
node --test tests/source_contracts.test.js
.venv/bin/python -m unittest discover -s tests -p 'test_*.py'
```

On Windows, replace `.venv/bin/python` with `.venv\Scripts\python.exe`. Installing dependencies needs an internet connection. Statistics, figures, and tests run offline without an API key.

`reproduce.py` checks task counts, unique participant-condition pairs, score ranges, missingness, and allocation. It writes descriptive statistics, score frequencies, Friedman and Cochran's Q tests, all paired Wilcoxon and exact McNemar tests, raw and Holm-adjusted p-values, effect sizes, bootstrap intervals, and exploratory order/task-set/carryover tests to `results/`.

Table 3 and the preference table are formatted from the manuscript aggregate files. They preserve the paper's reported precision. `make_figures.py` draws task means with participant-bootstrap intervals and the reported survey means, saving PDF, SVG, and 300 dpi PNG files to `figures/`.

`results/analysis_run.json` records input hashes, package versions, bootstrap seed, and replicate count. CSV values are the numerical reproduction targets; figure rendering may vary slightly across platforms.

## Load the browser extension

1. Open `chrome://extensions` in Chrome.
2. Enable Developer mode, choose **Load unpacked**, and select `source_extension_code/`, which contains `manifest.json`.
3. Select Constant or As-needed timing and Gentle, Medium, High, or Auto friction in the extension popup.
4. Configure a model credential or backend in the popup to exercise model calls. Without a configured model, the manual/fallback paths remain available.
5. On a supported ChatGPT page, copy a passage and complete or skip the reflection.

The browser supplies copy detection, classification, static template routing, reflection display, evaluation, and local logging. The reference contextualization and assessment utilities are separate. Experimental condition assignment, the paused seven-minute learning clock, and common study administration use the protocol in Section 06 of the full supplement.

Intervention engagement is **0–2**. Medium enables copying at 1 or 2; High requires 2 and completion of its additional check. A voluntary skip remains available.

## Prompts and taxonomy

`prompts/*_as_implemented.txt` contain the two complete browser system prompts. `taxonomy/prompt_bank_source.json` contains every field of all 11 static template families. Reference prompts and schemas specify four-field classification, constrained contextualization, response evaluation, and condition-blind assessment scoring.

Regenerate the browser prompt exports, taxonomy, and schemas with:

```sh
.venv/bin/python analysis/build_resources.py
```

In the full supplement, the command also updates the readable prompt and taxonomy appendices. `analysis/reference_requests.py` constructs and validates packets, accepts a completion callback, and allows at most two structural regeneration attempts. `prompts/example_request_packets.json` contains complete example inputs.

## Validation worksheets

The two 100-row label worksheets use low/medium/high for risk and 0/1/2 for engagement. After completing human and system labels, calculate confusion matrices and per-category agreement with:

```sh
.venv/bin/python analysis/validate_annotations.py --kind risk --input data/validation_risk_labels_template.csv --output results/risk_validation
.venv/bin/python analysis/validate_annotations.py --kind evaluator --input data/validation_evaluator_labels_template.csv --output results/evaluator_validation
```

The validator requires 100 unique, complete pairs; blank worksheets do not produce numerical agreement results.

## Build the complete supplement

These commands require the full numbered-folder distribution:

```sh
.venv/bin/python analysis/build_documents.py
.venv/bin/python analysis/build_release.py
```

The document builder refreshes the PDF, DOCX, task packets, practice packet, and statistical tables. The release builder writes SHA-256 manifests and creates the standalone code/data ZIP and full supplement ZIP.

## Data files

`data/task_outcomes.csv` contains 105 task records from 35 participants. `data/manuscript_survey_summary.csv` and `data/manuscript_preference_summary.csv` contain reported aggregates. `data_dictionary.csv` defines all fields. Files ending in `_template.csv` are collection worksheets.

The dataset contains no student answer text, free-text reflections, browser URLs, credentials, contact details, or institution names. Browser logs have a separate schema and require the anonymization procedure in Section 09 before inclusion in a data release.
