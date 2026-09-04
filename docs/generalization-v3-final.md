# Generalization Architecture V3 checkpoint

## Starting state

- Previous HEAD: `b2665df`
- Branch: `master`
- Worktree: clean; ahead of origin by 35 commits; nothing pushed.
- Final V3 implementation HEAD is recorded in Git history.

## Historical evidence (immutable)

- V1: development answer correctness 0.8462, holdout 0.5000; false UNKNOWN 0.2308 / 0.6667; fabrication 0 / 0.
- V2: development answer correctness 1.0000, holdout 0.0000; false UNKNOWN 0 / 0.8000; fabrication 0 / 0.
- `V2 HOLDOUT USED FOR TUNING = NO`.

## Architecture

Added `ResearchFact`, a bounded typed, provenance-bearing representation, query-independent paper extraction, query-independent repository extraction, `ResearchQueryIntent`, and fact-based answer assembly. The MCP reconstruction path and `ResearchService` now use the generic fact path. Facts carry predicate, normalized/raw value, source class, source ID, raw evidence, locator, extraction method, and support state. Repository facts carry exact repository path, commit SHA, and line range.

The old proposition extractor remains only as a compatibility API; the new V3 evaluator and MCP path do not pass the user query into source extraction. The audit plan is in `docs/query-independent-evidence-plan.md`.

## V3 corpus

- 16 new papers: 12 development, 4 holdout.
- No V1/V2 arXiv overlap after metadata validation.
- Development acquisition: 12/12.
- Holdout acquisition: 4/4.
- V3 holdout was acquired and evaluated once only.
- `V3 HOLDOUT USED FOR TUNING = NO`.

## V3 development

Final artifact: `evals/results/real-source-v3-development-9ec9934b2290.json`.

- Fact precision: 0.1053
- Fact recall: 1.0000
- Value accuracy: 1.0000
- Locator accuracy: 1.0000
- Query predicate accuracy: 1.0000
- Answer correctness: 1.0000
- Evidence-source accuracy: 1.0000
- Support-status accuracy: 0.6667
- False UNKNOWN: 0.0000
- False NOT_REPORTED: 0.0000
- Fabricated-answer rate: 0.0000

The low fact precision is material: broad source passes still emit unsupported/non-gold candidate facts. This is not hidden by the perfect task score.

## A3 experiments

- A3-001: query-independent fact model and fact-based assembly. Development baseline established; no fabrication.
- A3-002: general source-context filtering for related-work/citation mentions. Answer correctness improved from 0.6667 to 0.8333; fact recall reached 0.8333 in the intermediate run; no fabrication.
- A3-003: general canonical normalization and repository fact extraction. Final development answer correctness/fact recall/value/locator: 1.0000; fact precision 0.1053; no fabrication.

No paper-title, arXiv-ID, benchmark-task, or answer-constant special cases were added.

## LOPO and paraphrase diagnostics

Artifact: `evals/results/real-source-v3-generalization.json`.

- LOPO diagnostic answer correctness: 1.0000.
- LOPO fact recall mean: 1.0000.
- Unseen-query paraphrase invariance: 1.0000 over 4 applicable cases.

These diagnostics are limited: the current deterministic evaluator has no learned per-paper state, and the paraphrase harness supplies the canonical predicate to the intent layer. They are not equivalent to a fully blind semantic query benchmark.

## V3 one-shot holdout

Artifact: `evals/results/real-source-v3-holdout-ff4bf90e9998.json`.

- Fact precision: 0.0256
- Fact recall: 0.2500
- Value accuracy: 0.2500
- Locator accuracy: 1.0000
- Query predicate accuracy: 1.0000
- Answer correctness: 0.2500
- Evidence-source accuracy: 0.7500
- Support-status accuracy: 0.5000
- False UNKNOWN: 0.2500
- False NOT_REPORTED: 0.0000
- Fabricated-answer rate: 0.0000
- Holdout tuning: NO.

Compared with V2 holdout, answer correctness improved 0.0000 → 0.2500, false UNKNOWN improved 0.8000 → 0.2500, and fabrication stayed 0.0000. The 0.7500 dev-to-holdout answer gap remains large and fact recall collapses to 0.25.

## Repository and parser status

- Generic repository fact extraction is implemented and tested with exact pinned path/line/SHA assertions.
- Independent live V3 repository gold annotations were not added; repository quality metrics beyond the fixture test remain NOT MEASURED.
- PyMuPDF remains the active parser.
- GROBID and Docling fact-recovery comparison: SKIPPED.

## MCP/providers/storage

- MCP reconstruction routes through generic facts and preserves UNKNOWN with no evidence.
- Existing provider degradation and PostgreSQL migration suites pass.
- New deterministic real-artifact MCP transport CI coverage was not added.
- GitHub/Hugging Face expanded degradation matrix was not added.

## Verification

PASS: `npm run check`, `npm run eval:baseline`, `npm run eval:research`, `npm run eval:pdf`, `npm run eval:providers`, `npm run test:postgres`, `npm run package:dry-run`, `npm audit --audit-level=high`, `git diff --check`.

npm audit: 0 vulnerabilities.

## Decision

ALPHA READY. V3 demonstrates a real architectural separation and materially better holdout behavior than V2 while preserving zero fabrication, but fact precision/holdout fact recall remain too weak for beta. Do not promote based on V3 development perfection.

## Remaining work

Improve generic fact precision and cross-paper value recovery; independently annotate repository gold; strengthen semantic intent tests without supplying predicates; add real-artifact MCP CI; compare parser fact recovery; complete expanded provider/lifecycle matrices.

## Push state

Nothing pushed.
