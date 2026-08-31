import { describe, expect, it } from 'vitest';
import { mapOpenAlexWork } from '../src/providers/openalex.js';

describe('OpenAlex provider mapping', () => {
  it('maps scholarly metadata and preserves all authors and OA links', () => {
    const work = mapOpenAlexWork({ id:'https://openalex.org/W1', doi:'https://doi.org/10.1000/Test', title:'A Distillation Paper', publication_year:2025, cited_by_count:42, authorships:[{author:{display_name:'Alice Smith',orcid:'https://orcid.org/1'}},{author:{display_name:'Bob Jones'}}], primary_location:{source:{display_name:'ML Journal'}}, best_oa_location:{landing_page_url:'https://example.org/paper',pdf_url:'https://example.org/paper.pdf'} });
    expect(work?.doi).toBe('10.1000/test');
    expect(work?.authors.map(a => a.name)).toEqual(['Alice Smith','Bob Jones']);
    expect(work?.openAlexId).toBe('https://openalex.org/W1');
    expect(work?.canonicalUrl).toBe('https://example.org/paper');
    expect(work?.citationCount).toBe(42);
    expect(work?.pdfUrl).toContain('.pdf');
  });
});
