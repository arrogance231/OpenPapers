# Provenance and reproducibility

OpenPapers separates four layers:

1. **Source metadata** returned by an upstream provider.
2. **Retrieved source material** such as HTML, PDF, repository files, cards, or API records.
3. **Project normalization** including identifier reconciliation, parsing, chunking, and deterministic ranking.
4. **Derived analysis** such as heuristic facts, claims, recipes, and summaries.

Evidence records preserve source IDs, titles, authors, DOI/arXiv/OpenAlex/Semantic Scholar identifiers, URLs, evidence type, source quality, and locators when available. Missing fields use explicit statuses such as `NOT_REPORTED`; provider errors and conflicting records are not converted into successful-looking values.

Generated summaries are convenience views over structured results. They are not original academic citations. Verify material claims against the referenced paper, repository, dataset, or model card and comply with the upstream resource's license and terms.

## Deterministic verification

```sh
npm ci
npm run check
```

Fixture tests inject providers, fetchers, clocks, sleepers, and stores. They do not require external credentials. The adversarial suite covers provider failures, cache privacy, acquisition limits, retry bounds, identity reconciliation, citation integrity, MCP boundaries, and persistence.

## PostgreSQL/pgvector integration

With Docker running, execute the real database integration harness:

```sh
docker compose -f docker-compose.yml -f docker-compose.integration.yml up --build --wait
npm run test:postgres
docker compose -f docker-compose.yml -f docker-compose.integration.yml down
```

The integration override publishes PostgreSQL on local host port `55432` for the test process, avoiding common local PostgreSQL port collisions. The harness verifies rollback, identity migration, reconnect persistence, and model/dimension-filtered pgvector search. These checks are separate from the credential-free deterministic suite.

## Live verification

Live provider and Docker checks are environment-dependent. Record the endpoint, provider status, response counts, and failures without recording credentials or raw secret-bearing headers. A successful HTTP response proves reachability and mapping only; it does not prove metadata completeness, paper identity, or scientific correctness.
