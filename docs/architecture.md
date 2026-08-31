# OpenPapers architecture and roadmap

## Current vertical slice

The MCP v2 `McpServer` factory registers typed tools. `serveStdio` serves local agents. `createMcpHandler` plus `toNodeHandler` provides stateless Streamable HTTP. ResearchService executes bounded provider calls, canonicalizes by normalized title/authors, merges source versions, ranks deterministically, persists metadata in SQLite FTS5, and creates citation-linked evidence.

## Phase plan

### Phase 1 — Citation policy and integrity foundation (start now)
- Adopt `OpenPapers` naming everywhere.
- Add opt-in `CITATIONS.md` workspace instruction, restricted to that file.
- Add citation-integrity data types and validator: factual output must reference existing evidence IDs, sources, authors, and claimed locators.
- Add tests for unsupported claims, missing evidence, and valid cited responses.
- No external API keys required; use deterministic fixtures.

### Phase 2 — Reliable retrieval infrastructure
- Add shared in-memory response caching with TTL and concurrent request deduplication.
- Add process-wide cumulative rate limiting, bounded retries for 429/5xx responses, and `Retry-After` handling.
- Add provider failure telemetry and expose reliability counters in research transparency.
- Acceptance: Phase 2 reliability infrastructure is complete for current external providers; durable cache backends and richer per-provider latency histograms remain future optimizations.
- Add year/author/venue/topic filtering and query transparency.

### Phase 3 — OpenAlex and ecosystem discovery
- Add OpenAlex scholarly metadata, author IDs, and topic enrichment.
- Add static GitHub adapter with evidence-graded attribution classification and commit SHAs.
- Add Hugging Face models, datasets, cards, revisions, and paper links with local scholarly reconciliation.
- Add revision-pinned repository config discovery and conservative scalar/section parameter extraction without executing repository code.
- Acceptance: Phase 3 ecosystem discovery is complete; deeper paper ingestion, citation graphs, and execution-backed reproducibility remain later phases.

### Phase 4 — Semantic Scholar and citation graph
- Add Semantic Scholar after API-key approval, with paper lookup, references, citations, related works, author resolution, and caching.
- Combine Semantic Scholar/OpenAlex graph data with DOI/arXiv/publication-lineage reconciliation.
- Add foundational/follow-up relationships and conflict-aware graph provenance.

### Phase 5 — Structured paper ingestion
- Add bounded PDF/HTML acquisition with SSRF, size, timeout, decompression, and path protections.
- Parse page boundaries, section hierarchy, paragraphs, equations, tables, figure captions, appendices, and references.
- Add `read_paper` and `search_within_paper` with chunk-level provenance.

### Phase 6 — Evidence-backed extraction
- Add deterministic heuristic extraction for methodology, losses, equations, datasets, training stages, hyperparameters, benchmarks, and limitations.
- Add claim/evidence persistence and conflict detection.
- Add optional provider-independent LLM extractor interface.

### Phase 7 — Research tools
- Add `get_references`, `get_citations`, `get_related_papers`, `research_method`, `find_implementations`, `get_repository_config`, `find_datasets`, and `find_models`.
- Add `compare_papers`, `compare_methods`, `verify_claim`, and benchmark comparability flags.

### Phase 8 — Reproducibility and reports
- Complete training-recipe extraction and paper-vs-code conflict reporting.
- Add `build_research_report`, reproducibility mode, implementation mode, paper timelines, and recommendation/fact separation.
- Add citation-integrity enforcement to every generated response.

### Phase 9 — Library and release engineering
- Add local library, collections, ResearchPacks, refresh/remove tools, migrations, Postgres adapter, vector-retrieval interface, Docker hardening, and release documentation.
- Add real-paper integration fixtures and end-to-end Qwen/tool-calling workflow tests.

### Phase 10 — Maintainability, modularity, and contributor audit
- Review every current subsystem: domain models, provider adapters, rate limiting, caching boundaries, persistence, research orchestration, citation validation, MCP transports, and tool modules.
- Identify oversized modules, duplicated policy, hidden coupling, unclear public contracts, and provider-specific behavior leaking into shared layers.
- Define and document stable extension interfaces for providers, fetchers, storage backends, extractors, ranking strategies, provenance validators, and MCP tool modules.
- Split or refactor modules where doing so improves independent testing, contributor ownership, failure isolation, or future replacement; avoid abstraction without a concrete seam.
- Add contract tests and fixture conventions for provider and tool-module contributors.
- Add dependency-direction checks so transports depend on application services, application services depend on domain contracts, and providers do not depend on MCP handlers.
- Audit public MCP tool schemas for naming consistency, bounded inputs, backward compatibility, structured errors, and provenance completeness.
- Improve contributor ergonomics: subsystem map, examples, local live-test instructions, debugging guidance, issue templates, and focused contribution tasks.
- Review CI for deterministic tests, optional credential-free integration tests, lint/build/test gates, and security checks.
- Produce a maintainability report with prioritized follow-up issues and a documented decision log for intentional non-modular areas.
- Acceptance criterion: a new provider and a new MCP tool can be added with isolated files, fixtures, and registration changes, without editing unrelated subsystems or transport code.
## Phase 1 implementation scope

Phase 1 deliberately does not require external provider credentials. It will establish the invariant that makes later retrieval and extraction safe: no material research assertion leaves the service without resolvable evidence. `CITATIONS.md` is a workspace convention for downstream coding agents; the server’s machine-enforced equivalent is the citation-integrity validator.
