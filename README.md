# TRACE

**Think Twice Before You Copy: An Adaptive Browser Extension for Teaching Generative AI Literacy**

TRACE (*Teaching Reflection via an Adaptive Cognitive Extension*) is a browser extension that helps students engage more critically with generative AI. When students attempt to copy AI-generated text, TRACE evaluates the task and context to determine whether an intervention would be useful. Instead of treating all AI use the same way, it distinguishes between tasks like looking up a fact and generating an entire essay. When reflection is warranted, TRACE introduces a brief **Teach–Apply–Feedback** activity, asking students to verify a claim, explain a concept in their own words, or reconstruct the reasoning behind an answer.

This repository accompanies our paper accepted to **EAAI 2027** and brings together the supplementary methods, study materials, code, and analyses.

## Start here

- **[Supplementary materials (PDF)](Supplementary_Materials.pdf)** — Full methodological and technical documentation. Also available as an [editable Word file](Supplementary_Materials.docx).
- **[Code and data package (ZIP)](TRACE_code_and_data.zip)** — Standalone archive with source files, analysis scripts, data, and reproduction resources.
- **[Study materials](06_study_materials/)** — Participant instructions, practice activity, three task sets, and surveys.

## Explore the repository

**System design**  
[Model and inference](01_model_and_inference/) · [Prompts and schemas](02_complete_prompts/) · [Task taxonomy and prompt bank](03_taxonomy_and_prompt_bank/) · [Risk scoring](04_risk_score/)

**Study and evaluation**  
[Scoring rubrics](05_evaluation_rubrics/) · [Study materials](06_study_materials/) · [Validation](07_validation/) · [Statistical results](08_statistical_results/) · [Ethics and privacy](09_ethics_and_privacy/)

**Reproducibility**  
[Source code, data, dependencies, and instructions](10_code_and_data/) · [Download complete package](TRACE_code_and_data.zip)

## Study at a glance

In a counterbalanced pilot, **35 high-school students** used unmodified ChatGPT, an always-on reflection condition, and adaptive TRACE. We examined immediate learning, verification, and usability. Results suggest potential benefits from selective, task-specific reflection, alongside trade-offs from added interruption. Longer-term learning and real-world adoption remain open questions.

## Authors

**Anika Ghosh Basu** and **Axel Szolusha**  
The Harker School · San Jose, California, USA
