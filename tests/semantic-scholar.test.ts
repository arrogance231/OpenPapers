import { describe, expect, it } from 'vitest';
import { mapSemanticScholarPaper } from '../src/providers/semantic-scholar.js';

describe('Semantic Scholar provider mapping', () => {
  it('maps graph metadata and external identifiers without losing authors', () => {
    const work = mapSemanticScholarPaper({ paperId:'S2-1', title:'A Distillation Paper', authors:[{name:'Alice Smith'},{name:'Bob Jones'}], year:2024, venue:'MLConf', citationCount:12, externalIds:{ArXiv:'2401.00001', DOI:'10.1000/TEST'}, url:'https://semanticscholar.org/paper/S2-1', openAccessPdf:{url:'https://example.org/p.pdf'} });
    expect(work?.semanticScholarId).toBe('S2-1');
    expect(work?.arxivId).toBe('2401.00001');
    expect(work?.doi).toBe('10.1000/test');
    expect(work?.authors).toHaveLength(2);
    expect(work?.pdfUrl).toBe('https://example.org/p.pdf');
  });
});
