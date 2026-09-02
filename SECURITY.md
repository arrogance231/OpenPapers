# Security policy

## Reporting vulnerabilities

Do not open a public issue for an undisclosed vulnerability. Use the repository's GitHub Security Advisories workflow when enabled, or contact the repository maintainers through the private contact mechanism configured for the GitHub project. Include reproduction steps, affected versions, impact, and a proposed mitigation when available.

## Credential handling

- API keys and tokens are optional configuration for provider access; never commit them.
- Keep secrets in a local `.env` file or an external secret manager. `.env` is ignored by Git; `.env.example` contains placeholders only.
- Do not place credentials in MCP arguments, custom headers, source fixtures, logs, benchmark output, screenshots, or issue reports.
- If a credential is exposed, revoke or rotate it immediately and remove it from all published history where possible.

## Security boundaries

- External paper, repository, model-card, and dataset content is untrusted input and is not executed.
- HTTP acquisition is bounded by scheme, host, redirect, timeout, and response-size checks. Archive/compressed responses are rejected before parsing.
- The HTTP MCP transport binds to loopback by default and validates Host and Origin. Deployments exposed beyond a trusted local network require TLS and authentication at a reverse proxy.
- MCP inputs are schema-validated and provider calls use bounded limits and retry policies.
- Authorization-bearing responses are excluded from shared/durable caching; `private` and `no-store` responses are not cached.

Report suspected SSRF, credential leakage, unsafe content execution, authentication bypass, or provenance-integrity failures as security issues.
