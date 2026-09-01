import { describe, expect, it, vi } from 'vitest';
import { registerTools } from '../src/mcp/tools.js';
import { makeEvidence } from '../src/research/citations.js';

function capture() {
  const handlers = new Map<string, (args: any) => Promise<any>>();
  const server = {
    registerTool(name: string, _config: unknown, handler: (args: any) => Promise<any>) {
      handlers.set(name, handler);
    }
  };
  return { server, handlers };
}

const paper = { paperId: 'a', title: 'Paper', authors: [{ name: 'Author', normalizedName: 'author' }], publicationStatus: 'unknown' as const, bibtex: '', sourceProviders: [], versions: [] };
const evidence = makeEvidence('a', paper, 'Metadata');

describe('Phase 7 comparison and verification MCP boundary', () => {
  it('serializes compare_papers evidence and differences', async () => {
    const { server, handlers } = capture();
    registerTools(server as any, {
      comparePapers: vi.fn().mockResolvedValue({
        summary: 'Compared papers. [Author]',
        data: { paperIds: ['a', 'b'], differences: [{ field: 'year', left: '2020', right: '2021' }], benchmarkComparability: 'UNKNOWN' },
        evidence: [evidence], references: [{ paperId: 'a', title: 'Paper', authors: [{ name: 'Author', normalizedName: 'author' }], publicationStatus: 'unknown', bibtex: '', sourceProviders: [], versions: [] }],
        transparency: { expandedQueries: [], sourcesSearched: ['local database'], candidates: 2, retrievedAt: 'now', rankingRationale: [] }
      })
    } as any);
    const response = await handlers.get('compare_papers')!({ left_paper_id: 'a', right_paper_id: 'b' });
    expect(response.structuredContent.evidence).toEqual([evidence]);
    expect(response.content[0].text).toContain('Compared papers.');
  });

  it('serializes verify_claim status and conflicts', async () => {
    const { server, handlers } = capture();
    registerTools(server as any, {
      verifyClaim: vi.fn().mockResolvedValue({
        summary: 'Claim verification is CONTRADICTED.',
        data: { claim: { claimId: 'c' }, status: 'CONTRADICTED', conflicts: [{ claimKey: 'x' }] },
        evidence: [evidence], references: [{ paperId: 'a', title: 'Paper', authors: [{ name: 'Author', normalizedName: 'author' }], publicationStatus: 'unknown', bibtex: '', sourceProviders: [], versions: [] }],
        transparency: { expandedQueries: [], sourcesSearched: ['local claim store'], candidates: 2, retrievedAt: 'now', rankingRationale: [] }
      })
    } as any);
    const response = await handlers.get('verify_claim')!({ claim_id: 'c' });
    expect(response.structuredContent.data.status).toBe('CONTRADICTED');
    expect(response.content[0].text).toContain('CONTRADICTED');
  });
});
