import { describe, expect, it } from 'vitest';
import { DeterministicPaperExtractor, type PaperExtractor } from '../src/extraction/extractor.js';
import type { ParsedDocument } from '../src/ingestion/document.js';

describe('provider-independent paper extractor interface', () => {
  it('runs the deterministic extractor through the shared contract', async () => {
    const document: ParsedDocument = {format:'html',url:'https://example.com/paper',sections:[{level:1,heading:'Method',text:'We train a model.',page:2}],references:[],warnings:[]};
    const extractor: PaperExtractor<unknown> = new DeterministicPaperExtractor();
    expect(await extractor.extract(document)).toMatchObject([{kind:'methodology',sourceUrl:document.url,confidence:'heuristic'}]);
    expect(extractor.name).toBe('deterministic');
  });
  it('permits an injected extractor without provider coupling', async () => {
    const document: ParsedDocument = {format:'html',url:'https://example.com/paper',sections:[],references:[],warnings:[]};
    const extractor: PaperExtractor<string> = {name:'test',extract:async input=>input.url};
    expect(await extractor.extract(document)).toBe(document.url);
  });
});
