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
});
