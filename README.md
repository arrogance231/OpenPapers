# OpenPapers

A provenance-first Model Context Protocol server for turning ML literature into reproducible engineering evidence. It is not an arXiv-only search wrapper: every result contains structured paper metadata, evidence IDs, author attribution, source quality, locators, and retrieval transparency.

## Status

Phase 1–3 vertical slice: current MCP v2 SDK (spec `2026-07-28`), stdio + stateless Streamable HTTP, SQLite/FTS5 persistence, arXiv/Crossref/OpenAlex/Semantic Scholar metadata adapters, GitHub and Hugging Face discovery, canonicalization, citation-safe search, paper lookup, BibTeX, and refusal-safe training recipe output. Phase 1 citation integrity is complete: opt-in `CITATIONS.md`, evidence/source metadata validation, matching human-readable citations, and evidence-backed paper lookup/BibTeX responses. Phase 2 reliability infrastructure is complete for current external providers: shared TTL response caching, concurrent request deduplication, cumulative rate limiting, bounded 429/5xx retries with `Retry-After`, filter-aware transparent search, and reliability counters with latency/failure telemetry. Phase 3 ecosystem discovery is complete: OpenAlex author/topic enrichment, Hugging Face card paper-link reconciliation, revision-pinned repository inspection, structured scalar/section config extraction, evidence-graded GitHub linkage, and conservative attribution classification are implemented. Full-text extraction, citation graphs, library/collections, and report synthesis remain later phases.

## Run

Requirements: Node.js 24+ (uses stable-enough built-in `node:sqlite`; Node 20+ SDK support otherwise).

```sh
npm install
npm run build
npm start                         # stdio
MCP_TRANSPORT=http npm start      # HTTP on 127.0.0.1:8787/mcp
npm test
```

Use `MCP_TRANSPORT=http HTTP_HOST=0.0.0.0 HTTP_PORT=8787` behind an authenticated HTTPS reverse proxy. The local HTTP handler validates Host and Origin to reduce DNS-rebinding risk. Do not expose it directly to the public internet without authentication and TLS.

## MCP tools

- `search_papers({query, limit})`: parallel arXiv, Crossref, OpenAlex, and best-effort Semantic Scholar retrieval with expansion, canonical deduplication, ranking rationale, provider failure transparency, and evidence.
- `get_references({paper_id, limit})`, `get_citations({paper_id, limit})`, and `get_related_papers({paper_id, limit})`: Semantic Scholar graph retrieval with relation labels, source provenance, and evidence-backed works.
- `resolve_author({author_id})`: Semantic Scholar author resolution with aliases and linked paper IDs.
- Graph retrieval persists discovered works, evidence, and normalized edges in the configured SQLite database; duplicate metadata conflicts remain visible in response transparency rather than being silently discarded.
- Known DOI and arXiv identifiers are used to reconcile graph nodes with existing canonical works before edges are stored.
- When a root has an OpenAlex identity, graph tools merge OpenAlex reference/citation edges with Semantic Scholar results and retain per-provider edge provenance; unavailable providers are reported transparently.
- Graph edges expose conservative relationship classes: `FOUNDATIONAL_CANDIDATE` for earlier referenced works, `FOLLOW_UP_CANDIDATE` for later citing works, `DIRECT` for chronology-supported same-direction edges, and `UNKNOWN` when chronology or direction is insufficient.
- Cross-provider DOI/arXiv node merges retain metadata disagreements in graph transparency conflicts instead of silently selecting one provider’s title or year.
- `find_implementations({method, paper_id, limit})`: static GitHub repository discovery from a method or verified local paper; paper-linked searches include README/author-overlap assessments, conservative attribution classification including organization-owner claims, formal evidence records, commit/blob and line locators when available, while unsupported official claims remain `UNKNOWN`.
- `find_models({query, limit})`: Hugging Face model discovery with revisions, card metadata, normalized arXiv/DOI links, and separate local reconciliation status.
- `find_datasets({query, limit})`: Hugging Face dataset discovery with revisions, card metadata, normalized arXiv/DOI links, and separate local reconciliation status.
- `find_repository_configs({owner, repo, ref})`: discover common root-level training/config files and resolve an optional ref to a commit SHA without recursive crawling.
- `get_repository_config({owner, repo, path, ref})`: static, line-numbered GitHub file inspection with blob provenance; never executes content.
- `get_paper({paper_id})`: canonical metadata by paper ID, DOI, or arXiv ID.
- `extract_training_recipe({paper_id})`: typed reproducibility fields; unknowns are `NOT_REPORTED`, never guessed.
- `get_bibtex({paper_id})`: generated canonical BibTeX from known fields only.
- `research_topic({topic, objective, depth, limit})`: cited retrieval dossier scaffold with explicit synthesis labeling.

Example agent flow: search → get paper → extract recipe → verify claims before implementation. The tool response has both `content` text and `structuredContent`.

## Provenance contract

A material claim must carry an evidence record with source ID, complete authors, title, identifiers, source quality (`A` original paper through `E` secondary explanation), evidence type (`DIRECT`, `CODE_VERIFIED`, `DERIVED`, `CONFLICTING`, etc.), and a locator where available. Missing configuration is represented by `{ "value": null, "status": "NOT_REPORTED" }`.

Remote paper, README, model-card, and repository content is untrusted data. The server does not execute repository code.

## Architecture

`MCP tools → tool modules → ResearchService/providers → canonicalization/ranking → SQLite FTS5 → citation objects`

Provider adapters are dependency-injected and can be replaced with Semantic Scholar, OpenAlex, Hugging Face, and GitHub implementations without changing MCP handlers. SQLite is deliberately behind `ResearchDb`; PostgreSQL/vector retrieval can be added behind the same service boundary.

## Configuration

Copy `.env.example` to `.env`. Optional API keys are never logged or committed. Semantic Scholar graph calls work through the injected provider boundary and remain subject to shared reliability controls; anonymous usage is rate-limited and an API key may be configured for approved higher-volume access. The current service does not execute third-party code.

## Development

```sh
npm run lint
npm run build
npm test
```

See `SECURITY.md`, `CONTRIBUTING.md`, and `docs/architecture.md`.
