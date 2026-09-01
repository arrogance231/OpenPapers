import { describe, expect, it } from 'vitest';
import { extractPaperFacts } from '../src/extraction/heuristic.js';
import type { ParsedDocument } from '../src/ingestion/document.js';

describe('deterministic paper fact extraction', () => {
  it('extracts heading-classified facts and structured equations with provenance', () => {
    const document: ParsedDocument = {format:'html',url:'https://example.com/paper',sections:[
      {level:1,heading:'Method',text:'We train a student model with a teacher.' ,page:4,pageId:'p4'},
      {level:1,heading:'Loss Function',text:'The objective combines cross entropy and KL divergence.',page:5},
      {level:1,heading:'Datasets and Benchmarks',text:'We evaluate on WikiText and GLUE.',page:7},
      {level:1,heading:'Limitations',text:'The approach requires substantial compute.',page:9},
    ],references:[],warnings:[],equations:['L = L_ce + L_kl']};
    const facts = extractPaperFacts(document);
    expect(facts.map(fact => fact.kind)).toEqual(['methodology','loss','dataset','benchmark','limitation','equation']);
    expect(facts[0]).toMatchObject({kind:'methodology',text:'We train a student model with a teacher.',sourceUrl:document.url,locator:{section:'Method',page:4,pageId:'p4'},confidence:'heuristic'});
    expect(facts.at(-1)).toMatchObject({kind:'equation',text:'L = L_ce + L_kl',locator:{equation:'equation-0'}});
  });

  it('does not infer facts from unrelated headings', () => {
    const document: ParsedDocument = {format:'html',url:'https://example.com/paper',sections:[{level:1,heading:'Introduction',text:'This paper is interesting.'}],references:[],warnings:[]};
    expect(extractPaperFacts(document)).toEqual([]);
  });
});
