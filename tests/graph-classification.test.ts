import { describe, expect, it } from 'vitest';
import { classifyGraphRelationship } from '../src/research/service.js';
import type { ResearchWork } from '../src/models/research.js';

const work = (paperId: string, year?: number): ResearchWork => ({paperId,title:paperId,authors:[],...(year === undefined ? {} : {year}),publicationStatus:'unknown',bibtex:'',sourceProviders:['test'],versions:[]});

describe('provider-aware graph relationship classification', () => {
  it('uses explicit provider edge metadata when chronology is unavailable', () => {
    expect(classifyGraphRelationship(work('root'),work('target'),'reference',{explicitRelation:'reference'})).toBe('DIRECT');
  });
  it('rejects contradictory provider metadata rather than inferring a class', () => {
    expect(classifyGraphRelationship(work('root',2024),work('target',2020),'citation',{explicitRelation:'reference'})).toBe('UNKNOWN');
  });
});
