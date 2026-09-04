# V5.3 document structure recovery

## Audit

V5.2 production extraction already separates CandidateEvidence, validation, and ResearchFact. The dominant real-PDF loss is earlier: the PyMuPDF command parser emits brittle headings and section assignments. The existing parser turns extracted blocks into `ParsedDocument.sections`, with page numbers attached to sections, then facts traverse those sections. The real-PDF evaluator previously matched scope through heading strings, which conflated document-structure failure with fact failure.

The V5.2 baseline remains immutable. This checkpoint adds a deterministic FN trace and raw-page instrumentation without changing the V5.1/V5.2 artifacts.

## FN trace

Artifact: `evals/results/v5-3-fn-trace-ec8398bafb41.json`

The trace attempts all seven current gold facts against the same six downloaded PDFs and records SHA acquisition, raw page text presence, page agreement, parser section assignment, candidate generation, validator acceptance, and failure stage.

- Parser/acquisition success: 7/7 fact traces
- Raw normalized evidence presence: 0.7143
- Correct page: 0.2857
- Section recovery: 1.0000 under the broad parser-section diagnostic
- Candidate generation: 0.7143
- Validator acceptance: 0.7143
- Failure stages: 2 candidate-discovery failures; 5 accepted facts

The page score is not treated as a parser failure automatically: the gold page labels use the source-paper numbering while PyMuPDF reports physical PDF pages. Both values remain recorded for adjudication.

Representative traces show BERT depth evidence was not recoverable as the exact normalized gold phrase (`BERTBASE` versus parser spacing/formatting), while QLoRA precision evidence was present on a page but not converted into the expected candidate. LoRA frozen evidence was recovered and accepted under predicate-aware negation. Attention and DPO evidence were recovered, with many additional parser candidates outside the bounded scope.

## Document-quality metrics

The trace separates:

- raw evidence span recovery
- page agreement
- parser section recovery
- candidate generation conditional on recovered evidence
- validator acceptance

No fuzzy semantic matching is used. Internal comparison performs Unicode normalization, ligature handling, whitespace collapse, dash normalization, and safe line-boundary dehyphenation. Raw evidence remains unchanged in provenance.

## DSR-001

A structure experiment was attempted using block-level PyMuPDF ordering, heading numbering/level recovery, and parser-section-based scope selection. It was not accepted because the combined change regressed the real-PDF score relative to V5.2: candidate recall 0.4167, precision 0.6000, recall 0.4286, F1 0.5000, and OUT_OF_SCOPE 159. The implementation was reverted rather than tuning toward the worse result. This is recorded as a rejected experiment, not a new baseline.

The only accepted parser-side change in this checkpoint is exposing raw page text in the parser output for diagnostics. The production section algorithm remains at the V5.2 checkpoint pending an isolated generic recovery change.

## Current checkpoint

No holdout was created. No V1–V4 holdout was used. No paper-specific production rule was added. No validator tightening was performed. The repository remains ALPHA READY. Real-PDF PyMuPDF evidence recovery and cross-paper recall remain the blocking quality issues before gold expansion or secondary roadmap work.
