# Generalization Architecture V4 checkpoint

## Starting state

- Previous HEAD: `ca1ce9c`
- Branch: `master`
- Worktree: clean; ahead of origin by 44 commits; nothing pushed.

## Historical evidence

V1 development/holdout answer correctness: 0.8462 / 0.5000; false UNKNOWN 0.2308 / 0.6667; fabrication 0 / 0.

V2 development/holdout answer correctness: 1.0000 / 0.0000; false UNKNOWN 0 / 0.8000; fabrication 0 / 0.

V3 development/holdout fact precision: 0.1053 / 0.0256; fact recall 1.0000 / 0.2500; answer correctness 1.0000 / 0.2500; fabrication 0 / 0. `V3 HOLDOUT USED FOR TUNING = NO`.

## Fact metric audit

V3 counted every emitted fact against one task-linked gold fact per paper. The V3 gold did not declare exhaustive sections or predicate families. Therefore unannotated facts were automatically counted as false positives.

Development-only adjudication sample: `evals/results/v4-fact-fp-adjudication-sample.json`.

- Sample size: 30
- Valid fact missing from gold: 4 (13.3%)
- Wrong role: 6
- Wrong scope: 2
- Normalization mismatch: 1
- Clearly unsupported emission: 17 (56.7%)

Conclusion: old global fact precision was not a valid complete-fact precision metric. The repaired baseline is `evals/results/fact-eval-v2-baseline-ca1ce9c.json`; it reports task-linked precision separately and 102 emitted facts outside that sparse task scope as unscored.

## CandidateEvidence architecture

Added `CandidateEvidence`, `discoverCandidateEvidence`, `validateCandidateEvidence`, and the `CandidateEvidence -> validator -> ResearchFact` boundary. Candidates preserve trigger, raw text, context, section, source ID, and locator. Validators apply generic citation/related-work, negation, role, stage, scope, and predicate-context checks.

V3-development candidate audit: `evals/results/v4-candidate-development-audit.json`.

- Gold facts: 12
- Candidates: 454
- Validated facts: 89
- Candidate recall under the sparse predicate-linked audit: 1.0000
- Fact recall under the same audit: 1.0000
- Candidates per gold fact: 37.83
- Validator false rejections: 0

The candidate/gold ratio remains high; this is a visible overproduction diagnostic, not suppressed by the repaired task-linked metric.

## Query intent

Raw-question evaluation without gold predicate injection: `evals/results/v4-query-intent-development.json`.

- Predicate accuracy before generic cue expansion: 0.5000
- Predicate accuracy after generic cue expansion: 1.0000
- Stage accuracy: 0.9167

The V4 evaluator still uses task predicates for fact selection after intent classification; raw intent metrics are reported separately.

## V4 development corpus

- 12 new papers
- 9 development cases
- 3 holdout cases
- No V1/V2/V3 overlap
- Development acquisition: 9/9
- Fact-first, task-linked non-exhaustive annotation scope

Final development result: `evals/results/real-source-v4-development-514b452eb3c6.json`.

- Global diagnostic fact precision: 0.1304; not exhaustive-gold precision
- Fact recall: 1.0000
- Value accuracy: 1.0000
- Locator accuracy: 1.0000
- Query predicate accuracy: 1.0000
- Answer correctness: 1.0000
- Evidence-source accuracy: 1.0000
- Support-status accuracy: 0.1111 because several distinct values share coarse predicates and are reported as conflicts
- False UNKNOWN: 0.0000
- False NOT_REPORTED: 0.0000
- Fabricated-answer rate: 0.0000

## V4 holdout

Artifact: `evals/results/real-source-v4-holdout-7f63d91e9e5f.json`.

- Holdout acquisition: 3/3
- Diagnostic global fact precision: 0.09375; not exhaustive-gold precision
- Fact recall: 1.0000
- Value accuracy: 1.0000
- Locator accuracy: 1.0000
- Raw predicate accuracy: 1.0000
- Answer correctness: 1.0000
- Evidence-source accuracy: 1.0000
- Support-status accuracy: 0.6667
- False UNKNOWN: 0.0000
- False NOT_REPORTED: 0.0000
- Fabricated-answer rate: 0.0000

`V4 HOLDOUT USED FOR TUNING = NO`.

Because the V4 gold is task-linked and non-exhaustive, the precision values above are diagnostic only. They do not establish exhaustive source-to-fact precision.

## Experiments

- F4-001: fact metric audit and development-only adjudication. Decision: accepted; old global precision is not used as a valid exhaustive metric.
- F4-002: CandidateEvidence plus generic validators. Development end-to-end remained 1.0000; zero fabrication; candidate overproduction remains measurable. Decision: accepted as architecture, not as evidence of exhaustive precision.
- F4-003: raw query-intent cues and focus-term selection. Raw predicate accuracy 0.5000 -> 1.0000; no holdout tuning. Decision: accepted with stage/ontology limitations documented.

## Repository / paper-code / parser / MCP

- Repository fact extraction remains implemented and fixture-tested with exact path/SHA/line locators.
- Independent real repository gold annotations: NOT MEASURED.
- Automatic paper-code fact reconciliation: NOT MEASURED on V4.
- PyMuPDF active; GROBID and Docling comparison SKIPPED.
- Existing MCP and provider degradation suites pass; new real-artifact MCP CI coverage remains deferred.

## Regression and security

The final verification batch passed `npm run check`, baseline/research/PDF/provider evaluations, PostgreSQL integration, package dry-run, `npm audit --audit-level=high`, and `git diff --check`. npm audit reported 0 vulnerabilities.

## Decision

ALPHA READY. The candidate/fact boundary and metric audit are implemented, and V4 holdout task coverage is materially better than V3 while fabrication remains zero. Beta is rejected because the V4 fact gold is not exhaustive, candidate overproduction remains high, repository metrics are not independently measured, and support semantics remain coarse. The 1.0 V4 task score is not treated as proof of source-to-fact generalization.

## Remaining work

Create exhaustive-within-scope fact gold for a meaningful corpus; measure validator precision/recall on that gold; improve role/stage ontology; add independent repository gold; test unconstrained intent routing without task predicates; add parser fact-recovery comparison; complete MCP/provider/lifecycle matrices.

## Push state

Nothing pushed.
