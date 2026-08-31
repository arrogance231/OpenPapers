import { createServer as createHttpServer } from 'node:http';
import { McpServer, createMcpHandler } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { toNodeHandler, localhostHostValidation, localhostOriginValidation } from '@modelcontextprotocol/node';
import { ResearchService } from '../research/service.js';
import { registerTools } from './tools.js';

export function createMcpServer(research = new ResearchService()): McpServer {
  const server = new McpServer({ name: 'llm-research-mcp', version: '0.1.0' });
  registerTools(server, research);
  return server;
}

export function createHttpHandler(research = new ResearchService()) {
  return createMcpHandler(() => createMcpServer(research), { responseMode: 'json' });
}

async function main(): Promise<void> {
  const mode = process.env.MCP_TRANSPORT ?? 'stdio';
  if (mode === 'http') {
    const handler = createHttpHandler();
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
    http.listen(port, host, () => console.error(`llm-research-mcp HTTP listening on http://${host}:${port}/mcp`));
    const shutdown = async () => { await handler.close(); http.close(); };
    process.once('SIGINT', () => void shutdown()); process.once('SIGTERM', () => void shutdown());
  } else {
    await serveStdio(() => createMcpServer());
    console.error('llm-research-mcp stdio server running');
  }
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll('\\', '/')}`) void main();
