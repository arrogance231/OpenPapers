import { describe, expect, it } from 'vitest';
import { mapSemanticScholarPaper, SemanticScholarProvider } from '../src/providers/semantic-scholar.js';

describe('Semantic Scholar provider mapping', () => {
  it('maps graph metadata and external identifiers without losing authors', () => {
    const work = mapSemanticScholarPaper({ paperId:'S2-1', title:'A Distillation Paper', authors:[{name:'Alice Smith'},{name:'Bob Jones'}], year:2024, venue:'MLConf', citationCount:12, externalIds:{ArXiv:'2401.00001', DOI:'10.1000/TEST'}, url:'https://semanticscholar.org/paper/S2-1', openAccessPdf:{url:'https://example.org/p.pdf'} });
    expect(work?.semanticScholarId).toBe('S2-1');
    expect(work?.arxivId).toBe('2401.00001');
    expect(work?.doi).toBe('10.1000/test');
    expect(work?.authors).toHaveLength(2);
    expect(work?.pdfUrl).toBe('https://example.org/p.pdf');
  });
  it('maps reference and citation edges from nested graph payloads', async () => {
    const requested:string[]=[]; const paper={paperId:'S2-2',title:'Neighbor',authors:[{authorId:'A-1',name:'Carol Lee'}],year:2023,externalIds:{DOI:'10.1000/N'}};
    const provider=new SemanticScholarProvider(async (input) => { requested.push(String(input)); const field=String(input).includes('/citations')?'citingPaper':'citedPaper'; return new Response(JSON.stringify({data:[{[field]:paper}]}),{status:200,headers:{'content-type':'application/json'}}); });
    expect((await provider.getReferences('S2-1'))[0]?.title).toBe('Neighbor');
    expect((await provider.getCitations('S2-1'))[0]?.semanticScholarId).toBe('S2-2');
    expect(new URL(requested[0]!).searchParams.get('fields')).toContain('citedPaper.title');
    expect(mapSemanticScholarPaper(paper)?.authorIds).toEqual(['A-1']);
  });
  it('maps recommendations and author profiles with source identifiers', async () => {
    const paper={paperId:'S2-3',title:'Related',authors:[{name:'Dana Kim'}]};
    const relatedProvider=new SemanticScholarProvider(async () => new Response(JSON.stringify({recommendedPapers:[paper]}),{status:200}));
    expect((await relatedProvider.getRelated('S2-1'))[0]?.semanticScholarId).toBe('S2-3');
    const authorProvider=new SemanticScholarProvider(async () => new Response(JSON.stringify({authorId:'A-1',name:'Dana Kim',aliases:['D. Kim'],papers:[{paperId:'S2-3'}]}),{status:200}));
    const profile=await authorProvider.resolveAuthor('A-1');
    expect(profile?.papers?.[0]?.paperId).toBe('S2-3');
  });
});
