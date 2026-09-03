# Vector compatibility

PostgreSQL vectors are stored in native `vector` columns. SQL similarity uses cosine distance (`<=>`). Compatibility filtering currently persists and checks `embeddingProvider` and `dimensions` in the payload; the provider value is used as the embedding identity in the integration harness. Equal dimensions are not sufficient by themselves for production model compatibility.

The current contract does not yet persist a separately named embedding model revision or normalization mode. Until that is added, callers must treat cross-model comparisons as unverified and use the compatibility filter rather than assuming equal-dimensional spaces are interchangeable. The integration harness verifies native SQL ranking, persistence across reconnect, and identity migration of vector records.
