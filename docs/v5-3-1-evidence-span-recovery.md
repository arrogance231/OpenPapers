# V5.3.1 Evidence Span Recovery & Candidate Discovery Calibration

## Scope

This checkpoint remains limited to the existing production path:

`PDF -> ParsedDocument -> CandidateEvidence -> validation -> ResearchFact`

No V5 holdout was created or consumed. V1-V4 holdouts remain untouched. DSR-001's broad heading/level rewrite was not reintroduced.

## Audit

The PyMuPDF command parser supplies raw page text and reconstructed sections. Before this checkpoint, candidate extraction split section text into sentences before repairing PDF line artifacts. A line such as `4-\nbit` (or parser-joined `4- bit`) could therefore miss a supported value rule. Candidate evidence also had no explicit normalized representation.

The new representation is:

- `rawText`: the original section sentence, retaining line breaks and source spelling;
- `normalizedText`: deterministic matching text;
- `context`: normalized section context;
- locator: the original section/page locator.

Normalization uses Unicode NFKC, common ligatures, soft-hyphen removal, line-boundary dehyphenation, dash normalization, non-breaking-space normalization, and bounded whitespace collapse. It does not use fuzzy semantic matching or delete arbitrary internal hyphens.

The parser also joins a line beginning with an alphanumeric character directly to a preceding line ending in a hyphen. Raw page text remains untouched in parser output.

## Span recovery V2

Runner: `npm run eval:span-recovery`

The runner independently reports raw exact, layout-normalized, and normalized token-sequence page recovery, source-section recovery, physical page agreement, SHA-256, and the recovered physical page locator for all seven gold facts.

At this corpus revision:

- raw exact span recall: 0.7143;
- layout-normalized span recall: 0.7143;
- token-sequence span recall: 0.7143;
- section text recovery: 0.5714;
- physical page agreement: 0.2857.

The unchanged normalized result is important: two gold annotations are not formatting-only losses. BERT's exact gold sentence is not present in the downloaded PDF text, and the QLoRA gold sentence occurs in the PDF's introduction while the annotation declares the QLORA Finetuning scope/page. These are annotation/source-scope reconciliation findings, not reasons to infer facts.

Physical PDF page index is the reproducible runtime locator. Gold printed/source-paper page labels are retained for comparison; page disagreement is not automatically a fact failure.

## Failure traces

The existing FN trace was rerun after normalization:

- parse success: 7/7;
- raw text presence: 0.7143;
- candidate generation: 0.8571;
- validator acceptance: 0.8571;
- remaining candidate-discovery failure: BERT architecture depth.

BERT remains a real limitation: the downloaded text contains occurrences of `BERTBASE`, but not the independently annotated `BERTBASE has 12 layers` sentence in the declared section. No table or title inference was added.

QLoRA was a candidate-rule gap in the bounded QLORA section: the supported precision rule now accepts explicit `N-bit finetuning` as well as `N-bit quantized/precision`, without changing validators. The resulting fact remains evidence-backed and provenance-bearing.

Attention optimizer scope was an evaluation mapping problem. The candidate and validator already succeeded in the parser's `Optimizer` subsection. The evaluator now permits a bounded evidence-bearing section mapping when the candidate's raw evidence deterministically occurs in an independently annotated source section. This does not broaden production extraction or turn arbitrary neighboring headings into scope.

## ESR experiments

### ESR-001 — normalization and raw provenance

Layer: text normalization only.

Changes: layered normalized text, ligatures, whitespace/dash normalization, safe line-boundary dehyphenation, parser line-wrap join, and `normalizedText` on CandidateEvidence. Validators were not tightened.

Result: the fixture normalization and provenance tests pass. The real corpus span score remains 0.7143 because the two misses are not formatting-equivalent. No precision regression or fabrication was observed.

Decision: ACCEPT as a safe infrastructure change; do not claim a corpus recall increase from normalization alone.

### ESR-002 — typed precision candidate discovery

Layer: CandidateEvidence discovery only.

Hypothesis: existing `training.precision` should recognize an explicit `N-bit finetuning` statement after normalized line recovery.

Result against the prior real-PDF checkpoint: candidate count 165 -> 175; candidate recall mean 0.5833 -> 0.7500; fact TP 4 -> 5; fact recall 0.5714 -> 0.7143; precision remained 1.0000; fabrication remained 0.

Decision: ACCEPT. The pattern remains typed and bounded; validators are unchanged.

### ESR-003 — bounded scope mapping

Layer: evaluation scope association only.

Hypothesis: a validated fact whose raw evidence is present in an independently annotated source section should not be lost solely because PyMuPDF labels a subsection separately.

Result: TP 5 -> 6; FP 0; FN 2 -> 1; precision after the mapping is 1.0000; recall 0.8571; F1 0.9231. The mapped section is evidence-bearing, not a broad hierarchy reconstruction.

Decision: ACCEPT with the explicit limitation that this is evaluation scope recovery, not a production section filter.

## Current real-PDF checkpoint

Artifact: `evals/results/v5-real-pdf-fact-baseline-9a7de055b9b4.json`

- papers: 6;
- parse success: 6/6;
- candidates: 175;
- candidate recall mean: 0.7500;
- TP: 6;
- FP: 0;
- FN: 1;
- precision: 1.0000;
- recall: 0.8571;
- F1: 0.9231;
- OUT_OF_SCOPE: 169;
- fabrication: 0.

The remaining BERT FN is not repaired by inference. The accepted changes materially improve the V5.2 real-PDF checkpoint without a DSR-001-style regression.

## LOPO

The real-PDF LOPO runner was rerun after the accepted changes:

- mean candidate recall: 0.7500;
- mean precision: 0.8333;
- mean recall: 0.8333;
- mean F1: 0.8333.

The result is diagnostic on the six-paper development corpus. The BERT paper remains the only zero-recovery case; its gold sentence is absent from the downloaded PDF text rather than being recovered through a formatting variant. No holdout was consumed.

## Benchmark boundary

Production extraction remains query-independent and benchmark-independent. CandidateEvidence never directly supports answers. No benchmark title, paper ID, expected value, or gold predicate is present in production extraction.

## Deferred

GROBID/Docling comparison, expanded gold, repository facts, raw query-intent expansion, reconciliation, MCP artifact CI, provider matrices, PostgreSQL matrix completion, and V5 holdout creation remain outside this focused evidence-recovery checkpoint.

Release readiness remains `ALPHA READY`. The improved development result is not sufficient for beta because the corpus is small, LOPO and parser-quality evidence remain limited, and the final holdout has intentionally not been created.
