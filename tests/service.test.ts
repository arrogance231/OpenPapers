import { describe, expect, it } from 'vitest';
import { ResearchService } from '../src/research/service.js';
import { ResearchDb } from '../src/database/db.js';
import type { ResearchWork } from '../src/models/research.js';

describe('provenance-first recipe behavior', () => {
  it('never guesses missing training parameters', () => {
    const work: ResearchWork = { paperId:'work_recipe', title:'Recipe Paper', authors:[], publicationStatus:'preprint', bibtex:'', sourceProviders:['test'], versions:[] };
    const service = new ResearchService(new ResearchDb(':memory:'));
    const response = service.recipe(work);
    expect(response.data.learning_rate).toEqual({value:null,status:'NOT_REPORTED'});
    expect(response.data.missing_information.length).toBeGreaterThan(0);
    expect(response.evidence[0]?.evidenceType).toBe('UNVERIFIED');
  });
  it('returns evidence-backed Semantic Scholar graph items', async () => {
    const work: ResearchWork = { paperId:'work_graph', title:'Graph Paper', authors:[], publicationStatus:'preprint', bibtex:'', sourceProviders:['semantic_scholar'], versions:[] };
    const service = new ResearchService(undefined, undefined, undefined, undefined, { getReferences: async () => [work], getCitations: async () => [], getRelated: async () => [], resolveAuthor: async () => undefined } as never);
    const result = await service.graph('S2-root', 'reference', 10);
    expect(result.data[0]?.relation).toBe('reference');
    expect(result.data[0]?.source).toBe('semantic_scholar');
    expect(result.data[0]?.evidence.sourceId).toBe(work.paperId);
    expect(result.references[0]?.paperId).toBe(work.paperId);
    expect(service.db.getGraphEdges('S2-root')).toEqual([expect.objectContaining({targetPaperId:work.paperId,relation:'reference',provider:'semantic_scholar',evidenceId:result.evidence[0]?.evidenceId})]);
  });
  it('resolves graph nodes to existing DOI lineage identities', async () => {
    const db = new ResearchDb(':memory:');
    const existing: ResearchWork = { paperId:'canonical_work', title:'Canonical', authors:[], doi:'10.1000/canonical', publicationStatus:'unknown', bibtex:'', sourceProviders:['crossref'], versions:[] };
    db.upsertWork(existing);
    const graphWork = {...existing, paperId:'semantic_work', sourceProviders:['semantic_scholar']};
    const service = new ResearchService(db, undefined, undefined, undefined, { getReferences: async () => [graphWork], getCitations: async () => [], getRelated: async () => [], resolveAuthor: async () => undefined } as never);
    await service.graph('root', 'reference');
    expect(service.db.getGraphEdges('root')[0]?.targetPaperId).toBe('canonical_work');
  });
});
