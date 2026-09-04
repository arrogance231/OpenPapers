# V5.2 validator and real-PDF plan

## Audit

V5.1 added `src/extraction/facts.ts` and `ResearchService.extractResearchFacts()`. The production path is now CandidateEvidence -> validation -> ResearchFact. The scoped fixture runner calls that path directly. `PaperFact` remains a compatibility abstraction for claims and recipes.

The missing seam is runtime PDF evaluation: the current scoped runner constructs ParsedDocument sections from independently authored bounded source excerpts. V5.2 adds `eval:fact-real-pdf`, which acquires each pinned PDF, verifies its SHA-256, sends bytes through the configured production PDF parser chain, and evaluates the resulting production facts. It does not inject fixture text after parsing.

## Gold semantics before tuning

The BERT scope intentionally remains focused on BERTBASE, because the existing seven-fact corpus is frozen for this checkpoint and the gold fact carries subject `BERTBASE`. A BERTLARGE depth candidate is therefore diagnosed as outside the selected subject scope rather than silently counted as an annotation omission. The frozen-parameter fact is retained as `training.parameter_update = base weights frozen`; its source sentence contains a negative grammatical predicate about updates, but positively entails the frozen state. A global negation rejection is therefore incorrect for this predicate.

No dataset version or fact count change is made in this checkpoint. Historical V5.1 artifacts remain immutable.

## Runtime sequence

1. Acquire six pinned arXiv PDFs through PaperAcquirer.
2. Verify each downloaded SHA-256 against the existing dataset record.
3. Parse through live GROBID via PdfParserChain.
4. Traverse ParsedDocument sections with query-independent production discovery.
5. Validate and normalize ResearchFacts.
6. Score against the unchanged scoped gold.
7. Record parse, section, candidate, fact, locator, and failure diagnostics.

The runner is bounded to the six existing papers and runs parser requests concurrently. Parser failure is recorded per paper and never converted to NOT_REPORTED.

## Calibration sequence

The first real-PDF run is the unchanged V5.1 production baseline. Only after preserving it should predicate-aware negation, subject, role, scope, and stage changes be considered. Each change must have a VC experiment record, fixture regression, real-PDF score, and LOPO result. No paper IDs, titles, or gold evidence strings are permitted in production rules.

The current implementation exposes explicit rejection reasons and retains candidate/fact separation. Repository fact conversion, raw query intent, parser comparison, provider expansion, and V5 holdout creation remain deferred until the real-PDF fact path is measured.
