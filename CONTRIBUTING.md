# Contributing

1. Use Node.js 24+, `npm install`, and run `npm test`.
2. Follow red-green-refactor for behavior changes.
3. Keep provider adapters independent and inject fetchers in tests.
4. Every extracted research fact must carry evidence and a locator when available.
5. Never turn absent metadata into a guessed value.
6. Do not execute repository code during ingestion.
7. Run `npm run lint && npm run build && npm test` before a pull request.

Planned phases are tracked in `docs/architecture.md`; keep commits focused by subsystem.
