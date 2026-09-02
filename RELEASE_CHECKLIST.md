# Release checklist

Use this checklist for a release candidate. Mark items only after running them against the current checkout and record environment-dependent evidence in the release notes.

## Automated gates

- [ ] `npm ci --no-audit --no-fund`
- [ ] `npm run lint`
- [ ] `npm run architecture-check`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm run check`
- [ ] `git diff --check`

## Documentation and security

- [ ] README, provider documentation, configuration examples, and limitations match the implementation.
- [ ] `.env.example` contains placeholders only.
- [ ] No credentials, authorization headers, downloaded research data, or private repository content are present.
- [ ] External provider failures and provenance behavior remain documented.
- [ ] Dependency and upstream license obligations have been reviewed.
- [x] Apache-2.0 is selected and `LICENSE.md` is present; review third-party notices separately.

## Runtime gates

When Docker is available:

```sh
docker compose config -q
docker compose up -d --build --wait
docker compose ps
curl http://127.0.0.1:8070/api/isalive
node scripts/adversarial-mcp-smoke.mjs
MCP_BENCHMARK_RUNS=30 node scripts/mcp-benchmark.mjs
docker compose down
```

Verify MCP initialization, `tools/list`, at least one bounded `tools/call`, PostgreSQL/pgvector readiness, GROBID readiness, non-root application execution, and persistent data behavior. Control-plane benchmark results do not represent provider, PDF, GROBID, PostgreSQL, or model throughput.

## Data and migrations

- [ ] SQLite migration tests pass and the migration ledger is idempotent.
- [ ] PostgreSQL/pgvector schema and read-after-write behavior are verified when that deployment is released.
- [ ] ResearchPack import/export remains versioned, bounded, and deterministic.
- [ ] Claims and evidence retain source provenance; unavailable values are not guessed.

## Publication state

- [ ] Changelog is updated.
- [ ] Version metadata is consistent.
- [ ] Git working tree is clean.
