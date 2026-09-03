import { describe, expect, it } from 'vitest';
import { author, citationText, makeEvidence, normalizeArxivId, normalizeDoi, paperId } from '../src/research/citations.js';
import type { ResearchWork } from '../src/models/research.js';
import { CrossrefProvider } from '../src/providers/crossref.js';

describe('citation and canonicalization invariants', () => {
  it('normalizes DOI and arXiv version identifiers',()=>{
    expect(normalizeDoi('HTTP://DX.DOI.ORG/10.1234/ABC.')).toBe('10.1234/abc');
    expect(normalizeArxivId('https://arxiv.org/abs/2301.01234v2')).toBe('2301.01234');
  });
  it('creates the same canonical ID for equivalent arXiv forms', () => {
    const a = [author('Geoffrey Hinton')];
    expect(paperId('A Paper', a, undefined, '2301.01234v1')).toBe(paperId('A Paper', a, undefined, '2301.01234'));
  });
  it('rejects a malformed Crossref success envelope instead of treating it as no results', async () => {
    const provider=new CrossrefProvider(async()=>new Response('{}',{status:200}));
    await expect(provider.search('paper')).rejects.toThrow(/invalid Crossref response/);
  });
  it('renders author and locator in evidence citation', () => {
    const work: ResearchWork = { paperId:'work_x', title:'A Paper', authors:[author('Alice Smith'), author('Bob Jones')], year:2025, arxivId:'2501.00001', publicationStatus:'preprint', bibtex:'', sourceProviders:['arxiv'], versions:[] };
    const evidence = makeEvidence('paper', work, 'temperature is 2', 'DIRECT', 'A', { page:7, section:'3.2 Training', table:'Table 2' });
    expect(evidence.citationText).toContain('Alice Smith, Bob Jones');
    expect(evidence.citationText).toContain('§3.2 Training');
    expect(evidence.citationText).toContain('p. 7');
    expect(evidence.evidenceType).toBe('DIRECT');
  });
  it('preserves every available provider identifier in evidence', () => {
    const work: ResearchWork = { paperId:'work_x', title:'A Paper', authors:[author('Alice Smith')], year:2025, doi:'10.1000/example', arxivId:'2501.00001', semanticScholarId:'S2-1', openAlexId:'https://openalex.org/W1', publicationStatus:'published', bibtex:'', sourceProviders:['crossref','arxiv','semantic_scholar','openalex'], versions:[] };
    expect(makeEvidence('paper', work, 'Metadata is available').identifiers).toEqual({ doi:'10.1000/example', arxiv:'2501.00001', semanticScholar:'S2-1', openAlex:'https://openalex.org/W1' });
  });
});
