import { describe, expect, it } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import { ResearchService } from '../src/research/service.js';
import { makeWork } from './helpers.js';

const arxivWork = makeWork({ title: 'LoRA: Low-Rank Adaptation of Large Language Models', arxivId: '2106.09685', doi: '10.48550/arxiv.2106.09685' });
const crossrefWork = makeWork({ title: 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model', doi: '10.48550/arxiv.2305.18290' });

function serviceWith(overrides: { arxiv?: any; crossref?: any }): ResearchService {
  const arxiv = { search: async () => [], searchById: async () => undefined, ...overrides.arxiv };
  const crossref = { search: async () => [], getByDoi: async () => undefined, ...overrides.crossref };
  return new ResearchService(new ResearchDb(':memory:'), arxiv as any, crossref as any, { search: async () => [] } as any, { search: async () => [] } as any);
}

describe('identifier-shaped query probing', () => {
  it('probes arXiv ids and ranks the confirmed target first', async () => {
    let probedWith: string | undefined;
    const service = serviceWith({ arxiv: { searchById: async (id: string) => { probedWith = id; return [arxivWork]; } } });
    const response = await service.search('arXiv:2106.09685', 10);
    expect(probedWith).toBe('2106.09685');
    expect(response.data[0]?.paperId).toBe(arxivWork.paperId);
    expect(response.data[0]?.arxivId).toBe('2106.09685');
  });

  it('probes bare arXiv id strings and arXiv URLs', async () => {
    let calls = 0;
    const service = serviceWith({ arxiv: { searchById: async () => { calls += 1; return [arxivWork]; } } });
    await service.search('2106.09685', 10);
    await service.search('https://arxiv.org/abs/2106.09685', 10);
    expect(calls).toBe(2);
  });

  it('probes DOI strings and URLs through Crossref and ranks the target first', async () => {
    let probedDoi: string | undefined;
    const service = serviceWith({ crossref: { getByDoi: async (doi: string) => { probedDoi = doi; return crossrefWork; } } });
    const response = await service.search('https://doi.org/10.48550/arXiv.2305.18290', 10);
    expect(probeDoiNormalized(probedDoi)).toBe('10.48550/arxiv.2305.18290');
    expect(response.data[0]?.paperId).toBe(crossrefWork.paperId);
    expect(response.transparency.providerFailures ?? []).toEqual([]);
  });

  it('surfaces probe failures transparently without breaking the search', async () => {
    const service = serviceWith({ arxiv: { searchById: async () => { throw new Error('probe down'); } } });
    const response = await service.search('2106.09685', 10);
    expect(response.data).toEqual([]);
    expect(response.transparency.providerFailures?.some(failure => failure.startsWith('arxiv_id_probe:'))).toBe(true);
  });

  it('does not probe ordinary keyword queries', async () => {
    let probed = false;
    const service = serviceWith({ arxiv: { searchById: async () => { probed = true; return []; } } });
    await service.search('low rank adaptation of large language models', 10);
    expect(probed).toBe(false);
  });
});

function probeDoiNormalized(value: string | undefined): string { return (value ?? '').toLowerCase(); }
