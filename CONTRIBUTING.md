# Contributing to OpenPapers

Contributions should improve scholarly retrieval, provenance, reproducibility, safety, or the contributor experience without weakening source attribution or uncertainty handling.

## Development setup

Requirements: Node.js 22.5 or newer and npm.

```sh
npm ci
cp .env.example .env   # only when local configuration is needed
npm run check
```

The default tests use deterministic fixtures and do not require provider credentials. Live provider, Docker, GROBID, and model workflow checks are optional and must be described separately from fixture results.

## Engineering expectations

- Keep provider-specific payloads inside provider adapters and map them to domain types.
- Preserve provider-native identifiers, source URLs, revisions, commits, blob IDs, and line locators where available.
- Treat papers, repository files, model cards, and API responses as untrusted data; never execute downloaded content.
- Represent unavailable, conflicting, heuristic, and unverified values explicitly. Do not guess missing research parameters.
- Use bounded Zod schemas for MCP inputs and return structured data together with concise text.
- Add tests for success, missing data, malformed data, and upstream failures.
- Keep factual results separate from recommendations or generated synthesis.

## Adding a provider

Read [docs/extending.md](docs/extending.md). Add a provider module, pure mapper fixtures, injected-fetcher tests, normalized domain output, failure handling, and documentation in [docs/providers.md](docs/providers.md). Authentication must remain optional unless the feature genuinely cannot operate without it.

## Adding or changing MCP tools

Place capabilities in `src/mcp/tool-modules/` where practical and register them from the existing tool registry. Add bounded input schemas, handler tests, provenance coverage, and a registration-inventory update when the public tool list changes. Do not create a second transport or server.

## Pull requests

Use a focused branch and pull request. Describe:

- motivation and scope;
- affected providers, tools, or persistence boundaries;
- provenance and security implications;
- reproduction steps and assumptions;
- fixture results and, when relevant, benchmark or live-provider results;
- documentation changes and known limitations.

Before submitting:

```sh
npm run lint
npm run architecture-check
npm run build
npm test
npm run check
```

Do not commit `.env`, credentials, downloaded papers, generated databases, private repository content, or provider response dumps. See [SECURITY.md](SECURITY.md).
