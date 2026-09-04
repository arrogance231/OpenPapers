# Query-independent evidence architecture plan

## Audit

| Area | Current behavior | Coupling classification | V3 direction |
| --- | --- | --- | --- |
| Paper proposition extraction | `extractResearchPropositions(document, query)` first routes the query, then scans only the selected rule family | ARCHITECTURAL DEBT / PAPER-TASK-SPECIFIC | Extract all safe facts in one source pass without a query |
| Query routing | `fieldFor(query)` decides which proposition family is allowed to exist | ARCHITECTURAL DEBT | Map questions to predicates only after fact extraction |
| Proposition aliases | Rules contain bounded aliases, but are evaluated only after query routing | CONVENIENCE ONLY when moved to source pass | Keep reversible canonicalization in fact extraction |
| Answer assembly | Selects facts/parameters by requested field, but receives query-routed propositions | PARTIAL | Select already extracted facts using a separate intent object |
| PDF parsing | Produces page sections and locators independent of query | COMPLETE | Preserve as source boundary |
| Repository parsing | Produces pinned evidence from bounded files; extraction remains field-pattern based | PARTIAL | Emit repository facts before query selection |
| Source normalization | Some normalization occurs in proposition extraction | ARCHITECTURAL DEBT | Normalize all source text/facts before intent handling |
| ResearchService | Exposes paper parsing/extraction and pinned repository reads; no persisted generic fact set | PARTIAL | Add a generic source-to-facts seam without changing identity/retrieval |
| ResearchPack | Persists works/evidence, not typed research facts | UNMEASURED | Defer persistence unless fact cache needs it |
| Claims/comparator | Separate evidence-backed claim and paper/code paths exist | PARTIAL | Reuse evidence records and add fact-level comparison |
| MCP `reconstruct_research` | Reads paper and invokes extraction during each question | ARCHITECTURAL DEBT | Extract facts first, then query facts through intent |
| Evaluator | Uses query and expected keys to select supported answer output | PARTIAL / BENCHMARK COUPLING | Keep expected keys as evaluation schema, never as extraction control |

## V3 contract

`extractResearchFacts(document)` receives only parsed source and source metadata. It emits typed facts with predicate, canonical value, raw value/evidence, locator, source class, scope, stage, and extraction method. It does not receive a research question.

`interpretResearchQuery(question, fields)` maps a question to bounded predicate intent. It does not inspect source text.

`assembleResearchAnswer(intent, facts)` filters/reconciles facts and emits UNKNOWN when no usable fact exists. It does not rediscover values from raw source text.

## Safety requirements

- No paper title, arXiv ID, task ID, or holdout identifier appears in production extraction logic.
- Every concrete fact retains source evidence and a locator.
- Related-work/citation mentions are not accepted as current-paper method facts without method-context evidence.
- Provider/parser failure remains UNKNOWN, not NOT_REPORTED.
- V1/V2 result artifacts remain immutable.

## Implementation order

1. Add generic typed `ResearchFact` and bounded predicate/value contracts.
2. Convert existing proposition rules to a query-independent source pass.
3. Add separate query-intent interpretation and fact selection.
4. Route the real evaluator and MCP reconstruction through those seams.
5. Add fact-level and query-routing tests, including negative scope cases.
6. Add a new V3 development corpus and leave-one-paper-out/paraphrase measurements.
7. Freeze V3 development before acquiring the new V3 holdout.
