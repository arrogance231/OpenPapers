# Real-source pipeline V1 checkpoint

## Baseline and experiment

The clean pre-change checkpoint is `bca7a07` and remains represented by the previously recorded result with 13 development tasks:

- answer correctness: 0.0000
- support-status accuracy: 0.0000
- false UNKNOWN: 0.1538
- fabricated-answer rate: 0.1538
- work and identifier accuracy: not measured

RP-001 hypothesis: routing each development case through `ResearchService.search`, retaining provider failures, retrieving benchmark-pinned GitHub content, and projecting only requested fields would expose real resolution/repository behavior and eliminate unrelated-parameter fabrication.

RP-001 changed the real runner and added production pinned repository evidence extraction/manifest support. The post-commit development run is keyed to commit `21c16871376d` and uses 13 development tasks.

Post-commit metrics:

- work accuracy: 0.6154
- identifier accuracy: 0.6154
- answer correctness: 0.1538
- evidence-source accuracy: 0.7692
- locator accuracy: 0.8462
- support-status accuracy: 0.0769
- correct UNKNOWN: 1.0000
- correct NOT_REPORTED: 0.0000
- false UNKNOWN: 0.9231
- false NOT_REPORTED: 0.0000
- fabricated-answer rate: 0.0000
- conflict precision/recall: not measured

Decision: ACCEPT the bounded integration and anti-fabrication improvement, but do not call it a quality completion. The large false-UNKNOWN rate is a direct signal that structured paper fact extraction and task answer assembly remain incomplete.

Provider observations included Semantic Scholar HTTP 429 degradation. Repository observations included successful pinned reads for some repositories and explicit GitHub 403 failures for others. These remain diagnostics, not absence claims.

Holdout tuning status: NO. The holdout was neither acquired nor inspected.
