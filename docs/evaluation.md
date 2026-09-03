# Evaluation status

OpenPapers currently has deterministic unit and adversarial tests, but it does not yet ship a gold scholarly-quality evaluation dataset. Existing `scripts/mcp-benchmark.mjs` measures operational MCP latency and is not a retrieval-quality benchmark.

The next evaluation slice must add independently traceable gold annotations for canonical identity, Recall@K, MRR, training-configuration fields, paper/code agreement, provider-failure transparency, PDF structure, end-to-end research tasks, and citation correctness. Results must record commit, timestamp, dataset version, provider configuration, and embedding model. Retrieval changes must report canonical identity accuracy alongside ranking metrics.

Until that layer exists, no retrieval or citation-quality improvement is claimed from the deterministic test suite.

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

The clean baseline is `evals/results/baseline-v1-edadc8a31da6.json`. It records commit `edadc8a31da6`, `workingTreeDirty: false`, the versioned offline datasets, and the same measured values above. This is the reference for retrieval experiments. The query set is intentionally still small and is expanded before ranking changes.

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
