# OpenPapers

A provenance-first Model Context Protocol server for turning ML literature into reproducible engineering evidence. It is not an arXiv-only search wrapper: every result contains structured paper metadata, evidence IDs, author attribution, source quality, locators, and retrieval transparency.

## Status

Phase 1–3 vertical slice: current MCP v2 SDK (spec `2026-07-28`), stdio + stateless Streamable HTTP, SQLite/FTS5 persistence, arXiv/Crossref/OpenAlex/Semantic Scholar metadata adapters, GitHub and Hugging Face discovery, canonicalization, citation-safe search, paper lookup, BibTeX, and refusal-safe training recipe output. Full-text extraction, citation graphs, verified paper-to-repository linkage, config extraction, library/collections, and report synthesis remain later phases—not silently simulated.

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
- `find_implementations({method, paper_id, limit})`: static GitHub repository discovery from a method or verified local paper; official status remains `UNKNOWN` until linkage is verified.
- `find_models({query, limit})`: Hugging Face model discovery with revisions and metadata.
- `find_datasets({query, limit})`: Hugging Face dataset discovery with revisions and metadata.
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

Copy `.env.example` to `.env`. Optional API keys are never logged or committed. Metadata cache directories and provider-specific rate limiting are planned for the next phase; the current service uses parallel bounded requests and does not execute third-party code.

## Development

```sh
npm run lint
npm run build
npm test
```

See `SECURITY.md`, `CONTRIBUTING.md`, and `docs/architecture.md`.
