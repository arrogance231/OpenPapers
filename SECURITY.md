# Security

- Treat all external academic and repository content as untrusted data; never execute downloaded code.
- The server fetches only documented metadata endpoints in this slice. Future PDF/repository fetchers must enforce HTTPS, size/time limits, redirect validation, SSRF protections, decompression limits, and path confinement.
- Do not put credentials in tool arguments, schemas, logs, or MCP custom headers.
- HTTP deployment must use TLS and an authentication proxy. Bind localhost by default. Host/Origin guards are enabled for local HTTP.
- MCP tool inputs are Zod-validated. Tool failures are returned as `isError` results where actionable.
- Avoid prompt-injection propagation: retrieved text is evidence only and must not be interpreted as server instructions.
