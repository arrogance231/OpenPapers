# Real-world research reconstruction v1

Status: IN PROGRESS — benchmark contract and acquisition boundary implemented; real pipeline scoring is not yet complete.

## Dataset

`evals/datasets/research-real-v1.json` contains 19 paper-level cases: 13 development and 6 holdout, with 19 tasks across architecture, pretraining, distributed training, alignment, quantization, serving, agents, tool use, and multimodal research. The holdout is frozen by case and the manifest declares `holdoutInfluencedTuning: false`. Gold labels distinguish SUPPORTED, PARTIALLY_SUPPORTED, CONFLICTING, UNKNOWN, and NOT_REPORTED. Each case pins an arXiv versioned URL; repository-backed cases record a 40-character commit SHA. Repository commit dates and PDF hashes remain null until independently acquired/verified.

The initial corpus is a metadata/provenance benchmark. It does not claim that all annotations have been independently re-checked against downloaded PDFs yet. Annotation rationale is required, and `NOT_REPORTED` requires an explicit source-review rationale.

## Acquisition policy

Run `npm run eval:validate-real` to validate the manifest, then `npm run eval:acquire-real -- --split=development` to retrieve development PDFs into ignored `.cache/real-source/`. `--metadata-only` performs the split/acquisition bookkeeping without network access. Acquisition allows HTTPS only, revalidates redirects, limits redirects to four, enforces a 50 MiB body limit, verifies configured SHA-256 values, and fails transparently on unavailable artifacts. No PDFs or repository checkouts are committed. The current manifest uses `PENDING_ACQUISITION` for hashes; this is not evidence that a downloaded artifact was verified.

## Evaluation status

`npm run eval:real-dev` currently emits a deliberately conservative baseline: without acquired PDFs and a configured parser, every task is UNKNOWN, answer fields are empty, and fabrication is zero. This is a harness/provenance baseline, not real-source performance. `npm run eval:real-holdout` is guarded by an explicit flag and must not be used during tuning.

The next required slice is to connect the runner to the existing `ResearchService.readPaper`/PDF parser chain and pinned repository evidence, then independently curate and hash development artifacts. GROBID live, PyMuPDF, and Docling comparison remains unmeasured. The existing five-case TEI fixture result remains DETERMINISTIC REGRESSION PERFORMANCE and is not merged with this benchmark.

## Reporting rules

Report synthetic fixtures, REAL-SOURCE DEVELOPMENT PERFORMANCE, and REAL-SOURCE HOLDOUT PERFORMANCE separately. Preserve raw and normalized values and scope. Provider, acquisition, or parser failure is UNKNOWN; only an inspected authoritative scope can justify NOT_REPORTED. Current repository content is not publication-era evidence without a pinned temporal relationship. No beta claim is justified by this intermediate slice; release classification remains ALPHA READY pending real-source end-to-end evidence.
