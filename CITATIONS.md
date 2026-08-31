# CITATIONS.md

## Purpose

This file is the single, opt-in workspace instruction for citation-safe research implementation. It is intentionally limited to this file: do not create or modify citation-policy files elsewhere unless the user explicitly asks.

## Instruction for coding and research agents

When implementing or documenting a technique based on academic literature in this workspace:

1. Attribute the technique to its authors whenever the source is known.
2. Add a citation entry to this `CITATIONS.md` file for every material paper, dataset, benchmark, model, or implementation used.
3. Include the paper title, complete author list when available, year, DOI/arXiv identifier, canonical URL, and the exact section/page/table/equation or repository path supporting the claim.
4. Distinguish paper-reported facts, code-verified facts, cross-source synthesis, and recommendations.
5. Never invent missing metadata or silently convert an inference into an author claim. Use `NOT_REPORTED`, `NOT_FOUND`, or `UNVERIFIED`.
6. Keep citation changes restricted to `CITATIONS.md`; do not edit unrelated workspace files merely to add citations.

## Opt out

This policy is opt-in. If the user explicitly says they do not want citation tracking or does not want workspace bloat, do not update this file for that task and do not create additional citation files. Still avoid fabricated citations in normal responses.

## Citation records

Add records below in this format:

```markdown
### [Short key] — Paper title
- Authors: Full author list
- Year / venue: YYYY / venue or preprint
- Identifiers: DOI; arXiv ID; other stable IDs
- Canonical URL: https://...
- Evidence locations: §X, p. Y, Table Z, Eq. N, or repository path + commit SHA
- Used for: technique, objective, dataset, benchmark, configuration, or implementation
- Provenance: DIRECT | CODE_VERIFIED | DERIVED | SECONDARY_SOURCE | CONFLICTING | UNVERIFIED
- Notes: disagreements, missing details, or reproducibility risks
```
