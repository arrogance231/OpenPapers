# Adversarial reliability audit

Date: 2026-09-03
Revision at baseline: `ef40f5f2bd7776eca0a277a196c381d253af1f4c`

This document records executable evidence, confirmed defects, and verification scope. It does not treat passing fixture tests as live-provider, PostgreSQL, pgvector, or GROBID verification.

## Baseline

- Host: Windows 10, Git Bash/MSYS
- Node: v24.11.1; npm: 11.6.2
- `npm ci`: passed; 77 packages installed, 0 vulnerabilities
- `npm run lint`: passed
- `npm run architecture-check`: passed (36 tools, 32 TypeScript source files)
- `npm run build`: passed
- `npm test -- --reporter=verbose`: passed, 46 files / 144 tests, 0 skipped, 0 failed
- `npm run check`: not run as a single command before edits; its constituent commands were run individually
- PostgreSQL/pgvector: not run; no live database was started
- GROBID: not run; tests use injected fetchers/fixtures
- Live scholarly providers: not run; tests use deterministic injected fetchers
- Credentials: not required or inspected

Tests are categorized as deterministic fixture/unit tests unless explicitly described otherwise. Docker configuration tests are structural only.

## Confirmed bugs

### BUG-001 — Cross-provider head-of-line blocking

Severity: P2
Status: FIXED
Affected component: `src/reliability/reliability.ts`

Observed behavior: the limiter state (`nextAllowedAt`, queue tail) was module-global. A request to arxiv could delay an unrelated OpenAlex request, including across separately-created fetchers.

Expected behavior: politeness intervals are scoped by destination host; requests to unrelated hosts do not block one another.

Minimal reproduction: two fetchers with `minIntervalMs=100`, concurrent requests to `example.test` previously produced a 100ms delay. The original test asserted global serialization.

Root cause: shared module-level limiter state rather than host-keyed state.

Fix: limiter state is now keyed by parsed hostname within each configured fetcher. The same-host concurrency guarantee remains.

Regression test: `tests/reliability.test.ts` tests same-host serialization and unrelated-host independence.

Adversarial follow-up: malformed URLs use an `unknown` bucket; retry attempts use the same host bucket.

Remaining risk: limiter state is per fetcher instance, not a distributed cross-process quota. Providers creating multiple processes still need external coordination.

### BUG-002 — Unsafe responses were considered cacheable

Severity: P1
Status: FIXED
Affected component: `src/reliability/reliability.ts`

Observed behavior: cache eligibility excluded Authorization but still allowed Cookie-bearing requests, secret-bearing query parameters, and responses with Set-Cookie or Vary: Authorization. The former test named “isolates cached responses by request headers” used Authorization, which bypassed caching and therefore did not prove header-key isolation.

Expected behavior: unsafe credential/user-specific requests and responses are not stored or served from the response cache.

Root cause: incomplete cache policy.

Fix: cache eligibility rejects Authorization, Cookie, Proxy-Authorization, and credential-like query keys; response storage rejects private/no-store/no-cache, Set-Cookie, and identity-sensitive Vary values. Header values remain part of cache identity for safe cacheable requests.

Regression tests: `tests/reliability.test.ts` covers cookie/query-secret bypass, Set-Cookie/Vary bypass, and existing authenticated bypass behavior.

Adversarial follow-up: the durable cache path is only used after the same eligibility policy; secrets therefore do not enter durable cache keys.

Remaining risk: this is a conservative policy, not a complete RFC cache implementation. Provider-specific authorization conveyed under unusual query parameter names may require policy expansion.

### BUG-003 — Corrupt durable cache records aborted research

Severity: P2
Status: FIXED
Affected component: `src/reliability/reliability.ts`

Observed behavior: malformed durable headers caused `Headers` construction to throw before upstream fetch.

Expected behavior: cache corruption is observable through the fetch failure/event path if logging is enabled, but the request safely falls back to upstream retrieval.

Root cause: durable cache reads were trusted without an exception boundary or record validation.

Fix: durable cache reads/deletes and writes are treated as an optimization boundary; malformed/unavailable records fall through to the provider.

