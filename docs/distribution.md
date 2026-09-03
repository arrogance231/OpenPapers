# Distribution

## Local installation

```sh
npm ci
npm run build
npm start
```

The package exposes the `openpapers` executable. For a packed-install smoke test:

```sh
npm pack
mkdir /tmp/openpapers-smoke && cd /tmp/openpapers-smoke
npm init -y
npm install /path/to/openpapers-0.1.0.tgz
npm exec -- openpapers
```

The executable uses stdio by default and exits when its MCP client closes stdin.

## HTTP and Docker

```sh
MCP_TRANSPORT=http HTTP_HOST=127.0.0.1 HTTP_PORT=8787 npm start
docker compose config -q
docker compose up --build --wait
```

Compose configures PostgreSQL/pgvector, GROBID, HTTP transport, and local-only credentials. Use a trusted TLS/authentication reverse proxy before exposing HTTP beyond localhost. Do not commit production credentials.

## MCP client configuration

For a local stdio client, invoke `openpapers` from the installed package. For HTTP clients, use `http://127.0.0.1:8787/mcp` only in a trusted local environment. The server validates Host and Origin headers.

## Environment variables

See `.env.example` and `docs/configuration.md` for SQLite/PostgreSQL selection, database paths, provider credentials, GROBID, and optional parser fallbacks.

## Release process

Publishing is intentionally not automated from this repository. `prepack` builds TypeScript before packaging, and `files` limits the artifact to compiled runtime files, public documentation, license, changelog, and configuration example. Run `npm pack` and the packed-install smoke test before a versioned release.

## Known limitations

Live provider checks, PostgreSQL restart/persistence checks, and GROBID extraction are separate from deterministic CI. A passing Compose configuration check does not prove service readiness or end-to-end protocol behavior.
