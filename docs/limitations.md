# Known limitations

- **Exact-title retrieval:** title-only searches can miss or mis-rank a canonical work when upstream providers return incomplete or competing records. A provider-native DOI or arXiv identifier is the reliable fallback. Improving exact-title ranking and identifier probing is a deferred roadmap item in [architecture.md](architecture.md).
- **Provider availability:** anonymous APIs can return rate limits, transient failures, incomplete records, or different result ordering over time. Failures are retained in `transparency.providerFailures`.
- **PDF parsing:** GROBID output determines available layout fidelity. Optional PyMuPDF and Docling fallbacks require local installation and are not enabled by default.
- **Derived extraction:** heuristic facts, claims, parameters, and recipes are source-located but are not independent scholarly verification. Unknown values remain unreported.
- **Repository safety:** GitHub and Hugging Face content is inspected as data only. The system does not execute repository code, notebooks, model code, or downloaded scripts.
- **PostgreSQL and vector retrieval:** these modes require external services and have a separate runtime verification scope from SQLite tests. The bundled fallback is explicitly `lexical-hash-v1`, a deterministic token-hash retriever; it is not semantic embedding retrieval. A real embedding provider must be supplied through the `EmbeddingProvider` seam for semantic use, and pgvector dimension compatibility still requires live integration verification.
- **Response caching:** caching is deliberately conservative. Authorization, cookies, proxy credentials, credential-like query parameters, `Set-Cookie`, and identity-sensitive `Vary` responses bypass caching; this protects correctness but does not implement every HTTP cache directive.
- **License scope:** external papers, metadata, datasets, model weights, cards, and repositories are governed by their own licenses and terms.
