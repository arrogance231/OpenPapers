import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Docker hardening',()=>{
  it('makes the runtime data directory writable by the non-root node user',()=>{
    const dockerfile=readFileSync('Dockerfile','utf8');
    expect(dockerfile).toContain('COPY --chown=node:node package*.json ./');
    expect(dockerfile).toContain('RUN mkdir -p /app/data && chown -R node:node /app');
  });
  it('waits for a healthy GROBID service',()=>{
    const compose=readFileSync('docker-compose.yml','utf8');
    expect(compose).toContain('test: ["CMD", "curl", "-f", "http://localhost:8070/api/isalive"]');
    expect(compose).toContain('condition: service_healthy');
  });
  it('runs the published OpenPapers port in HTTP mode',()=>{
    const compose=readFileSync('docker-compose.yml','utf8');
    expect(compose).toContain('MCP_TRANSPORT: http');
    expect(compose).toContain('HTTP_HOST: 0.0.0.0');
    expect(compose).toContain('HTTP_PORT: 8787');
  });
});
