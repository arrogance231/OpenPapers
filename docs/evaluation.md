# Evaluation status

OpenPapers has deterministic unit/adversarial tests and a separate offline evaluation harness. `scripts/mcp-benchmark.mjs` measures operational MCP latency; `npm run eval:baseline` measures retrieval, identity, extraction, and citation-quality fixtures.

The current harness includes versioned identity, retrieval-query, extraction, and citation datasets. Paper/code agreement, provider-failure transparency, PDF structure, and end-to-end research-task benchmarks remain future evaluation slices. Results record commit, timestamp, dataset version, provider configuration, and embedding model. Retrieval changes report canonical identity accuracy alongside ranking metrics.

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

The negative cases are intentionally retained in the result and do not represent production citation errors; they measure whether the validator detects those conditions.

## Citation support classification

`classifyEvidenceSupport` in `src/research/verification.ts` exposes five statuses: `SUPPORTED`, `PARTIALLY_SUPPORTED`, `UNSUPPORTED`, `CONTRADICTED`, and `UNKNOWN`, together with a basis explaining the deterministic text/negation heuristic. `citationSupportMetrics` reports classification accuracy, macro-F1, and per-class precision/recall. This is a conservative fixture evaluator; it does not promote heuristic output to verified provenance and is not an estimate of real-world semantic support accuracy.

## Latest milestone result

`evals/results/final-milestone-1345a425ed06.json` is the latest clean-tree evaluation artifact. It records the post-R001 retrieval implementation, citation metrics, and 119-case identity guardrails from commit `1345a425ed06`.
