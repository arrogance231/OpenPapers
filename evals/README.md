# OpenPapers evaluations

Evaluations measure research quality separately from deterministic software tests. They use versioned, manually traceable fixture data and never call live providers by default.

## Run the baseline

```sh
npm run eval:baseline
```

The command builds the current source, runs the offline harness, and writes a machine-readable result under `evals/results/` named with the current commit. Existing result files are never overwritten.

Each result records the commit, UTC timestamp, dataset versions, provider mode, configuration, and embedding model. `NOT_YET_MEASURED` is used for categories that do not yet have a defensible gold set; it is not reported as zero.

## Dataset policy

Datasets are versioned and immutable by convention. A change to labels, identifiers, relevance judgments, or gold evidence requires a new dataset version and a documented source rationale. Identifiers are selected from authoritative publisher, arXiv, or project sources recorded in each record. The baseline fixtures are deliberately small; expanding coverage is preferred to weakening traceability.

## Evaluation categories

- Canonical identity: alias resolution, false merge, false split, unresolved, and wrong-work rates.
- Retrieval: Recall@1/5/10, MRR, and Precision@K over realistic discovery queries.
- Extraction: per-field and macro/micro precision, recall, F1, plus hallucinated-field rate.
- Citation: evidence-backed valid/invalid claim fixtures and integrity metrics.
- Paper/code comparison: `evals/metrics/paper-code.mjs` provides classification, exact agreement, conflict, false-agreement, false-conflict, and correct-unknown metrics with per-field breakdowns. The independently curated official-repository gold set is not yet populated, so the main runner continues to report this category as `NOT_YET_MEASURED`.
- End-to-end tasks: schema is defined, but manually verified task answers remain `NOT_YET_MEASURED` until independently curated.

These fixture results evaluate deterministic mapping, ranking, extraction, and validation behavior. They are labeled DETERMINISTIC REGRESSION PERFORMANCE and are not evidence of live-provider coverage, scientific correctness, or semantic embedding quality.

## Real-source benchmark v1

`evals/datasets/research-real-v1.json` is a separate 18-case metadata benchmark containing 12 development cases and 6 paper-level holdout cases. It pins arXiv versioned URLs and, where an official repository is used, an observed 40-character commit SHA. PDFs are not redistributed: `npm run eval:acquire-real -- --split=development` downloads only to the ignored `.cache/real-source/` directory, enforces HTTPS/redirect/body limits, and records SHA-256 acquisition results. `npm run eval:validate-real` checks the provenance and split contract.

The holdout policy is explicit: `holdoutInfluencedTuning` is false, and detailed holdout failures must not be inspected during development. Real-source results must be reported as REAL-SOURCE DEVELOPMENT PERFORMANCE or REAL-SOURCE HOLDOUT PERFORMANCE and never merged with fixture metrics. Hashes are populated only after acquisition; an unavailable URL is recorded as unavailable rather than substituted.
