import { describe, expect, it, vi } from 'vitest';
import { ResearchDb } from '../../src/database/db.js';
import { ResearchService } from '../../src/research/service.js';
import { PaperAcquirer } from '../../src/ingestion/acquisition.js';
import { createReliableFetcher } from '../../src/reliability/reliability.js';
import { registerTools } from '../../src/mcp/tools.js';
import { validateCitationIntegrity } from '../../src/research/verification.js';
import type { ResearchWork } from '../../src/models/research.js';

const author = (name = 'Ashish Vaswani') => ({name, normalizedName:name.toLowerCase()});
const work = (overrides: Partial<ResearchWork> = {}): ResearchWork => ({
  paperId: 'paper-1', title: 'Attention Is All You Need', authors: [author()], year: 2017,
  arxivId: '1706.03762', canonicalUrl: 'https://arxiv.org/abs/1706.03762',
  publicationStatus: 'preprint', bibtex: '@article{attention}', sourceProviders: ['arxiv'], versions: [], ...overrides
});
const capture = () => {
  const handlers = new Map<string, (args: any) => Promise<any>>();
  const server = {registerTool(name: string, _config: unknown, handler: (args: any) => Promise<any>) { handlers.set(name, handler); }};
  return {server, handlers};
};

describe('large adversarial full-flow campaign', () => {
  it('merges duplicate provider identity while preserving lineage and conflicts', async () => {
    const canonical = work();
    const duplicate = work({paperId:'openalex-1', sourceProviders:['openalex'], openAlexId:'https://openalex.org/W1', citationCount:42});
    const conflict = work({paperId:'conflict-1', sourceProviders:['crossref'], year:2018, doi:'10.0000/conflicting'});
    const service = new ResearchService(new ResearchDb(':memory:'),
      {search:vi.fn().mockResolvedValue([canonical])} as any,
      {search:vi.fn().mockResolvedValue([conflict])} as any,
      {search:vi.fn().mockResolvedValue([duplicate])} as any,
      {search:vi.fn().mockRejectedValue(new Error('provider unavailable'))} as any);
    const result = await service.search('Attention Is All You Need', 10);
    expect(result.data.some(item => item.arxivId === '1706.03762')).toBe(true);
    expect(result.data.find(item => item.arxivId === '1706.03762')?.sourceProviders).toEqual(expect.arrayContaining(['arxiv','openalex']));
    expect(result.transparency.providerFailures).toEqual(expect.arrayContaining([expect.stringContaining('provider unavailable')]));
    expect(result.transparency.conflicts?.some(item => item.field === 'year')).toBe(true);
  });

  it('never emits a factual response with unresolved evidence', () => {
    const evidence = {evidenceId:'ev-1', sourceId:'missing', authors:[author()], title:'Attention Is All You Need', year:2017, identifiers:{arxiv:'1706.03762'}, evidenceType:'DIRECT' as const, sourceQuality:'A' as const, evidence:'metadata', citationText:'[Ashish Vaswani et al., 2017]'};
    const result = validateCitationIntegrity({summary:'A fact [Ashish Vaswani et al., 2017].', data:{claim:'method'}, evidence:[evidence], references:[], transparency:{expandedQueries:[],sourcesSearched:[],candidates:1,retrievedAt:'',rankingRationale:[]}} as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('evidence ev-1 references missing source missing');
  });

  it('keeps title-query ambiguity visible instead of claiming canonical identity', async () => {
    const sameTitle = work({paperId:'new-1', year:2025, arxivId:undefined, doi:'10.65215/example', sourceProviders:['openalex']});
    const service = new ResearchService(new ResearchDb(':memory:'),
      {search:vi.fn().mockResolvedValue([work()])} as any,
      {search:vi.fn().mockResolvedValue([])} as any,
      {search:vi.fn().mockResolvedValue([sameTitle])} as any,
      {search:vi.fn().mockResolvedValue([])} as any);
    const result = await service.search('Attention Is All You Need', 10);
    expect(result.data).toHaveLength(2);
    expect(result.data.some(item => item.arxivId === '1706.03762')).toBe(true);
  });

  it('does not merge identifier-free works merely because title and authors match', async () => {
    const first=work({paperId:'first',doi:undefined,arxivId:undefined,sourceProviders:['arxiv']});
    const second=work({paperId:'second',doi:undefined,arxivId:undefined,sourceProviders:['crossref']});
    const service=new ResearchService(new ResearchDb(':memory:'),{search:vi.fn().mockResolvedValue([first])} as any,{search:vi.fn().mockResolvedValue([second])} as any,{search:vi.fn().mockResolvedValue([])} as any,{search:vi.fn().mockResolvedValue([])} as any);
    const result=await service.search('Attention Is All You Need',10);
    expect(result.data.map(item=>item.paperId)).toEqual(['first','second']);
  });
  it('keeps same-DOI conflicts as one reference identity', async () => {
    const first = work({paperId:'doi-work', doi:'10.1000/same', arxivId:undefined, title:'Attention Is All You Need'});
    const conflicting = work({paperId:'doi-work', doi:'10.1000/same', arxivId:undefined, title:'A Different Work With A Conflicting DOI', sourceProviders:['crossref']});
    const service = new ResearchService(new ResearchDb(':memory:'),
      {search:vi.fn().mockResolvedValue([first])} as any,
      {search:vi.fn().mockResolvedValue([conflicting])} as any,
      {search:vi.fn().mockResolvedValue([])} as any,
      {search:vi.fn().mockResolvedValue([])} as any);
    const result = await service.search('Attention Is All You Need', 10);
    expect(new Set(result.references.map(item => item.paperId)).size).toBe(result.references.length);
    expect(validateCitationIntegrity(result).valid).toBe(true);
    expect(result.transparency.conflicts?.some(item => item.field === 'title')).toBe(true);
  });

  it('degrades independently when one provider fails and retains successful evidence', async () => {
    const service = new ResearchService(new ResearchDb(':memory:'),
      {search:vi.fn().mockResolvedValue([work()])} as any,
      {search:vi.fn().mockRejectedValue(new Error('HTTP 429: rate limit'))} as any,
      {search:vi.fn().mockResolvedValue([])} as any,
      {search:vi.fn().mockRejectedValue(new Error('timeout'))} as any);
    const result = await service.search('attention', 5);
    expect(result.data).toHaveLength(1);
    expect(result.evidence[0]?.sourceId).toBe('paper-1');
    expect(result.summary).toContain(result.evidence[0]!.citationText);
    expect(result.transparency.providerFailures).toEqual(expect.arrayContaining([expect.stringContaining('rate limit'), expect.stringContaining('timeout')]));
  });

  it('rejects unsafe, redirected, compressed, and oversized acquisitions', async () => {
    const neverFetch = vi.fn(async () => { throw new Error('network should not be reached'); });
    await expect(new PaperAcquirer(neverFetch).acquire('http://127.0.0.1/paper')).rejects.toThrow('unsafe host');
    const redirect = vi.fn(async () => new Response(null, {status:302, headers:{location:'http://localhost/private'}}));
    await expect(new PaperAcquirer(redirect).acquire('https://example.com/paper')).rejects.toThrow('unsafe host');
    const archive = vi.fn(async () => new Response(new Uint8Array([0x1f,0x8b]), {status:200}));
    await expect(new PaperAcquirer(archive).acquire('https://example.com/paper')).rejects.toThrow('archive or compressed');
    const large = vi.fn(async () => new Response('0123456789', {status:200}));
    await expect(new PaperAcquirer(large, {maxBytes:5}).acquire('https://example.com/paper')).rejects.toThrow('size limit');
  });

  it('does not cache private or authorization-bearing responses', async () => {
    let calls = 0;
    const fetcher = createReliableFetcher(async (_input, init) => { calls += 1; return new Response(`call-${calls}`, {status:200, headers:init?.headers as HeadersInit}); }, {cacheTtlMs:10_000});
    await fetcher('https://example.com/private', {headers:{authorization:'Bearer [REDACTED]'}});
    await fetcher('https://example.com/private', {headers:{authorization:'Bearer [REDACTED]'}});
    expect(calls).toBe(2);
    const privateResponse = createReliableFetcher(async () => new Response('private', {status:200, headers:{'cache-control':'private'}}), {cacheTtlMs:10_000});
    await privateResponse('https://example.com/private');
    await privateResponse('https://example.com/private');
    expect(calls).toBe(2);
  });

  it('keeps retry delays bounded for malformed and HTTP-date retry headers', async () => {
    const sleeps: number[] = [];
    let attempts = 0;
    const fetcher = createReliableFetcher(async () => {
      attempts += 1;
      return attempts === 1 ? new Response(null, {status:429, headers:{'retry-after':'not-a-date'}}) : new Response('ok');
    }, {maxRetries:1, baseDelayMs:7, sleep:async ms => {sleeps.push(ms);}, minIntervalMs:0});
    expect(await (await fetcher('https://example.com/retry')).text()).toBe('ok');
    expect(attempts).toBe(2);
    expect(sleeps.every(ms => ms >= 0 && ms < 60_000)).toBe(true);
  });

  it('caps adversarially large numeric Retry-After values', async () => {
    const sleeps: number[] = [];
    let attempts = 0;
    const fetcher = createReliableFetcher(async () => {
      attempts += 1;
      return attempts === 1 ? new Response(null, {status:429, headers:{'retry-after':'999999999'}}) : new Response('ok');
    }, {maxRetries:1, sleep:async ms => {sleeps.push(ms);}, minIntervalMs:0});
    await expect((await fetcher('https://example.com/huge-retry')).text()).resolves.toBe('ok');
    expect(sleeps[0]).toBeLessThanOrEqual(30_000);
  });

  it('returns get_paper provenance through the MCP handler after lookup', async () => {
    const {server, handlers} = capture();
    const paper = work();
    registerTools(server as any, {getPaper:vi.fn().mockResolvedValue(paper)} as any);
    const response = await handlers.get('get_paper')!({paper_id:paper.paperId});
    expect(response.isError).not.toBe(true);
    expect(response.structuredContent.data.paperId).toBe(paper.paperId);
    expect(response.structuredContent.evidence[0].sourceId).toBe(paper.paperId);
    expect(response.content[0].text).toContain('[Ashish Vaswani, 2017]');
  });

  it('turns uncaught tool dependency failures into sanitized MCP errors', async () => {
    const {server, handlers} = capture();
    registerTools(server as any, {search:vi.fn().mockRejectedValue(new Error('provider failed with token=secret-value'))} as any);
    const response = await handlers.get('search_papers')!({query:'attention',limit:5});
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('search_papers failed');
    expect(response.content[0].text).not.toContain('secret-value');
  });
  it('persists a collection round trip without deleting its paper', async () => {
    const db = new ResearchDb(':memory:');
    const paper = work();
    await db.upsertWork(paper);
    const collection = await db.createCollection('adversarial');
    await db.addToCollection(collection.id, paper.paperId);
    expect((await db.getCollection(collection.id))?.paperIds).toEqual([paper.paperId]);
    await db.deleteCollection(collection.id);
    expect(await db.getWork(paper.paperId)).toEqual(paper);
  });
});
