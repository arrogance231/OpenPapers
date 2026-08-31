import { describe, expect, it } from 'vitest';
import { validateCitationIntegrity } from '../src/research/verification.js';
import type { Evidence, ResearchResponse } from '../src/models/research.js';

describe('citation integrity', () => {
  const evidence: Evidence = { evidenceId:'ev_1', sourceId:'paper_1', authors:[{name:'A Author', normalizedName:'a author'}], title:'Paper', year:2025, identifiers:{arxiv:'2501.00001'}, locator:{page:3, section:'2'}, evidenceType:'DIRECT', sourceQuality:'A', evidence:'The authors use KL divergence.', citationText:'[A Author, 2025, §2, p. 3]' };
  it('accepts a response whose factual claim references existing evidence', () => {
    const response: ResearchResponse<{claims:string[]}> = { summary:'The authors use KL divergence [A Author, 2025, §2, p. 3].', data:{claims:['KL divergence']}, evidence:[evidence], references:[{paperId:'paper_1',title:'Paper',authors:evidence.authors,year:2025,arxivId:'2501.00001',publicationStatus:'preprint',bibtex:'',sourceProviders:['test'],versions:[]}], transparency:{expandedQueries:[],sourcesSearched:['test'],candidates:1,retrievedAt:new Date().toISOString(),rankingRationale:[]} };
    expect(validateCitationIntegrity(response)).toEqual({valid:true, errors:[]});
  });
  it('rejects factual claims when evidence is absent or unresolved', () => {
    const response = { summary:'The authors use temperature 2.', data:{claim:'temperature 2'}, evidence:[], references:[], transparency:{expandedQueries:[],sourcesSearched:[],candidates:0,retrievedAt:'',rankingRationale:[]} } as unknown as ResearchResponse<unknown>;
    const result = validateCitationIntegrity(response);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('evidence'))).toBe(true);
  });
});
