# Generalization V2 final report

## V1 historical evidence

V1 development: answer correctness 0.8462, false UNKNOWN 0.2308, fabricated-answer rate 0.0000.

V1 holdout: answer correctness 0.5000, false UNKNOWN 0.6667, fabricated-answer rate 0.0000. This result remains closed and was not rerun or tuned against.

## V2 corpus

V2 contains 20 new arXiv papers with no overlap against V1: 15 development cases and 5 holdout cases. It covers denoising, contrastive learning, sparse experts, multimodal bridging, preference optimization, mathematical reasoning, attention topology, retrieval, reasoning traces, and sequence operators.

V2 development artifacts: 15/15 acquired. V2 holdout artifacts: 5/5 acquired. Holdout was frozen before capability tuning and evaluated once.

## V2 baseline and experiments

Baseline at `f6e8996`: work accuracy 1.0000, identifier accuracy 1.0000, answer correctness 0.0000, support-status accuracy 0.0667, false UNKNOWN 0.9333, fabricated-answer rate 0.0000.

One development metadata correction was made after baseline QA: arXiv `2011.00677` was not SimCSE and was corrected to `2104.08821`; the unrelated repository link was removed. This was a development-corpus provenance correction, not a holdout change.

G2-001 added bounded concept routing. Answer correctness: 0.4000; false UNKNOWN: 0.4667; fabrication: 0.0000.

G2-002 added deterministic PDF Unicode/dash/line-break normalization. Answer correctness: 0.4667; false UNKNOWN: 0.4000; fabrication: 0.0000.

G2-003 fixed general query precedence and bounded terminology aliases. Answer correctness: 0.6667; false UNKNOWN: 0.3333; fabrication: 0.0000.

G2-004 refined algorithm/operator/pretraining-signal routing. Final V2 development: answer correctness 1.0000; support-status accuracy 1.0000; false UNKNOWN 0.0000; false NOT_REPORTED 0.0000; fabricated-answer rate 0.0000; work and identifier accuracy 1.0000.

## V2 holdout

One-shot result at frozen commit `9d53e05`:

- tasks: 5
- work accuracy: 1.0000
- identifier accuracy: 1.0000
- answer correctness: 0.0000
- evidence-source accuracy: 1.0000
- locator accuracy: 0.8000
- support-status accuracy: 0.2000
- false UNKNOWN: 0.8000
- false NOT_REPORTED: 0.0000
- fabricated-answer rate: 0.0000
- V2 HOLDOUT USED FOR TUNING = NO

The V2 development-to-holdout gap is therefore 1.0000 to 0.0000. This is a failed generalization result, not evidence for beta readiness. No post-holdout tuning was performed.

## Repository evidence

The frozen V2 development output contains six repository-linked cases with 100% bounded retrieval success, 75 manifest records, and 214 evidence records. The V2 holdout contains one repository-linked case with 100% bounded retrieval success, seven manifest records, and 58 evidence records.

Candidate-file recall, selected-file precision, exact line-locator accuracy, source-class accuracy, and parameter extraction accuracy are NOT_MEASURED because the V2 corpus does not annotate expected file paths or line spans. Commit consistency is reported separately and is not official-link correctness.

## MCP

Real cached PDF MCP reconstruction: PASS, supported `text infilling` answer with evidence.

Real cached PDF plus pinned repository MCP reconstruction: PASS, supported ORPO answer; exact pinned commit preserved; 30 files read, 101 repository evidence records, 30 manifests, zero repository failures.

Real cached PDF UNKNOWN scenario: PASS, empty answer, UNKNOWN status, no evidence fabrication.

## Other verification

- Full tests: 56 files, 194 tests passed.
- PostgreSQL integration: PASS, including rollback, identity migration, reconnect, and vector search.
- Synthetic baseline, research, PDF, and provider evaluations: PASS.
- Retrieval holdout historical checkpoint remains Recall@1/5/10 1.0000 and MRR 1.0000; no tuning followed.
- npm audit: 0 vulnerabilities.
- Package dry-run: PASS.
- V2 GROBID/Docling comparison: not performed.

Release decision: ALPHA READY. V2 demonstrates strong in-domain development coverage and zero fabrication, but the new holdout demonstrates severe generalization failure. The original V1 holdout remains unchanged historical evidence. Beta is rejected until a genuinely improved generalization design is developed and evaluated on a future untouched holdout.
