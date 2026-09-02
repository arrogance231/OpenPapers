# OpenPapers Release Checklist

## Automated gates

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `git diff --check`

## Runtime gates

- [ ] `docker compose config -q`
- [ ] `docker compose up -d --build --wait`
- [ ] `docker compose ps` shows OpenPapers running and GROBID healthy
- [ ] `curl http://127.0.0.1:8070/api/isalive` returns HTTP 200 and `true`
- [ ] MCP initialize, `tools/list`, and a bounded local `tools/call` return HTTP 200
- [ ] `docker compose exec -T openpapers id` confirms non-root runtime
- [ ] Persistent `/app/data` write test passes

## Benchmarks

Run against a running HTTP server:

```sh
MCP_BENCHMARK_RUNS=30 node scripts/mcp-benchmark.mjs
```

Record Docker/Node versions, host CPU/RAM, run count, endpoint, median, P95, and max. These control-plane measurements do not represent provider, PDF, GROBID, Postgres, or Qwen throughput.

## Release evidence

- [ ] No credentials or authorization headers appear in logs, fixtures, or benchmark output.
- [ ] ResearchPack import/export remains deterministic and versioned.
- [ ] Claims and evidence retain provenance and `NOT_REPORTED` values are not guessed.
- [ ] External-provider failures remain visible.
- [ ] Migration version is recorded and upgrade tests pass.
- [ ] Git working tree is clean.
