# Installation

## Local Node.js installation

Requirements: Node.js 22.5 or newer and npm.

```sh
npm ci
npm run build
npm start
```

The default transport is stdio and the default database is SQLite at `./data/research.sqlite`. Copy `.env.example` to `.env` to configure a different path or optional services.

## HTTP transport

```sh
MCP_TRANSPORT=http HTTP_HOST=127.0.0.1 HTTP_PORT=8787 npm start
```

The MCP endpoint is `/mcp`. Use a trusted authentication and TLS reverse proxy before binding outside loopback. Host and Origin validation remain enabled by the server.

## Docker Compose

```sh
docker compose config -q
docker compose up --build --wait
```

Compose starts OpenPapers, PostgreSQL with pgvector, and GROBID. The application runs as the non-root `node` user. Stop the stack with `docker compose down`; named volumes are retained unless explicitly removed.

## Optional PDF fallbacks

GROBID is the primary PDF parser in Compose. Optional local fallbacks can be installed and enabled as described in [configuration.md](configuration.md). Fallback output is labeled with its parser and warnings are retained.
