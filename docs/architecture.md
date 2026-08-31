# Architecture and roadmap

## Current vertical slice

The MCP v2 `McpServer` factory registers typed tools. `serveStdio` serves local agents. `createMcpHandler` plus `toNodeHandler` provides stateless Streamable HTTP. ResearchService executes bounded provider calls, canonicalizes by normalized title/authors, merges source versions, ranks deterministically, persists metadata in SQLite FTS5, and creates citation-linked evidence.

## Data model

The model layer already defines ResearchWork, PaperVersion, Author, Evidence, Locator, TrainingRecipe, and ResearchResponse. The remaining entities (Method, Model, Dataset, Benchmark, Experiment, Implementation, Relationship, ResearchPack) should be added without weakening the evidence contract.

## Roadmap

1. Add Crossref/arXiv cache tables and per-provider rate limit/backoff.
2. Add Semantic Scholar/OpenAlex citation graph adapters.
3. Add bounded PDF/HTML ingestion with page/section chunk records.
4. Add evidence-backed heuristic extraction and citation-integrity validator.
5. Add static GitHub/Hugging Face metadata and revision-pinned config extraction.
6. Add references/citations/related/compare/verify tools.
7. Add local library, collections, ResearchPacks, reports, Docker and integration fixtures.

No LLM is required for the current slice. Optional extractors should accept evidence chunks and return claims only when each claim links to one or more chunks.
