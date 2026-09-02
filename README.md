# OpenPapers

OpenPapers is a provenance-first Model Context Protocol (MCP) server for scholarly retrieval, paper ingestion, and reproducibility-oriented research workflows.

## Overview

The project aggregates scholarly metadata and developer resources through replaceable provider adapters. It normalizes paper identities, preserves upstream identifiers and URLs, records evidence and uncertainty, and exposes bounded operations over MCP. Retrieved content is treated as untrusted data; repository code and downloaded documents are not executed.

## Features

- Multi-provider paper search across arXiv, Crossref, OpenAlex, and Semantic Scholar.
- DOI, arXiv, OpenAlex, and Semantic Scholar identity preservation and cross-provider reconciliation.
- Citation/reference graph discovery with provider lineage and conservative relationship labels.
- Bounded HTML and PDF acquisition, GROBID-backed parsing, and optional PyMuPDF/Docling fallbacks.
- Evidence-backed heuristic facts, claims, conflicts, training parameters, and reproducibility reports.
- Static GitHub repository discovery and revision-pinned configuration inspection.
- Hugging Face model and dataset discovery with paper-link reconciliation.
- SQLite/FTS5 storage, optional PostgreSQL/pgvector storage, collections, ResearchPacks, and vector retrieval.
- MCP stdio and stateless Streamable HTTP transports.

## Supported sources

| Source | Role | Authentication |
|---|---|---|
| [arXiv](https://arxiv.org/) | Preprint search and metadata | Not required |
| [Crossref](https://www.crossref.org/) | DOI and bibliographic metadata | Not required |
| [OpenAlex](https://openalex.org/) | Open scholarly metadata and citation relationships | Not required |
| [Semantic Scholar](https://www.semanticscholar.org/) | Paper metadata, authors, references, citations, and recommendations | Optional API key |
| [GitHub](https://github.com/) | Repository discovery, revisions, contents, and implementation evidence | Optional token; anonymous access is rate-limited |
| [Hugging Face](https://huggingface.co/) | Model and dataset discovery, cards, revisions, and paper links | Optional token |

Provider selection depends on the requested identifier, query, and available metadata. Results may be cross-referenced across providers; no provider is authoritative for every field.

## Architecture

```text
MCP transport -> tool modules -> ResearchService -> provider adapters
                                      |                 |
                                      v                 v
                              storage/retrieval     external APIs
```

See [docs/architecture.md](docs/architecture.md), [docs/providers.md](docs/providers.md), and [docs/extending.md](docs/extending.md).

## Installation

Requirements: Node.js 22.5 or newer. Node.js 24 is used by the container image.

```sh
npm ci
npm run build
```

For the Docker deployment, install Docker Desktop or another Docker Engine with Compose support and run:

```sh
docker compose up --build --wait
```

The Compose profile starts OpenPapers, PostgreSQL with pgvector, and GROBID. See [docs/installation.md](docs/installation.md) for SQLite, PostgreSQL, and GROBID options.

## Configuration

Copy the example file before configuring optional integrations:

```sh
cp .env.example .env
```

The local default uses SQLite at `./data/research.sqlite`. Important variables are documented in [docs/configuration.md](docs/configuration.md). `.env` is ignored by Git and must never contain committed credentials.

## Quick start

Start the stdio server after building:

```sh
npm start
```

To start the HTTP transport locally:

```sh
MCP_TRANSPORT=http npm start
```

The endpoint is `http://127.0.0.1:8787/mcp`. Keep it on loopback unless a trusted reverse proxy provides authentication and TLS.

## MCP interface

The server currently registers 36 MCP tools, including:

- Retrieval: `search_papers`, `get_paper`, `get_bibtex`, `research_method`, `research_topic`.
- Graphs: `get_references`, `get_citations`, `get_related_papers`, `resolve_author`.
- Documents: `read_paper`, `search_within_paper`, `extract_paper_facts`, `extract_paper_claims`, `extract_training_parameters`.
- Reproducibility: `extract_training_recipe`, `extract_training_recipe_from_url`, `build_research_report`, `compare_paper_to_code`.
- Ecosystem: `find_implementations`, `find_models`, `find_datasets`, `find_repository_configs`, `get_repository_config`.
- Library: collections, ResearchPacks, refresh operations, and `vector_search`.

Tool schemas are bounded with Zod. Responses expose both human-readable content and structured data where applicable. See [docs/usage.md](docs/usage.md) for representative calls.

## Data sources, provenance, and citations

Material claims carry evidence records containing source IDs, authors, titles, persistent identifiers, source quality, evidence type, and locators when available. Provider failures, conflicts, unavailable values, and heuristic derivations remain explicit. Generated summaries are not original academic sources and should be checked against the cited records.

The repository license applies to this project's source code only. Papers, abstracts, metadata, API responses, datasets, model weights, model cards, and GitHub repositories remain subject to their respective licenses and service terms. See [ACKNOWLEDGEMENTS.md](ACKNOWLEDGEMENTS.md) and [docs/limitations.md](docs/limitations.md).

## Development and testing

```sh
npm ci
npm run lint
npm run architecture-check
npm run build
npm test
npm run check
```

Contributors should read [CONTRIBUTING.md](CONTRIBUTING.md). Live provider, Docker, and model workflow checks are separate from credential-free tests; [docs/reproducibility.md](docs/reproducibility.md) describes the distinction.

## Limitations

- Anonymous provider access can be rate-limited or unavailable.
- Title-only searches can miss or mis-rank a canonical record; identifier follow-up is the reliable fallback when a DOI or provider-native identifier is known.
- PDF layout fidelity depends on the TEI returned by GROBID. PDF fallbacks are opt-in.
- Heuristic extraction does not establish independently verified facts.
- PostgreSQL/pgvector and GROBID require external services.

See [docs/limitations.md](docs/limitations.md) for details and the deferred retrieval-ranking roadmap.

## License

OpenPapers is licensed under the [Apache License, Version 2.0](LICENSE.md).
The license applies to this project's source code only. Papers, abstracts,
metadata, API responses, datasets, model weights, model cards, and GitHub
repositories remain subject to their respective licenses and service terms.

## Acknowledgements

OpenPapers builds on scholarly infrastructure from Semantic Scholar, OpenAlex, arXiv, and Crossref, and developer ecosystem infrastructure from GitHub and Hugging Face. It also uses the Model Context Protocol SDK, PostgreSQL/pgvector, GROBID, Node.js, TypeScript, Zod, and Vitest. These projects and services remain the property of their respective maintainers. See [ACKNOWLEDGEMENTS.md](ACKNOWLEDGEMENTS.md) for official links.

## Citing this project

A citation record will be added when the project has a stable public authorship and release identity. Do not cite generated research responses as if they were original sources; cite the underlying papers and datasets referenced by the response.
