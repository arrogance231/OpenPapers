import { describe, expect, it } from 'vitest';
import { author, citationText, isValidDoi, makeEvidence, normalizeArxivId, normalizeDoi, paperId } from '../src/research/citations.js';
import type { ResearchWork } from '../src/models/research.js';
import { CrossrefProvider } from '../src/providers/crossref.js';
import { mapOpenAlexWork } from '../src/providers/openalex.js';
import { mapSemanticScholarPaper } from '../src/providers/semantic-scholar.js';
import { ArxivProvider } from '../src/providers/arxiv.js';

describe('citation and canonicalization invariants', () => {
  it('normalizes DOI and arXiv version identifiers',()=>{
    expect(normalizeDoi('HTTP://DX.DOI.ORG/10.1234/ABC.')).toBe('10.1234/abc');
    expect(normalizeArxivId('https://arxiv.org/abs/2301.01234v2')).toBe('2301.01234');
  });
  it('maps all supported DOI aliases to one canonical value', () => {
    const aliases = ['10.1234/ABC', ' doi:10.1234/ABC ', 'DOI: 10.1234/ABC', 'https://doi.org/10.1234/ABC', 'http://doi.org/10.1234/ABC', 'https://dx.doi.org/10.1234/ABC'];
    expect(new Set(aliases.map(normalizeDoi))).toEqual(new Set(['10.1234/abc']));
    expect(new Set(aliases.map(value => paperId('Paper', [], value)))).toHaveLength(1);
  });
  it('rejects invalid DOI-like values without treating them as identity', () => {
    expect(isValidDoi('not-a-doi')).toBe(false);
    expect(isValidDoi('https://doi.org/not-a-doi')).toBe(false);
    expect(() => normalizeDoi('not-a-doi')).toThrow(/invalid DOI/);
  });
  it('normalizes arXiv abs, pdf, www, prefix, and revision forms', () => {
    const aliases = ['arXiv:1706.03762', '1706.03762', '1706.03762v1', '1706.03762v7', 'https://arxiv.org/abs/1706.03762v7', 'https://www.arxiv.org/pdf/1706.03762v1.pdf'];
    expect(new Set(aliases.map(normalizeArxivId))).toEqual(new Set(['1706.03762']));
  });
  it('reconciles overlapping provider identifiers to one work identity', () => {
    const canonical = paperId('A Paper', [author('Alice Smith')], '10.1234/abc');
    const openalex = mapOpenAlexWork({title:'A Paper', authorships:[{author:{display_name:'Alice Smith'}}], doi:'https://doi.org/10.1234/ABC'});
    const semantic = mapSemanticScholarPaper({paperId:'S1', title:'A Paper', authors:[{name:'Alice Smith'}], externalIds:{DOI:'DOI: 10.1234/ABC'}});
    expect(openalex?.paperId).toBe(canonical);
    expect(semantic?.paperId).toBe(canonical);
    expect(openalex?.doi).toBe('10.1234/abc');
    expect(semantic?.doi).toBe('10.1234/abc');
  });
  it('creates the same canonical ID for equivalent arXiv forms', () => {
    const a = [author('Geoffrey Hinton')];
    expect(paperId('A Paper', a, undefined, '2301.01234v1')).toBe(paperId('A Paper', a, undefined, '2301.01234'));
  });
  it('rejects a malformed Crossref success envelope instead of treating it as no results', async () => {
    const provider=new CrossrefProvider(async()=>new Response('{}',{status:200}));
    await expect(provider.search('paper')).rejects.toThrow(/invalid Crossref response/);
  });
  it('rejects malformed successful arXiv XML instead of treating it as no results', async () => {
    await expect(new ArxivProvider(async () => new Response('<html>not arxiv</html>', {status:200})).search('paper')).rejects.toThrow(/invalid arXiv response/);
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
