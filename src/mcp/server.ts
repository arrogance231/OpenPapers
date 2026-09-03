import { createServer as createHttpServer } from 'node:http';

import { McpServer, createMcpHandler } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { toNodeHandler, localhostHostValidation, localhostOriginValidation } from '@modelcontextprotocol/node';
import { ResearchService } from '../research/service.js';
import { PostgresResearchStore } from '../database/postgres.js';
import { HashEmbeddingProvider, PostgresVectorRetriever } from '../retrieval/vector.js';
import { registerTools } from './tools.js';

export function createMcpServer(research = new ResearchService()): McpServer {
  const server = new McpServer({ name: 'OpenPapers', version: '0.1.0' });
  registerTools(server, research);
  return server;
}

export function createHttpHandler(research = new ResearchService()) {
  return createMcpHandler(() => createMcpServer(research), { responseMode: 'json' });
}

async function main(): Promise<void> {
  const postgres = process.env.DATABASE_BACKEND === 'postgres' ? PostgresResearchStore.fromConfig() : undefined;
  const research = new ResearchService(postgres ?? undefined);
  if(postgres) research.setVectorRetriever(new PostgresVectorRetriever(postgres,new HashEmbeddingProvider()));
  if (research.db instanceof PostgresResearchStore) await research.db.initialize();
  const mode = process.env.MCP_TRANSPORT ?? 'stdio';
  if (mode === 'http') {
    const handler = createHttpHandler(research);
    const nodeHandler = toNodeHandler(handler);
    const host = process.env.HTTP_HOST ?? '127.0.0.1';
    const port = Number(process.env.HTTP_PORT ?? 8787);
    const validateHost = localhostHostValidation();
    const validateOrigin = localhostOriginValidation();
    const http = createHttpServer((req, res) => {
      if (req.url !== '/mcp' && req.url !== '/mcp/') { res.writeHead(404); res.end('Not found'); return; }
      if (!validateHost(req, res) || !validateOrigin(req, res)) return;
      void nodeHandler(req as any, res);
    });
    http.listen(port, host, () => console.error(`OpenPapers HTTP listening on http://${host}:${port}/mcp`));
    const shutdown = async () => { await handler.close(); await research.flushStorage(); await research.db.close?.(); http.close(); };
    process.once('SIGINT', () => void shutdown()); process.once('SIGTERM', () => void shutdown());
  } else {
    await serveStdio(() => createMcpServer(research));
    console.error('OpenPapers stdio server running');
  }
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/mcp/server.js') || process.argv[1]?.replaceAll('\\', '/').endsWith('/mcp/server.ts')) void main();
