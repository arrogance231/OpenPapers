import { describe, expect, it } from 'vitest';
import { registerTools } from '../src/mcp/tools.js';

type Registration = { name: string; options: { title?: string; description?: string; inputSchema?: unknown }; handler: unknown };

describe('MCP tool contract surface', () => {
  it('registers a complete, uniquely named, described, schema-bound tool surface', () => {
    const registrations: Registration[] = [];
    const server = {
      registerTool(name: string, options: Registration['options'], handler: unknown) {
        registrations.push({ name, options, handler });
      },
    };

    registerTools(server as any, {} as any);

    expect(registrations).toHaveLength(36);
    expect(new Set(registrations.map(item => item.name)).size).toBe(registrations.length);
    for (const registration of registrations) {
      expect(registration.name).toMatch(/^[a-z][a-z0-9_]+$/);
      expect(registration.options.title).toBeTruthy();
      expect(registration.options.description).toBeTruthy();
      expect(registration.options.inputSchema).toBeTruthy();
      expect(typeof registration.handler).toBe('function');
    }
  });
});
