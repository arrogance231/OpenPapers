# Usage

## Stdio

Build and launch the server for an MCP client:

```sh
npm run build
npm start
```

## HTTP

```sh
MCP_TRANSPORT=http npm start
```

Send MCP requests to `http://127.0.0.1:8787/mcp` through an MCP-compatible client. The HTTP transport is stateless and supports `initialize`, `tools/list`, and `tools/call`.

## Typical research workflow

1. Call `search_papers` with a bounded query and limit.
2. Inspect identifiers, provider lineage, evidence, conflicts, and provider failures.
3. Call `get_paper` with a DOI, arXiv ID, or returned paper ID to resolve canonical metadata.
4. Use `read_paper` or `extract_training_parameters` when source material is available.
5. Treat heuristic facts and derived claims as labeled evidence, not independent verification.
6. Use collection and ResearchPack tools to persist a reproducible local set.

The response contains human-readable `content` and structured fields such as `data`, `evidence`, `references`, and `transparency` where the tool contract provides them. Every source-backed claim should remain traceable to its upstream record.

## Docker smoke checks

```sh
curl http://127.0.0.1:8070/api/isalive
docker compose ps
node scripts/mcp-benchmark.mjs
```

The benchmark measures MCP control-plane latency only; it does not measure provider, PDF, GROBID, PostgreSQL, or model throughput.
