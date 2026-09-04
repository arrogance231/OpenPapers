# Generalization V2 checkpoint

V2 uses a new corpus with 20 non-overlapping arXiv papers: 15 development cases and 5 holdout cases. The V1 six-case holdout was not used for tuning.

## Baseline

Current V1 implementation on the new V2 development set, before V2 capability changes, at `f6e8996`:

- work accuracy: 1.0000
- identifier accuracy: 1.0000
- answer correctness: 0.0000
- evidence-source accuracy: 1.0000
- locator accuracy: 0.8000
- support-status accuracy: 0.0667
- false UNKNOWN: 0.9333
- false NOT_REPORTED: 0.0000
- fabricated-answer rate: 0.0000

One source metadata error was found in QA: arXiv `2011.00677` was not SimCSE. The development case was corrected to SimCSE arXiv `2104.08821`, and the correction is preserved in the next versioned commit rather than silently relabeling the baseline.

## Experiments

G2-001 added bounded V2 concept routing for objective, architecture, formulation, parallelism, component, method, algorithm, interaction, retriever, operator, and trace questions. Development result: answer correctness 0.4000, false UNKNOWN 0.4667, fabrication 0.0000.

G2-002 added deterministic Unicode ligature/dash/line-break normalization and source-scope routing. Development result: answer correctness 0.4667, false UNKNOWN 0.4000, fabrication 0.0000.

G2-003 added query-precedence fixes for non-attention operators, reinforcement algorithms, intermediary modules, and pretraining signals. Development result: answer correctness 0.6667, false UNKNOWN 0.3333, fabrication 0.0000.

G2-004 is the final development correction pass. Development result: answer correctness 1.0000, false UNKNOWN 0.0000, fabrication 0.0000. Work and identifier accuracy remain 1.0000.

V2 development was frozen before holdout acquisition. The V2 holdout is not yet acquired or evaluated in this checkpoint document.
