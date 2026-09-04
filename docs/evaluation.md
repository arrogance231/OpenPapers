# Evaluation status

OpenPapers has deterministic unit/adversarial tests and a separate offline evaluation harness. `scripts/mcp-benchmark.mjs` measures operational MCP latency; `npm run eval:baseline` measures retrieval, identity, extraction, and citation-quality fixtures.

The current harness includes versioned identity, retrieval-query, extraction, citation, paper/code, end-to-end research-task, and PDF structure datasets. Deterministic provider degradation is measured separately. Results record commit, timestamp, dataset version, provider configuration, and embedding model. Retrieval changes report canonical identity accuracy alongside ranking metrics.

The fixture results are engineering evidence, not a claim of live-provider or scientific benchmark superiority.

## Exploratory baseline

The earlier exploratory result is `evals/results/baseline-78dd850a4982-6.json`. It was generated from a dirty tree and is retained only as historical evidence.

Measured values:

| Metric | Value |
|---|---:|
| Identity accuracy (64 cases) | 1.0 |
| False merge rate | 0.0 |
| False split rate | 0.0 |
| Unresolved rate | 0.0 |
| Recall@1 (12 queries) | 0.1805555556 |
| Recall@5 | 0.4861111111 |
| Recall@10 | 0.8194444444 |
| MRR | 0.4555555556 |
| Extraction macro F1 | 0.9523809524 |
| Extraction micro F1 | 0.9523809524 |
| Hallucinated field rate | 0.0 |
| Citation precision (3 cases) | 1.0 |
| Unsupported citation rate | 0.0 |

Paper/code agreement and end-to-end task accuracy remain `NOT_YET_MEASURED`. The original clean baseline predates invalid-locator and wrong-work instrumentation, so its `null` values are not zero and should not be compared as numeric deltas.

## Baseline V1

The clean baseline is `evals/results/baseline-v1-edadc8a31da6.json`. It records commit `edadc8a31da6`, `workingTreeDirty: false`, and the original versioned offline datasets. It remains the historical reference for retrieval experiments; the expanded 44-query set is measured separately in the R-001 and final artifacts.

## Post-citation evaluation

`evals/results/post-citation-3e4aa68eadf3.json` evaluates the expanded retrieval set and citation-v1 with locator and wrong-work instrumentation. It records commit `3e4aa68eadf3` and `workingTreeDirty: true` because the instrumentation was measured before its follow-up commit.

| Citation metric | Value |
|---|---:|
| Citation precision (5 cases) | 1.0 |
| Unsupported citation rate | 0.0 |
| Invalid locator rate | 0.2 |
| Wrong-work rate | 0.2 |
| Missing-source rate | 0.2 |

The negative cases are intentionally retained in the result and do not represent production citation errors; they measure whether the validator detects those conditions. Machine-readable results now expose `invalidLocatorDetectionAccuracy`, `wrongWorkDetectionAccuracy`, and `missingSourceDetectionAccuracy` separately from the `*Rate` fields, which describe fixture prevalence.

## Citation support classification

`classifyEvidenceSupport` in `src/research/verification.ts` exposes five statuses: `SUPPORTED`, `PARTIALLY_SUPPORTED`, `UNSUPPORTED`, `CONTRADICTED`, and `UNKNOWN`, together with a basis explaining the deterministic text/negation heuristic. `citationSupportMetrics` reports classification accuracy, macro-F1, and per-class precision/recall. The main baseline runner now reports these values under `citationSupport`. This is a conservative deterministic heuristic evaluator; it does not promote heuristic output to verified provenance and is not an estimate of real-world semantic support accuracy.

The latest clean evidence-milestone run is `evals/results/evidence-milestone-53365b68f768.json`; its retrieval and identity values are unchanged from the accepted R-001 state. New runs include support-classification metrics and paper/code results.

## Paper/code benchmark

`evals/datasets/paper-code-v1.json` is the first curated seed benchmark. It contains 16 cases linking ML/LLM papers to named project repositories, with resolved repository HEAD SHAs, source classes, paper locators, repository paths/line ranges where inspected, temporal-alignment notes, and explicit field labels. The revision policy records the snapshot date and does not imply publication-era alignment when that cannot be independently established.

`paperCodeAgreement` in a baseline result reports case/field counts, classification accuracy, exact agreement, conflict precision/recall, false-agreement and false-conflict rates, correct-`UNKNOWN`, missing-side accuracies, and per-field metrics. `evals/results/*-paper-code-failures.json` contains machine-readable field diagnostics. A paper-side or code-side missing value is never converted to `MATCH`; scope-ambiguous fields are annotated `UNKNOWN`.

This is a curated comparator benchmark, not a production estimate and not yet an end-to-end automatic paper/code extraction score. Several repository snapshots are later than the paper and are explicitly marked temporally unaligned. Gold annotations must be independently corrected and versioned rather than changed to improve OpenPapers metrics.

See [the evidence-completeness plan](evidence-completeness-plan.md) for the ordered remaining evaluation work.

## End-to-end research tasks

`evals/datasets/research-tasks-v1.json` contains 15 independently curated, deterministic research questions. It includes reported values, appendix-only and repository-only evidence, source conflicts, temporal uncertainty, ambiguous scope, and explicit `NOT_REPORTED` versus `UNKNOWN` cases. `npm run eval:research` exercises the actual search, HTML parser, and explicit parameter extractor and writes per-task diagnostics. This is a measured integration boundary, not a claim that OpenPapers currently answers every field automatically. Unsupported fields remain visible as extraction failures.

The baseline at commit `82f1044f1285` reports work/identifier accuracy `0.5333`, answer correctness `0.4667`, evidence-source accuracy `0.8667`, locator accuracy `1.0`, support-status accuracy `0.7333`, correct `UNKNOWN` `1.0`, correct `NOT_REPORTED` `1.0`, false `UNKNOWN` `0.2667`, false `NOT_REPORTED` `0.0`, fabricated-answer rate `0.0667`, and conflict precision/recall `1.0/1.0` across 15 tasks. These synthetic fixture values are baseline evidence only.

`evals/datasets/pdf-v1.json` and `npm run eval:pdf` measure title, section, page, reference, appendix, equation, table, and warning recovery on five TEI fixtures. GROBID/TEI parsing passes the fixture corpus; PyMuPDF and Docling are recorded as not configured in this deterministic run. This does not measure live PDF acquisition or parser-service availability.

`npm run eval:providers` injects outages for scholarly providers and records transparent failure, retained evidence, false absence, and all-down uncertainty behavior. GitHub/Hugging Face are ecosystem adapters rather than members of the current scholarly search fan-out and therefore remain a separate integration gap.

`evals/datasets/retrieval-holdout-v1.json` is an untouched five-query checkpoint set. `npm run eval:holdout` evaluates the accepted R-001 ranking without using the holdout for tuning; its result records `developmentDataNotUsed: true` and remains separate from the 44-query development benchmark.

## Latest milestone result

`evals/results/final-milestone-1345a425ed06.json` is the latest clean-tree evaluation artifact. It records the post-R001 retrieval implementation, citation metrics, and 119-case identity guardrails from commit `1345a425ed06`.
