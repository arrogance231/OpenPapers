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
- End-to-end tasks: schema is defined, but manually verified task answers remain `NOT_YET_MEASURED` until independently curated.

These fixture results evaluate deterministic mapping, ranking, extraction, and validation behavior. They are not evidence of live-provider coverage, scientific correctness, or semantic embedding quality.
