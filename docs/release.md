# OpenPapers release and deployment

## Local verification

Use Node.js 24 or newer:

```sh
npm ci
npm run lint
npm run build
npm test
```

The default database is `./data/research.sqlite`. Set `RESEARCH_DB_PATH` to use another SQLite path. Existing databases are upgraded idempotently and report their schema version through the database API.

## MCP server

The built server starts with:

```sh
node --env-file-if-exists=.env dist/mcp/server.js
```

HTTP mode is opt-in through `MCP_TRANSPORT=http`, `HTTP_HOST`, and `HTTP_PORT`. Keep HTTP bound to loopback unless a trusted reverse proxy supplies authentication and TLS.

## Docker

```sh
docker compose up --build
```

OpenPapers runs as the non-root `node` user and stores its SQLite database in the `openpapers-data` volume. GROBID health is checked before OpenPapers starts. Container startup and end-to-end GROBID checks are separate from the credential-free unit suite.

## ResearchPacks

ResearchPacks use `openpapers.research-pack.v1`. They contain collection metadata, paper metadata, and evidence entries associated with their paper IDs. Imports are bounded at the MCP boundary, validate the declared format and required fields, upsert paper metadata, and never execute pack contents.

## Upgrade and rollback

Back up the SQLite file before upgrades. The schema migration ledger is append-only; upgrades must be idempotent. To roll back application code, restore the prior application version and database backup together. Do not manually delete migration records.

## Optional integrations

GROBID, provider APIs, Docker, and model/tool-calling workflows are optional integration scopes. A passing deterministic test suite does not constitute live provider, container, or model verification.
