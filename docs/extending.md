# Extending OpenPapers

OpenPapers is designed as an FOSS project with small, replaceable boundaries. Contributions should add one capability at a time and keep provider-specific behavior out of the research domain and MCP transport.

## Add a provider

1. Create `src/providers/<provider>.ts`.
2. Define provider payload types locally; do not leak upstream JSON into domain models.
3. Export a pure mapper for fixture tests.
4. Export a provider class with an injected `fetcher` (and injected clock/sleeper when timing matters).
5. Normalize identifiers through `src/research/citations.ts`.
6. Preserve source URLs, revisions, timestamps, and missing fields explicitly.
7. Never execute remote repository content.
8. Add tests under `tests/` for mapping, malformed payloads, authentication headers, and provider failures.

All external providers use `src/reliability/reliability.ts`. GET responses receive bounded in-memory TTL caching and concurrent request deduplication; requests carrying `Authorization` are never shared or cached, and `private`/`no-store` responses are not stored. Retryable 429/5xx responses and transient thrown network errors receive bounded backoff; both numeric and HTTP-date `Retry-After` values are honored. A FIFO process-wide limiter prevents concurrent bursts. Reliability counters, failures, and terminal request latency are exposed through research transparency. The fetcher remains injectable for deterministic tests.

## Add MCP tools

MCP tools are grouped into modules under `src/mcp/tool-modules/`. A module should export a `register<Name>Tools(server, dependencies?)` function and own only its schemas, handlers, and provider dependencies. Register the module from `src/mcp/tools.ts`; do not create a second MCP server or duplicate transport code.

Every tool should:

- use a strict Zod input schema with bounded limits;
- return both concise human-readable text and structured content;
- include source URLs and revision identifiers for external records;
- distinguish unavailable, unverified, conflicting, and reported values;
- pass research claims through citation-integrity validation;
- be safe when upstream services return 429, 5xx, malformed data, or no results.

Card links are reported metadata. `find_models` and `find_datasets` additionally return separate `linkedPaperLinks` records with `VERIFIED` or `UNVERIFIED` status based only on the local scholarly resolver; a card link alone is never promoted to verified evidence.

Attribution labels are conservative: `OFFICIAL` requires explicit README language plus a matching verified paper identifier; `ORGANIZATION_OFFICIAL` additionally requires the README to name the repository owner as the official implementation organization; `AUTHOR_MAINTAINED` requires repository-owner overlap with a paper author; `COMMUNITY_REPRODUCTION` requires explicit community/reimplementation language; contradictory official and community claims resolve to `UNKNOWN`; otherwise the result is `UNKNOWN`. These labels are evidence classifications, not permission to claim code correctness or execution results.

For `get_repository_config`, structured extraction is intentionally conservative: the current parser handles scalar YAML/TOML assignments, explicit one-level YAML sections, explicit TOML sections, and top-level JSON scalar fields. Deeper nested objects, arrays, malformed values, and unsupported syntax are omitted with warnings rather than flattened or guessed. Raw line-numbered content remains available for later specialized extractors.

For larger contributions, extract shared response and provenance helpers instead of expanding a handler into a god function. Tool names and input fields are public API: document intentional changes and add a compatibility note.

## Pull requests

Use a focused branch and commit. Include the motivation, affected provider/tool, provenance implications, security considerations, and verification commands. Use fixture-based tests for deterministic behavior; live tests should be opt-in and must not require credentials in CI.

Required checks:

```sh
npm run lint
npm run build
npm test
```

Do not include `.env`, API keys, downloaded papers, generated databases, or private repository contents in commits. See `SECURITY.md` for untrusted-content rules and `CONTRIBUTING.md` for the project checklist.
