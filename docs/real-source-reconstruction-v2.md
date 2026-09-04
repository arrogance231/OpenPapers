# Real-source reconstruction V2 checkpoint

## Mandatory audits

- False UNKNOWN analysis: `evals/results/real-source-false-unknown-analysis-21c16871376d.json`
- Capability matrix: `evals/results/real-source-capability-matrix-21c16871376d.json`
- Development split: 13 tasks
- Holdout: not acquired, inspected, or evaluated

The baseline had 12 false UNKNOWN cases. The dominant cause was paper evidence being available but the extractor/assembler supporting only explicit scalar training parameters.

## Experiments

RP-002 added bounded proposition extraction for objectives, formulations, parallelism, RAG components, evaluation regimes, training stages, attention properties, and ReAct trace elements. It also routed the evaluator through the proposition assembler.

RP-003 deduplicated proposition values across page sections and added a conservative composite representation for ZeRO's explicitly listed optimizer states, gradients, and parameters.

RP-004 added canonical ordering for regimes, preferred the explicitly requested exact-attention classification when implementation and property evidence co-occurred, and recognized the explicit intra-layer model-parallel terminology used by the Megatron paper.

## Metrics

Pre-V2 accepted baseline (`21c1687`):

- answer correctness: 0.1538
- support-status accuracy: 0.0769
- false UNKNOWN: 0.9231
- false NOT_REPORTED: 0.0000
- fabricated-answer rate: 0.0000

V2 development result (`cbeebf9`):

- work accuracy: 0.6154
- identifier accuracy: 0.6154
- answer correctness: 0.8462
- evidence-source accuracy: 0.7692
- locator accuracy: 0.8462
- support-status accuracy: 0.7692
- correct UNKNOWN: 1.0000
- correct NOT_REPORTED: 0.0000
- false UNKNOWN: 0.2308
- false NOT_REPORTED: 0.0000
- fabricated-answer rate: 0.0000
- conflict precision/recall: not measured

The remaining incorrect answers are `real-transformer-optimizer` (PDF artifact unavailable in the current acquisition result) and `real-zero-stages` (same acquisition limitation). No concrete answer was produced for either.

Decision: ACCEPT V2. Answer coverage improved materially without relaxing evidence requirements or increasing fabrication. Freeze development behavior before holdout acquisition.

Provider failures remain explicit. Semantic Scholar HTTP 429 and GitHub HTTP 403 responses were retained as diagnostics. Holdout tuning: NO.
