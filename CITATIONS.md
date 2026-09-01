# OpenPapers citation policy

This file is an opt-in instruction for agents working in this workspace. When it is present and in scope:

- Treat factual research claims as requiring evidence before presentation.
- Preserve evidence IDs, source IDs, authors, identifiers, source quality, evidence type, and locators.
- Do not invent missing paper metadata, training parameters, benchmark results, or repository attribution.
- Mark unavailable or uncertain values explicitly instead of filling them from plausibility.
- Keep citations adjacent to the claims they support and preserve the evidence location.
- Distinguish direct source statements, derived conclusions, code verification, secondary sources, and conflicts.
- Report unresolved provider failures and source conflicts rather than silently replacing them with successful-looking output.

The machine-enforced response boundary is `validateCitationIntegrity` in `src/research/verification.ts`.
