# V5.1 production fact extraction architecture

## Audit

At the V5 starting commit `e30de69`, production paper extraction was `ParsedDocument -> PaperFact[]` in `src/extraction/heuristic.ts`. `PaperFact` classified entire sections by heading and did not carry a predicate-specific value. Training parameters were a separate regex extractor. The claimed V4 `CandidateEvidence -> validator -> ResearchFact` path did not exist. The scoped V5 adapter therefore scored broad section objects and recorded precision/recall 0.

Reusable abstractions are `ParsedDocument`, `DocumentSection`, `Locator`, `ResearchService.readPaper`, `PaperFact`, `ResearchWork`, and repository line locators. Existing `PaperFact` remains compatible for recipe/claim callers. New structured facts are deliberately separate.

## Production model

`src/extraction/facts.ts` defines:

- `CandidateEvidence`: candidate predicate, raw value/text, source, exact section/page locator, surrounding section context, optional subject hint, scope/stage hints, and trigger kind.
- `ResearchFact`: predicate, normalized value, raw value, value type, source, locator, raw evidence, optional subject/role/scope/stage, and extraction method.
- `FactExtractionResult`: all candidates, accepted facts, and explicit rejection diagnostics.

The bounded initial predicate registry covers optimizer, training dataset, architecture depth, attention algorithm, training precision, preference method, parameter update status, and retrieval role. It is generic terminology, not benchmark identifiers.

## Flow

`ResearchService.extractResearchFacts(url)` reads and parses the source, then invokes the query-independent production function. `extractCandidateEvidence` traverses every non-empty paper section and sentence; it never receives a query, benchmark task, expected answer, or canonical predicate. Candidate rules retain exact sentence and section/page provenance. `validateCandidateEvidence` then rejects obvious citation/related-work, baseline/ablation, negated, empty, or invalid values. Only accepted candidates become `ResearchFact` objects.

The V5 runner now calls `extractResearchFacts` directly. It no longer adapts broad `PaperFact` output. The same implementation is available through `ResearchService` for future MCP and ResearchPack integration.

## Compatibility and limits

`PaperFact` is retained for existing claims and recipe APIs. `ResearchFact` is not persisted and no database migration was added. Repository extraction still has its existing `RepositoryEvidence` representation; its fields remain compatible with a future shared fact envelope but repository conversion is intentionally deferred.

The current validator is deterministic and rule/evidence based; it does not emit confidence probabilities. Rejection categories are explicit (`REJECT_CITATION`, `REJECT_BASELINE`, `REJECT_NEGATION`, `REJECT_NORMALIZATION`, plus reserved role/scope/stage/unsupported categories). Current role/scope/stage hints are conservative metadata; deeper grammatical role validation remains future calibration work.

## Checkpoint

The production baseline at `evals/results/v5-scoped-fact-baseline-c157691761ae.json` reports 9 candidates, candidate recall 1.0, 6 TP, 2 FP, 1 FN, precision 0.75, recall 0.8571, and F1 0.8 across the unchanged six-paper/seven-fact corpus. LOPO at `evals/results/v5-scoped-fact-lopo-c157691761ae.json` reports mean precision 0.6667, recall 0.8333, and F1 0.7222. This demonstrates non-zero cross-paper recovery without production benchmark IDs.

The result is an architecture checkpoint, not final validator calibration. The corpus remains intentionally unchanged, no V5 holdout was created, and the previous pre-architecture artifact remains immutable.
