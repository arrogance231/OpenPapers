import { describe, expect, it, vi } from 'vitest';
import { ResearchService } from '../src/research/service.js';

describe('method comparison', () => {
  it('compares two bounded method searches and exposes overlap', async () => {
    const first = {paperId:'shared',title:'Shared',authors:[],publicationStatus:'unknown' as const,bibtex:'',sourceProviders:['fixture'],versions:[]};
    const service = new ResearchService(undefined, {search:vi.fn().mockResolvedValue([first])} as any, {search:vi.fn().mockResolvedValue([])} as any, {search:vi.fn().mockResolvedValue([])} as any, {search:vi.fn().mockResolvedValue([])} as any);
    const response = await service.compareMethods('method A','method B',3);
    expect(response.data.overlap).toEqual(['shared']);
    expect(response.data.benchmarkComparability).toBe('UNKNOWN');
    expect(response.evidence.length).toBeGreaterThan(0);
  });
  it('recognizes cross-provider identity by DOI when paper IDs differ', async () => {
    const left = {paperId:'arxiv-id',title:'Same Work',doi:'10.1234/example',authors:[],publicationStatus:'unknown' as const,bibtex:'',sourceProviders:['arxiv'],versions:[]};
    const right = {...left,paperId:'crossref-id',sourceProviders:['crossref']};
    const arxiv = {search:vi.fn().mockResolvedValueOnce([left]).mockResolvedValueOnce([])};
    const crossref = {search:vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([right])};
    const service = new ResearchService(undefined, arxiv as any, crossref as any, {search:vi.fn().mockResolvedValue([])} as any, {search:vi.fn().mockResolvedValue([])} as any);
    const response = await service.compareMethods('method A','method B',3);
    expect(response.data.overlap).toEqual(['arxiv-id']);
  });
});
