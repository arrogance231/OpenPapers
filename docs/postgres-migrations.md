# PostgreSQL migration and referential-integrity policy

The PostgreSQL store uses ordered migrations recorded in `schema_migrations`; the current version is 2. The integration harness runs bootstrap, an intentional transaction rollback, identity migration, reconnect persistence, and native pgvector similarity. The default local integration URL uses the local-only Compose credential and can be overridden with `DATABASE_URL`.

Research evidence is not deleted by identity reconciliation. The store explicitly updates aliases, evidence source IDs, claims, graph edges, collection membership, and vector metadata inside one transaction before removing the old work row. Collection deletion removes membership only; it does not delete works or evidence. Foreign keys are intentionally not declared yet because the current migration must first establish a complete policy for legacy identity aliases and graph references. This is a documented limitation, not an implicit cascade policy.

The current integration script verifies empty/latest bootstrap, rollback, identity migration, reconnect, and vector search. A full v1-to-v2 and corrupted-metadata matrix remains deferred until a legacy PostgreSQL fixture can be safely provisioned.
