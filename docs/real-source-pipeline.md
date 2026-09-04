# Real-source pipeline audit

This document records the production integration status for `research-real-v1`. It distinguishes the existing evaluator boundary from the full pipeline now being connected.

| Stage | Production implementation | Real evaluator uses it? | Status |
| --- | --- | --- | --- |
| Query interpretation | `ResearchService.search` provider fan-out and query expansion | Yes, title resolution is now attempted per case | PARTIAL |
| Work resolution | ArXiv, Crossref, OpenAlex, Semantic Scholar adapters | Yes, provider candidates are recorded | PARTIAL |
| Canonical reconciliation | Identifier-indexed reconciliation in `ResearchService.search` | Yes, actual arXiv identity is recorded | PARTIAL |
| Paper acquisition | HTTPS bounded acquisition and ignored local cache | Yes, acquired PDF artifacts | COMPLETE |
| PDF parsing | PyMuPDF runner; GROBID chain exists but is not live-tested | Yes, PyMuPDF | PARTIAL |
| Paper extraction | Production explicit parameter extractor | Yes, through the real runner | PARTIAL |
| Repository resolution | GitHub provider search/content/revision APIs | Pinned benchmark URL and SHA are used | PARTIAL |
| Pinned repository acquisition | `PinnedRepositoryReader` retrieves exact commit content | Yes | COMPLETE for bounded GitHub retrieval |
| File discovery | Deterministic README/config/training/launch/model-card signals with exclusions and bounds | Yes | COMPLETE for selected categories |
| Repository line locator | One-based exact line ranges and supporting text | Yes | COMPLETE |
| Repository manifest | Content hash, size, route, owner/repo, commit | Yes | COMPLETE |
| Repository parameter extraction | Explicit training/config patterns | Yes | PARTIAL; benchmark fields exceed current extractor |
| Evidence source separation | Paper and repository evidence remain separate in row diagnostics | Partially | PARTIAL |
| Temporal alignment | Dataset metadata is preserved; commit dates are mostly unavailable | Recorded, not inferred | UNKNOWN / PARTIAL |
| Evidence reconciliation | Existing paper/code comparator accepts structured fields | Not yet end-to-end wired for every real task | PARTIAL |
| Structured answer assembly | Existing recipe/report paths; real runner still has legacy answer projection | Not fully | PARTIAL |
| Anti-fabrication | Provider/repository/parser failures are recorded distinctly | Yes for diagnostics; answer policy still needs hardening | PARTIAL |
| MCP real-source transport | Existing paper and repository tools, no pinned reconstruction scenario | No | MISSING |

The benchmark remains split into 13 development tasks and 6 holdout tasks. Holdout artifacts are not acquired or inspected during development.
