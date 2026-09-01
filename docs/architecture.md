# OpenPapers architecture and roadmap

## Current vertical slice

The MCP v2 `McpServer` factory registers typed tools. `serveStdio` serves local agents. `createMcpHandler` plus `toNodeHandler` provides stateless Streamable HTTP. ResearchService executes bounded provider calls, canonicalizes by normalized title/authors, merges source versions, ranks deterministically, persists metadata in SQLite FTS5, and creates citation-linked evidence.

## Phase plan

### Phase 1 — Citation policy and integrity foundation (complete)
- Adopt `OpenPapers` naming everywhere.
- Add opt-in `CITATIONS.md` workspace instruction, restricted to that file.
- Add citation-integrity data types and validator: factual output must reference existing evidence IDs, sources, authors, and claimed locators.
- Add tests for unsupported claims, missing evidence, and valid cited responses.
- No external API keys required; use deterministic fixtures.
- Acceptance: `CITATIONS.md` provides the opt-in workspace policy; citation objects preserve source metadata and locators; MCP responses are rejected when evidence is absent, unresolved, metadata-mismatched, or not cited in the human-readable summary.

### Phase 2 — Reliable retrieval infrastructure
- Add shared in-memory response caching with TTL and concurrent request deduplication, with authorization/cache-control safety.
- Add FIFO process-wide cumulative rate limiting, bounded retries for 429/5xx and transient network failures, and numeric/HTTP-date `Retry-After` handling.
- Add provider failure telemetry and expose reliability counters in research transparency.
- Acceptance: Phase 2 reliability infrastructure is complete for current external providers; durable cache backends and richer per-provider latency histograms remain future optimizations.
- Add year/author/venue/topic filtering and query transparency.

### Phase 3 — OpenAlex and ecosystem discovery
- Add OpenAlex scholarly metadata, author IDs, and topic enrichment.
- Add static GitHub adapter with evidence-graded attribution classification and commit SHAs.
- Add Hugging Face models, datasets, cards, revisions, and paper links with local scholarly reconciliation.
- Add revision-pinned repository config discovery and conservative scalar/section parameter extraction without executing repository code.
- Acceptance: Phase 3 ecosystem discovery is complete; deeper paper ingestion, citation graphs, and execution-backed reproducibility remain later phases.

### Phase 4 — Semantic Scholar and citation graph (complete)
- Add Semantic Scholar after API-key approval, with paper lookup, references, citations, related works, author resolution, and caching.
- Implemented: typed Semantic Scholar references/citations/recommendations/author endpoints, provider mapping, shared reliability integration, service graph responses, MCP graph tools, and deterministic fixture coverage.
- Implemented: graph nodes/evidence are persisted through the existing SQLite boundary, graph edges are deduplicated by source/target/relation/provider, and duplicate-work metadata disagreements are exposed as structured transparency conflicts.
- Implemented: graph nodes carrying a known DOI or arXiv identifier resolve to an existing canonical SQLite work identity before edge persistence, preventing provider-specific duplicate nodes.
- Implemented: OpenAlex references and reverse-citation edges are retrieved through `referenced_works` and `filter=cites:` and merged with Semantic Scholar candidates when an OpenAlex root identity is available; partial provider failures remain explicit.
- Implemented: graph edges persist a conservative relationship class (`FOUNDATIONAL_CANDIDATE`, `FOLLOW_UP_CANDIDATE`, `DIRECT`, or `UNKNOWN`) with a migration for existing SQLite databases; labels are candidates, not unsupported causal claims.
- Implemented: combine Semantic Scholar/OpenAlex graph data with DOI/arXiv/publication-lineage reconciliation.
- Implemented: conservative foundational/follow-up candidate labels and edge-level conflict-aware graph provenance.
- Phase 4 acceptance: live provider smoke checks succeeded with configured credentials; deterministic graph, persistence, provenance, and failure-transparency coverage is complete.

### Phase 5 — Structured paper ingestion
- Implemented first slice: `PaperAcquirer` provides bounded byte-preserving HTTP acquisition with HTTP(S)-only validation, private/local host rejection, redirect revalidation and limits, timeout cancellation, declared-size checks, and streamed body limits.
- Implemented second slice: format detection recognizes HTML/PDF/unknown content; dependency-free HTML parsing extracts the document title, heading-based sections, normalized paragraph text, and reference links. PDF and unknown binary inputs fail explicitly until a dedicated PDF parser is added.
- Implemented third slice: `GrobidClient` posts bounded PDF bytes to GROBID’s `/api/processFulltextDocument` endpoint and parses returned TEI; `PdfParserChain` optionally falls back to configured PyMuPDF and Docling command adapters while preserving warnings and parser provenance.
- Implemented fourth slice: the TEI parser tracks page-break number/ID metadata, nested division depth, page-aware sections, and page-aware search chunks.
- Implemented fifth slice: GROBID TEI extraction preserves equations, figure captions, table captions/content, and appendix sections in typed fields.
- Implemented sixth slice: bibliography records preserve source identifiers and normalized metadata; figure/table records inherit page locators from the nearest preceding TEI page break.
- Implemented seventh slice: tables preserve row/cell structure and body `<ref>` elements become explicit citation links to bibliography IDs with section/page provenance.
- Implemented: bounded PDF/HTML acquisition with SSRF, size, timeout, redirect, and path protections; decompression and archive protections remain parser-hardening work.
- Parse page boundaries, section hierarchy, paragraphs, equations, tables, figure captions, appendices, and references (GROBID-backed fields implemented; deeper layout fidelity remains dependent on TEI content).
- Implemented: bounded `read_paper` MCP acquisition/parsing and `search_within_paper`; matches carry stable URL, section heading/level, page number/ID when supplied by GROBID, chunk ordinal, and chunk ID provenance.

### Phase 6 — Evidence-backed extraction
- Refine Phase 4 graph relationship candidates using explicit provider lineage metadata where available and add live end-to-end MCP graph verification.
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
