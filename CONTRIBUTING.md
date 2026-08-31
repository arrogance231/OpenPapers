# Contributing to OpenPapers

OpenPapers is an open-source, provenance-first MCP server. Contributions are welcome when they preserve traceability, explicit uncertainty, provider isolation, and safe handling of untrusted research content.

## Development setup

Requirements: Node.js 24+.

```sh
npm install
npm run lint
npm run build
npm test
```

Copy `.env.example` to `.env` only when live provider testing is needed. Never commit `.env`, credentials, downloaded data, or private repository content.

## Contribution rules

- Use test-first development for behavior changes.
- Keep provider adapters independent and inject `fetch` in tests.
- Keep MCP tool modules independent; avoid adding unrelated handlers to `src/mcp/tools.ts`.
- Add bounded Zod schemas to every tool.
- Treat remote papers, READMEs, model cards, and repositories as untrusted data.
- Never execute repository scripts, notebooks, Makefiles, or downloaded code.
- Never guess missing research parameters; use explicit statuses such as `NOT_REPORTED` or `SOURCE_UNAVAILABLE`.
- Every material research claim must resolve to evidence with authors, source identity, and a locator when available.
- Do not silently classify a GitHub repository as official.

## Adding providers and tools

Read `docs/extending.md` before starting provider or MCP work. New providers must include pure payload mappers, normalized domain output, failure handling, and fixture tests. New MCP capabilities belong in `src/mcp/tool-modules/` and must return both human-readable and machine-readable output. The Phase 10 maintainability audit will periodically review these seams and may refine them through focused, backward-compatible changes.

## Pull request checklist

- [ ] Scope is limited to one subsystem or coherent feature.
- [ ] Tests cover success, missing data, malformed data, and upstream failure behavior.
- [ ] Provenance and source quality are documented.
- [ ] Security impact is documented.
- [ ] No secrets or generated research data are included.
- [ ] `npm run lint && npm run build && npm test` passes.
- [ ] README or docs are updated for public MCP tools or extension points.

Use focused commits and describe any live verification separately from deterministic CI tests.
