# Evidence completeness execution plan

Audit baseline: `c05d38c` (clean worktree at session start).

## Phase inventory

| Area | State at audit | Execution order |
| --- | --- | --- |
| Canonical identity | COMPLETE; guarded by 119-case evaluation | Regression only |
| Retrieval ranking | COMPLETE/guarded; 44-query set is development evidence | Holdout before any tuning |
| Training extraction | IMPLEMENTED BUT UNMEASURED beyond curated fixture scope | Preserve current metric caveat |
| Citation support classifier | PARTIAL; deterministic heuristic and focused tests exist | Integrate into main runner |
| Citation detection metrics | PARTIAL; adversarial fixture prevalence is currently reported as rates | Separate detection performance from incidence |
| Paper/code gold dataset | MISSING | Phase 1 first |
| Paper/code runner/diagnostics | PARTIAL framework; no official dataset or main-runner result | Phases 2–4 |
| End-to-end research tasks | MISSING | Phases 5–7 |
| PDF benchmark | MISSING; parser paths exist | Phases 11–13 |
| Provider degradation | MISSING; malformed-success tests exist | Phases 14–15 |
| PostgreSQL migration matrix | PARTIAL; v2 and integration harness exist | Phase 16 |
| FK policy | MISSING as explicit documented policy | Phase 17 |
| Exact vector compatibility | IMPLEMENTED BUT DOCUMENTATION/coverage audit needed | Phase 18 |
| MCP transport | PARTIAL; representative tests exist | Phase 19 |
| HTTP lifecycle | PARTIAL; idempotent cleanup exists | Phase 20 |
| Citation export | MISSING | Phase 21 |
| OpenReview | MISSING and intentionally deferred | Phase 23 |

## Ordered slices

1. Add a manually verified, revision-pinned paper/code gold dataset with source classes, locators, temporal notes, and annotation rules.
2. Add executable paper/code dataset loading, comparison, metrics, and machine-readable diagnostics to `eval:baseline`.
3. Add false-agreement and semantic-batch-size regression coverage, then document measured results and limitations.
4. Add an independently annotated structured end-to-end research-task dataset and evaluator.
5. Wire support-classification metrics and citation detection-vs-incidence schemas into the main result.
6. Establish PDF and provider-degradation datasets/evaluators without claiming unrun live coverage.
7. Harden PostgreSQL migration/FK/vector compatibility evidence and broaden MCP/HTTP boundary tests.
8. Add citation export only after support and locator evidence is integrated; keep OpenReview last.

## Evidence rules

Gold labels are source annotations, not outputs optimized for system metrics. Every repository case records the resolved commit SHA, inspected paths, paper and code locators, source classes, and any temporal-alignment limitation. `UNKNOWN` remains distinct from missing or conflict. The current support classifier is measured as a deterministic text/negation heuristic, never as semantic entailment.
