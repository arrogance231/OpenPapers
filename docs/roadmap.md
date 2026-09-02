# Roadmap

OpenPapers prioritizes trustworthy retrieval and explicit provenance before adding convenience features that could make research output appear more authoritative than its sources.

## Current focus: verification before automation

The next development cycle is focused on testing and hardening:

- Expand credential-free unit and integration coverage for every MCP tool.
- Maintain adversarial tests for malformed provider responses, conflicting metadata, unsafe URLs, redirects, oversized payloads, retries, rate limits, and cache boundaries.
- Exercise SQLite and PostgreSQL/pgvector deployments with migration, rollback, persistence, and read-after-write tests.
- Verify that every material claim retains evidence, source attribution, identifiers, and uncertainty.
- Test deterministic ResearchPack export/import and reproducible report generation.
- Run live provider and Docker smoke tests separately from local tests so infrastructure failures remain distinguishable from code defects.
- Add documentation and link checks to the release process.

## Planned: formal citation metadata

A formal project citation record may be added after the project has stable public authorship and release identity. This is separate from citations produced for retrieved papers.

Before adding a machine-readable project citation file, the following must be established:

1. Maintainer-approved project name, authorship, affiliation, and contact information.
2. Stable repository URL and release/version policy.
3. A documented citation format and preferred citation text.
4. Verification that the citation metadata does not imply that generated research responses are original academic sources.
5. Tests validating the citation file's schema, links, version, and release consistency.
6. Documentation explaining how to cite OpenPapers and how to cite the underlying papers and datasets returned by it.

## Planned: source-aware citation output

Automatic citation output for research responses will not be enabled until extensive testing demonstrates that citations remain faithful to their evidence. Required gates include:

- Every citation maps to an actual retained source or evidence record.
- Provider-native identifiers and canonical URLs are preserved.
- Conflicting metadata is exposed rather than silently merged.
- Missing authors, dates, titles, and identifiers remain missing instead of being guessed.
- Citation ordering and formatting are deterministic for identical inputs.
- Unsupported claims cannot receive citations merely because they appear in a generated summary.
- Rate limits, unavailable providers, and partial results are represented in the output.
- Tests cover duplicate records, DOI/arXiv reconciliation, versioned papers, references, citations, repository evidence, and dataset/model links.
- Human review of representative outputs finds no unsupported attribution or misleading source implication.

The initial implementation, when approved, should be opt-in, expose its evidence mapping, and ship behind a documented compatibility contract. It should become a default only after repeated release-cycle testing.

## Deferred retrieval improvements

- Improve exact-title ranking and canonical-record selection across providers.
- Use identifier-aware fallback more aggressively when title results are incomplete.
- Improve conflict presentation without hiding provider-specific values.
- Expand reproducibility fixtures for GROBID, PDF, HTML, repository, and model-card inputs.

Roadmap items are proposals, not promises or claims about an implemented feature. Changes should be accompanied by tests, documentation, and explicit provenance evidence.
