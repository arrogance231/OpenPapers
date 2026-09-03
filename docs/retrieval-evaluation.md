# Retrieval evaluation and experiments

## Baselines

`evals/results/baseline-v1-edadc8a31da6.json` is the clean Baseline V1 for the original 12-query / 12-work fixture set. It was generated from commit `edadc8a31da6` with `workingTreeDirty: false`.

The expanded pre-optimization fixture set uses 23 works and 44 realistic discovery queries. Its current result is `evals/results/preopt-expanded-03324d4b4948-3.json`; the dedicated diagnostics are `evals/results/preopt-expanded-03324d4b4948-failures.json`. This expanded result is intentionally not a replacement for Baseline V1 because it uses a new dataset version and was generated from a dirty development tree.

Expanded pre-optimization metrics:

| Metric | Value |
|---|---:|
| Identity accuracy (119 cases) | 1.0 |
| False merge rate | 0.0 |
| False split rate | 0.0 |
| Recall@1 | 0.1553030303 |
| Recall@5 | 0.3560606061 |
| Recall@10 | 0.5946969697 |
| MRR | 0.4010371573 |

These values must not be compared numerically with Baseline V1 without holding the dataset constant.

## Failure analysis

The expanded diagnostics contain 89 relevant judgments:

- 49 relevant works were returned in the top 10.
- 40 relevant works were in the deterministic fixture candidate pool but ranked below the returned top 10.
- 0 relevant works were absent from the fixture candidate pool.
- 14 relevant works were ranked first.
- 17 relevant works ranked second through fifth.
- 18 relevant works ranked sixth through tenth.

This supports a ranking-depth hypothesis for this fixture, but it does not establish that live provider omission is unimportant. The offline provider returns the complete fixture corpus by design; live-provider omission remains unmeasured here.

The current score explanation records only the implemented text-containment, citation-count, and arXiv-source contributions. Provider-native score is explicitly unavailable in the fixture. Duplicate collapse is not present in this corpus and is recorded as such rather than inferred.

## Experiment discipline

Every retrieval experiment must use the expanded dataset, preserve the pre-optimization artifact, record its hypothesis and changed files, and compare Recall@1, Recall@5, Recall@10, MRR, identity accuracy, false merge rate, false split rate, and unresolved rate. An experiment is not accepted solely because one ranking metric rises.

## R-001: deterministic token-overlap reranking

Hypothesis: whole-query substring matching misses related wording. Adding explainable title and full-text token-overlap signals should improve ranking without changing identity reconciliation.

R-001 adds `titleTokenOverlap` and `textTokenOverlap` to the actual ranking function and exposes their contributions in diagnostics. It does not alter canonical identity keys or merging rules.

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| Recall@1 | 0.1553030303 | 0.4204545455 | +0.2651515152 |
| Recall@5 | 0.3560606061 | 0.7500000000 | +0.3939393939 |
| Recall@10 | 0.5946969697 | 0.8560606061 | +0.2613636364 |
| MRR | 0.4010371573 | 0.7726010101 | +0.3715638528 |
| Identity accuracy | 1.0 | 1.0 | 0 |
| False merge rate | 0.0 | 0.0 | 0 |
| False split rate | 0.0 | 0.0 | 0 |

Relevant judgments ranked below the top 10 fell from 40 to 15; returned relevant judgments rose from 49 to 74. The experiment is accepted, with its machine-readable record in `evals/experiments/r001.json` and clean result/diagnostics in `evals/results/experiment-r001-413621146cbb.json` and `evals/results/experiment-r001-413621146cbb-failures.json`.

## R-002: stronger title weighting (rejected)

Hypothesis: increasing the title-token coefficient from 4 to 6 would improve title-aligned discovery. It was tested in isolation against the same 44-query fixture and then reverted.

| Metric | R-001 accepted | R-002 | Delta |
|---|---:|---:|---:|
| Recall@1 | 0.4204545455 | 0.4090909091 | -0.0113636364 |
| Recall@5 | 0.7500000000 | 0.6969696970 | -0.0530303030 |
| Recall@10 | 0.8560606061 | 0.8484848485 | -0.0075757576 |
| MRR | 0.7726010101 | 0.7569083694 | -0.0156926407 |
| Identity accuracy | 1.0 | 1.0 | 0 |

Decision: `REJECT`. All primary retrieval metrics regressed. The result and diagnostics are preserved under `evals/results/experiment-r002-*`, with the experiment record in `evals/experiments/r002.json`.