Regression test: corrupt durable record fixture in `tests/reliability.test.ts`.

Remaining risk: the SQLite cache class itself still exposes raw parse errors to direct callers; the configured fetch boundary safely degrades.

### BUG-004 — PostgreSQL write mirror exposed failed writes

Severity: P1
Status: FIXED
Affected component: `src/database/postgres.ts`

Observed behavior: `PostgresResearchStore.upsertWork` updated its in-memory mirror before the awaited PostgreSQL write. A rejected write could therefore be read back as if committed.

Expected behavior: a failed durable write is not visible through the local mirror.

Root cause: optimistic mirror mutation without rollback.

Fix: `upsertWork` updates the mirror only after the durable write resolves.

Regression test: `tests/postgres-hardening.test.ts` verifies failed writes are absent.

Adversarial follow-up: this test uses an injected rejected query; it is not a live PostgreSQL test.

Remaining risk: the same pre-write mirror pattern remains in several other PostgreSQL methods and should be migrated consistently in a future slice (evidence, edges, parsed documents, claims, vectors, and collections).

### BUG-005 — PostgreSQL write queue became permanently poisoned

Severity: P1
Status: FIXED
Affected component: `src/database/postgres.ts`

Observed behavior: one rejected queued write left `pending` rejected, so later writes chained from it could never execute.

Expected behavior: the originating write rejects, while later independent writes may proceed.

Root cause: `pending` retained the rejected promise.

Fix: the queue tail now catches only for queue continuity; the individual operation promise still propagates its original error.

Regression test: `tests/postgres-hardening.test.ts` verifies a later write succeeds after an earlier rejection.

### BUG-006 — Malformed Crossref success was interpreted as authoritative empty results

Severity: P1
Status: FIXED
Affected component: `src/providers/crossref.ts`

Observed behavior: HTTP 200 with `{}` returned `[]`, making malformed upstream data indistinguishable from a valid no-results response.

Expected behavior: malformed success envelopes fail as `invalid Crossref response`; only a valid `message.items` array can produce results.

Root cause: optional chaining/default-empty mapping treated missing required envelope fields as absence.

Fix: validate the Crossref response envelope and each result title before mapping.

Regression test: malformed `{}` fixture in `tests/citations.test.ts`.

Adversarial follow-up: the service's `Promise.allSettled` preserves this provider failure while allowing independent providers to succeed.

Remaining risk: equivalent schema-hardening is not yet uniformly implemented across every provider adapter.


### BUG-007 — Identifier-free works were silently merged by title/author heuristic

Severity: P0
Status: FIXED
Affected component: `src/research/service.ts`

Observed behavior: two distinct identifier-free records with the same title/authors were merged and one provider's record disappeared.

Expected behavior: metadata similarity is not identity proof; identifier-free records remain separate.

Root cause: metadata fallback was included in the primary identity index.

Fix: search identity indexing now uses only normalized DOI/arXiv identifiers. Metadata remains a comparison fallback where explicitly needed.

Regression test: same-title/same-author identifier-free fixture in `tests/adversarial/full-flow.test.ts`.

Remaining risk: malformed or noncanonical provider identifiers still require adapter-level validation.

### BUG-008 — SSRF protection missed link-local and IPv4-mapped IPv6 targets

Severity: P0
Status: FIXED
Affected component: `src/ingestion/acquisition.ts`

Observed behavior: `169.254.169.254` and `[::ffff:127.0.0.1]` reached the fetcher.

Expected behavior: private, loopback, link-local, carrier-grade, and mapped equivalents are rejected before fetching, including redirects.

Root cause: selected literal prefixes were checked without decoding mapped IPv4 addresses.

Fix: added link-local/carrier-grade checks and mapped IPv4 decoding; redirects reuse the guard.

Regression test: `tests/acquisition.test.ts`.

Remaining risk: DNS rebinding requires egress controls or DNS-aware connection validation beyond URL parsing.

### BUG-009 — Fallback parser accepted malformed element arrays

Severity: P1
Status: FIXED
Affected component: `src/ingestion/pdf.ts`

