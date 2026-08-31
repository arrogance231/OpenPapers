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
- Add provider cache tables for metadata, search results, and graph responses.
- Add per-provider rate limiting, Retry-After handling, exponential backoff, request deduplication, and structured observability.
- Add year/author/venue/topic filtering and query transparency.

### Phase 3 — Scholarly metadata and citation graph
- Add Semantic Scholar and OpenAlex adapters.
- Add DOI/arXiv/publication-lineage reconciliation and version-aware metadata merging.
- Add references, citations, related works, foundational/follow-up relationships, and author resolution.

### Phase 4 — Structured paper ingestion
- Add bounded PDF/HTML acquisition with SSRF, size, timeout, decompression, and path protections.
- Parse page boundaries, section hierarchy, paragraphs, equations, tables, figure captions, appendices, and references.
- Add `read_paper` and `search_within_paper` with chunk-level provenance.

### Phase 5 — Evidence-backed extraction
- Add deterministic heuristic extraction for methodology, losses, equations, datasets, training stages, hyperparameters, benchmarks, and limitations.
- Add claim/evidence persistence and conflict detection.
- Add optional provider-independent LLM extractor interface.

### Phase 6 — Code and model ecosystem discovery
- Add static GitHub adapter with official/community implementation classification and commit SHAs.
- Add Hugging Face models, datasets, cards, configs, revisions, and paper links.
- Add revision-pinned repository config extraction without executing repository code.

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

## Phase 1 implementation scope

Phase 1 deliberately does not require external provider credentials. It will establish the invariant that makes later retrieval and extraction safe: no material research assertion leaves the service without resolvable evidence. `CITATIONS.md` is a workspace convention for downstream coding agents; the server’s machine-enforced equivalent is the citation-integrity validator.
