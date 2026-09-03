# Provider contracts

Provider adapters are untrusted-input boundaries. HTTP success is not metadata success.

Adapters must validate required response envelopes before mapping records. A malformed success response is a provider failure (`SOURCE_FAILED` at the service boundary), not an authoritative empty result. Missing optional fields remain absent. Provider failures remain in research transparency and may coexist with independent provider results.

Current deterministic fixtures inject `fetch` and cover provider mappers and selected malformed Crossref responses. Crossref, OpenAlex, Semantic Scholar, arXiv, GitHub, and Hugging Face live calls are not required for normal CI and are subject to upstream availability and rate limits.

Provider identity must be preserved in `sourceProviders`, versions, evidence, and failure messages. Identifier normalization is centralized in `src/research/citations.ts`; provider adapters must not introduce alternate DOI or arXiv identity rules.