Observed behavior: fallback output with `sections:[null]` was accepted and downstream chunking crashed.

Expected behavior: subprocess output is schema-validated before entering the parsed-document contract.

Root cause: only top-level array presence was checked.

Fix: validate section/reference object fields and warning types.

Regression test: malformed section fixture in `tests/document.test.ts`.

Remaining risk: extend the lightweight validator as the parsed-document schema grows.

The production fallback is now an explicit `HashEmbeddingProvider` with identity `lexical-hash-v1` and 64 dimensions. It is deterministic lexical/hash retrieval, not semantic embedding retrieval. `PostgresVectorRetriever` accepts a provider interface, validates non-empty finite non-zero vectors and dimensions, and records provider identity/dimensions in payload metadata. Paid APIs are not required. A configurable network/local provider can implement `EmbeddingProvider` without coupling the service to a vendor.

The pgvector column remains unconstrained `vector` and live dimension enforcement was not tested against a running PostgreSQL instance. That is a remaining integration limitation.

## Structured observability

`src/reliability/logger.ts` provides opt-in JSON logging with debug/info/warn/error levels and centralized redaction for URLs, credential-like fields, and query parameters. The reliability fetcher can emit structured provider request/retry/success/failure/cache events through the logger without logging response bodies or credentials.

### BUG-010 — CLI development entrypoint exits when stdin is closed

Severity: P2
Status: DEFERRED
Affected component: `src/mcp/server.ts`

Observed behavior: a direct `tsx src/mcp/server.ts` smoke invocation exits cleanly when the harness closes stdin; the stdio transport is intentionally tied to stdin lifecycle.

Expected behavior: long-lived operation requires an open MCP client stdin stream. HTTP mode has a separate server lifecycle.

Root cause: stdio transport returns after stdin EOF, which is normal for stdio protocol processes but surprising in a shell smoke test.

Fix: deferred; no production change made because keeping a stdio server alive after client EOF would alter transport semantics.

Regression test: not added; lifecycle requires a real MCP client/process harness.

Adversarial follow-up: `npm run dev` was invoked under a closed terminal stdin and exited 0; no unhandled rejection was observed.

Remaining risk: HTTP shutdown idempotence, active-request draining, and signal races remain unverified.


### BUG-015 — Several MCP handlers let dependency exceptions escape

Severity: P1
Status: DEFERRED
Affected component: `src/mcp/tools.ts` and ecosystem tool registration.

Confirmed: direct invocation of handlers such as `search_papers` and `resolve_author` with rejecting service dependencies returns a rejected promise rather than a protocol-level `isError` result. Several other handlers already catch errors, so behavior is inconsistent.

No fix was applied in this pass; handlers need a shared safe-tool wrapper that preserves sanitized error context.



### BUG-011 — `npm run dev` silently did nothing

Severity: P1
Status: FIXED
Affected component: `src/mcp/server.ts`

Root cause: the entrypoint guard only recognized `dist/mcp/server.js`, while the dev script executes `src/mcp/server.ts`.

Fix: both source and compiled MCP entrypoint paths invoke `main()`.

### BUG-012 — Different DOI representations prevented reconciliation

Severity: P0
Status: DEFERRED
Affected component: provider mappers and `src/research/service.ts`.

Confirmed: provider adapters can emit DOI URL/prefix forms while reconciliation compares raw strings. Equivalent DOI forms can remain duplicate works.

No fix was applied in this pass; central normalization at every provider boundary needs dedicated coverage.

### BUG-013 — GROBID size limit was enforced after full response allocation

Severity: P2
Status: DEFERRED
Affected component: `src/ingestion/pdf.ts`.

Confirmed: `response.text()` reads the entire TEI response before `maxTeiBytes` is checked. The limit prevents acceptance but is not a memory bound.

### BUG-014 — Refresh can orphan collection membership after identity change

Severity: P1
Status: DEFERRED
Affected component: `src/research/service.ts`.

Confirmed: refresh can upsert a provider result under a newly derived paper ID without migrating collection references from the old ID. This requires an explicit transactional identity-migration operation.


