# OpenPapers maintainability report

Date: 2026-09-02

## Scope reviewed

The audit covered domain models, provider adapters, reliability, acquisition and parsing, persistence, research orchestration, citation validation, vector retrieval, MCP transport, tool modules, tests, Docker Compose, and CI.

## Dependency direction

The enforced direction is:

```text
MCP transport/tool modules -> ResearchService -> domain/repository contracts
providers -> domain/provider contracts
ResearchDb/PostgresResearchStore -> repository contracts
```

`npm run architecture-check` verifies that providers and persistence do not import MCP code, MCP modules do not import provider implementations directly, and the registered MCP tool inventory has no duplicates or omissions.

## Stable seams

- `AsyncResearchStore`: awaited persistence and query boundary.
- `VectorRetriever` and `SqlVectorStore`: injectable vector indexing/search boundaries.
- `PaperExtractor<T>`: provider-independent extraction boundary.
- `PdfParser`, `PdfFallback`, and injected command runners: bounded document parsing boundaries.
- Injected fetchers, clocks, sleepers, database adapters, and provider implementations: deterministic test seams.
- `register<Name>Tools(server, dependencies?)`: isolated MCP module registration seam.

## Findings and decisions

- Persistence is now consistently asynchronous. SQLite may perform synchronous internal work, but no synchronous persistence API crosses the service boundary.
- PostgreSQL writes are serialized and awaited. Transactional graph, claim, collection, and ResearchPack writes remain explicit adapter capabilities.
- Provider-specific payloads remain inside provider adapters and are mapped to domain models before service use.
- Remote repository and paper content remains untrusted and is never executed.
- Public research responses keep facts, recommendations, evidence, failures, and uncertainty separate.
- Compact legacy modules remain larger than ideal (`ResearchService` and MCP registration files), but their external seams are covered by focused tests and the registration inventory check. Splitting them further is an ownership/readability optimization, not an unresolved correctness boundary.

## Verification

The repository now provides these local gates:

```sh
npm run lint
npm run architecture-check
npm run build
npm test
npm run check
```

CI runs lint, architecture checks, build, and the complete test suite. Docker release verification is recorded separately in `RELEASE_CHECKLIST.md` because it depends on the local container runtime.

## Contributor acceptance test

A new provider should add one provider module, pure mapper fixtures, failure fixtures, and service wiring. A new MCP tool should add or extend one tool module, its bounded schema/handler tests, and the registration inventory. Neither should require transport changes or imports from the reverse dependency layer.

## Optimization status

Implemented:

1. `SqliteResponseCache` provides an optional durable cache for safe, unauthenticated GET responses. Configure `RESEARCH_CACHE_PATH` and optionally `RESEARCH_CACHE_TTL_MS`; provider fetchers use it automatically.
2. Reliability telemetry records per-provider latency counts, min/max values, and bounded latency buckets while preserving aggregate counters.
3. Provider fetcher construction is centralized in `src/reliability/provider-fetcher.ts`, keeping cache and reliability policy out of provider adapters.

Still non-blocking:

1. Split the largest orchestration/registration modules when contributor ownership requires it.
2. Add deeper GROBID layout fidelity where TEI input is insufficient.
3. Add optional live provider and model/tool-calling workflows outside credential-free CI.
4. Improve exact-title retrieval/ranking and provider-native identifier fallback. The live adversarial smoke found that `Attention Is All You Need` was not present in one title-search result set, although a follow-up search for `1706.03762` resolved the canonical 2017 arXiv record. This is a retrieval-ranking limitation, not a provenance-integrity failure; the identifier fallback and provider failure transparency should remain mandatory acceptance criteria.
