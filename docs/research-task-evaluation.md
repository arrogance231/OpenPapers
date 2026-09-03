# End-to-end research-task evaluation

`evals/datasets/research-tasks-v1.json` is a 15-task curated deterministic benchmark for the deepest currently executable research boundary. It covers training reconstruction, distillation, preference methods, hardware, abstention, conflicts, temporal provenance, and scope ambiguity.

Run it with:

    npm run eval:research

The runner exercises the real `ResearchService.search`, HTML document parser, and explicit training-parameter extractor. It records work/identifier resolution, answer, source, locator, support-status, abstention, fabricated-answer, and conflict metrics, plus one diagnostic row per task. Results are written under `evals/results/research-tasks-baseline-v1-*.json` and its `-failures.json` companion.

The first baseline is intentionally a boundary measurement, not a quality claim. The current extractor supports only explicitly labeled learning rate, batch size, epochs, optimizer, weight decay, temperature, and gradient accumulation. It does not yet reconstruct arbitrary teacher/student, dataset, precision, GPU, or training-step fields. Such tasks remain in the gold set so unsupported architecture is visible rather than replaced with plausible values.

`UNKNOWN` means the available evidence cannot establish a value. `NOT_REPORTED` is used only where the curated source review explicitly establishes absence. Provider failure and extraction failure never imply `NOT_REPORTED`.

The fixtures are synthetic HTML evidence and are not a live-provider or PDF benchmark. The benchmark's work-resolution score is bounded by the offline provider fixture and must not be generalized to scholarly production traffic.
