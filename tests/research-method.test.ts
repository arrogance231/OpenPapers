import { describe, expect, it, vi } from 'vitest';
import { registerTools } from '../src/mcp/tools.js';

describe('Phase 7 research method tool', () => {
  it('registers research_method and forwards bounded method searches', async () => {
    const handlers = new Map<string, (args: any) => Promise<any>>();
    const server = { registerTool(name: string, _config: unknown, handler: (args: any) => Promise<any>) { handlers.set(name, handler); } };
    const research = { researchMethod: vi.fn().mockResolvedValue({summary:'method results',data:[],evidence:[],references:[],transparency:{expandedQueries:[],sourcesSearched:['arxiv'],candidates:0,retrievedAt:'now',rankingRationale:[]}}) };
    registerTools(server as any, research as any);
    expect(handlers.has('research_method')).toBe(true);
    const response = await handlers.get('research_method')!({method:'contrastive learning',limit:5});
    expect(research.researchMethod).toHaveBeenCalledWith('contrastive learning',5);
    expect(response.structuredContent.data).toEqual([]);
  });
});
