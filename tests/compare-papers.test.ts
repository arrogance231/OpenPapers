import { describe, expect, it } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import { ResearchService } from '../src/research/service.js';

const work = (paperId: string, title: string, year: number) => ({paperId,title,year,authors:[],publicationStatus:'conference' as const,bibtex:'',sourceProviders:['fixture'],versions:[]});

describe('paper comparison', () => {
  it('compares verified local metadata and keeps benchmark comparability explicit', async () => {
    const db = new ResearchDb(':memory:');
    await db.upsertWork(work('a','Paper A',2020)); await db.upsertWork({...work('b','Paper B',2021),venue:'NeurIPS'});
    const response = await new ResearchService(db).comparePapers('a','b');
    expect(response.data.paperIds).toEqual(['a','b']);
    expect(response.data.differences).toContainEqual({field:'title',left:'Paper A',right:'Paper B'});
    expect(response.data.benchmarkComparability).toBe('UNKNOWN');
    expect(response.evidence).toHaveLength(2);
    expect(response.summary).toContain(response.evidence[0]!.citationText);
  });
});