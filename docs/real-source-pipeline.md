# Real-source pipeline audit

Status: IN PROGRESS. This checkout does not contain `research-real-v1`, `acquire-real-source.mjs`, or the `eval:*real*` commands named by the milestone brief. The advertised real-source and holdout evaluations therefore cannot be run from this repository state.

| Stage | Production implementation | Real evaluator uses it? | Status |
| --- | --- | --- | --- |
| Query interpretation | `ResearchService.search` expansion and provider fan-out | No real evaluator present | PARTIAL |
| Work resolution | ArXiv/Crossref/OpenAlex/Semantic Scholar adapters and identity reconciliation | No real evaluator present | PARTIAL |
| Canonical reconciliation | DOI/arXiv identity index in `ResearchService.search` | No real evaluator present | PARTIAL |
| Paper acquisition | `PaperAcquirer` with parsed-document cache | Existing synthetic/PDF runners only | COMPLETE for existing path |
| PDF parsing | `PdfParserChain`, GROBID client, configured fallback adapters | Existing PDF runner only | PARTIAL; live GROBID not verified |
| Paper extraction | heuristic facts, claims, and explicit training parameters | Synthetic research runner bypasses `ResearchService` paper ingestion | PARTIAL / BYPASSED |
| Repository resolution | GitHub search, revision, content, and directory APIs | Existing ecosystem MCP only | PARTIAL |
| Pinned repository acquisition | `PinnedRepositoryReader` uses the requested SHA and bounded recursive discovery | Newly available through `ResearchService.readPinnedRepository` | COMPLETE for GitHub boundary |
| File discovery | deterministic README/config/training/launch/model-card signals; generated/vendor paths excluded | Not in existing evaluator | COMPLETE for reader |
| Line locator | exact one-based line spans, supporting text, commit SHA | Not in existing evaluator | COMPLETE for reader |
| Repository extraction | explicit parameter patterns with raw and normalized values | Not in existing evaluator | PARTIAL; benchmark field coverage remains to be wired |
| Evidence source separation | repository source classes (`CONFIG`, `TRAINING_SCRIPT`, `README`, `MODEL_CARD`) | Not in existing evaluator | PARTIAL |
| Temporal alignment | conservative date classification with reason | Not in existing evaluator | COMPLETE as isolated production primitive |
| Evidence reconciliation | inspected/unavailable distinction; match/conflict/missing/not-reported | Not in existing evaluator | COMPLETE as isolated production primitive |
| Answer assembly | evidence-backed supported answer; conflicts and unknowns preserved | Not in existing evaluator | PARTIAL; no full paper+repo task runner exists |
| Citation/evidence packaging | existing `Evidence` model and MCP responses | No real evaluator present | PARTIAL |
| MCP real-source transport | existing paper/ecosystem tools; no pinned reconstruction tool | No real artifacts available | MISSING |

## Implemented in this slice

`src/research/real-pipeline.ts` provides a production-bound GitHub reader that:

- accepts only a 40-character commit SHA;
- traverses repository directories with file and byte limits;
- excludes common generated, vendor, checkpoint, and dataset paths;
- retrieves content using the exact requested revision;
- emits raw value, normalized value, source class, supporting line, and one-based locator;
- emits a replay manifest with SHA-256 content hash, size, commit, route, and timestamp;
- preserves `UNKNOWN` for acquisition/parser failure;
- emits `NOT_REPORTED` only after both sources are explicitly marked inspected.

`ResearchService.readPinnedRepository` and `reconcilePaperAndRepositoryEvidence` expose these boundaries to production callers.

## Verified scope

- Full existing suite: 51 files, 187 tests passed.
- TypeScript lint, architecture check, and build passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- Package dry-run passed.
- New pinned-reader tests passed (6 tests in `tests/real-pipeline.test.ts`).

The real-source dataset, acquisition manifest, real paper corpus, real repository cases, holdout, and one-shot holdout checkpoint remain unavailable in this checkout. No holdout was inspected or used for tuning.
