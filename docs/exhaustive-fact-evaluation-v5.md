# Generalization Architecture V5: exhaustive scoped fact evaluation

Status: development benchmark infrastructure and first baseline. This document records the measurement contract; it does not promote the release beyond ALPHA READY.

## Audit of the current boundary

The repository at the V5 starting commit exposes `ParsedDocument -> PaperFact[]` through `src/extraction/heuristic.ts` and a separate explicit training-parameter extractor. It does not currently contain the CandidateEvidence, ResearchFact, predicate ontology, or validator interfaces described in the historical V4 narrative. Therefore this milestone adds a measurement seam around the existing deterministic `PaperFact` output rather than pretending an absent validator exists. No production extractor or query-driven extraction shortcut was added.

The prior extraction metric in `evals/metrics/metrics.mjs` is field-level and sparse: it compares only named fields present in small fixtures. It cannot distinguish an exhaustive false positive from a valid unannotated fact, does not model section/predicate scope, and has no duplicate, out-of-scope, role, stage, or locator decomposition. Its values remain historical diagnostics and are not replaced retroactively.

## Gold contract

`evals/datasets/research-facts-v5-development.json` is an independently authored, revision-pinned development corpus of six real arXiv papers. Each record identifies the PDF URL, exact downloaded SHA-256, paper version, bounded source sections, allowed predicate families, and source-verified evidence snippets. Gold is not generated from OpenPapers output. The initial bounded excerpts are deliberately small and should be expanded from the same pinned artifacts before any claim of mature precision is made.

Every scope declares `EXHAUSTIVE_WITHIN_SCOPE`: all facts in the allowed predicate families in the named sections must be represented. A fact outside the named sections or families is `OUT_OF_SCOPE`, tracked separately rather than counted as a false positive. Within scope, unsupported, wrong value/predicate/role/stage/scope/subject, baseline/citation contamination, and false normalization are errors.

Gold uses one canonical fact with multiple supporting locators when repeated evidence is semantically identical. Deterministic equivalence is limited to explicit rules: supervised fine-tuning/SFT, bfloat16/bf16, and direct preference optimization/DPO. There is no fuzzy semantic equivalence.

The recorded unchanged baseline is `evals/results/v5-scoped-fact-baseline-f9d37d9113b5.json` (extractor commit `f9d37d9113b5060d2bd982ae68c846324d68290c`). It contains 6 papers and 7 gold facts. On the deliberately conservative adapter over current section-level output: 3 candidates, TP=0, FP=3, FN=7, OUT_OF_SCOPE=0, duplicate-equivalent=0, precision=0, recall=0, F1=0, mean candidate recall=0.5, and mean candidates/gold=0.4167. This is a real negative calibration signal, not a release-quality estimate: the current extractor emits broad section objects while the gold is fact-level, so the result demonstrates the measurement gap and justifies no validator tuning yet.

The diagnostic LOPO artifact is `evals/results/v5-scoped-fact-lopo-f9d37d9113b5.json`; mean precision/recall/F1 are all 0. Since the current extractor has no learned or paper-specific rules, this is a transfer diagnostic, not a trained LOPO experiment.

## Metrics and diagnostics

`evals/metrics/scoped-facts.mjs` provides schema validation, deterministic equivalence, per-paper scoring, aggregate TP/FP/FN, precision, recall, F1, candidate count, candidate recall, candidates per gold fact, OUT_OF_SCOPE, duplicate-equivalent count, locator/value/predicate/scope diagnostics, and validated-fact density. Error decomposition is machine-readable. Candidate density and validated density are diagnostic only and are not optimization targets.

`npm run eval:fact-schema` validates gold without extraction. `npm run eval:fact-baseline` builds the current code and records the unchanged baseline at `evals/results/v5-scoped-fact-baseline-<commit>.json`. The baseline currently projects the existing broad section-level `PaperFact` objects into a conservative fact benchmark adapter; it is explicitly not evidence that a V4 validator layer is present or calibrated.

The implementation does not create a V5 holdout, does not consume V1-V4 holdouts, and does not tune production behavior. LOPO, repository exhaustive gold, automatic paper/code reconciliation, live GROBID/Docling comparison, real-artifact MCP CI, and complete provider/PostgreSQL matrices remain separate gates; they must be implemented and measured before any beta decision.

## Acceptance rules for later calibration

1. Validate annotations, locators, evidence text, allowed families, and normalization before scoring.
2. Save the unchanged baseline before validator changes.
3. Decompose every FP and FN; do not optimize the old sparse global precision.
4. Prefer validator calibration over candidate narrowing when candidate recall is high.
5. Keep query intent separate from source fact extraction and measure it independently.
6. Run LOPO on development before creating a final holdout.
7. A failure to retrieve an external provider is uncertainty, never a semantic absence.
8. Do not promote to beta based on answer accuracy alone.

## Current release decision

ALPHA READY remains the correct status. This first V5 artifact makes precision measurement possible within declared scopes, but it does not yet establish strong validator precision/recall, LOPO transfer, repository quality, parser recovery, or the remaining beta gates.
