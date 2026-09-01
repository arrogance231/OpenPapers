import { describe, expect, it } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import { author, bibtex, paperId } from '../src/research/citations.js';
import type { ResearchWork } from '../src/models/research.js';
import type { ParsedDocument } from '../src/ingestion/document.js';

describe('research database', () => {
  it('round-trips works and supports full-text search', () => {
    const db = new ResearchDb(':memory:');
    const authors = [author('Alice Smith')];
    const work: ResearchWork = { paperId: paperId('Knowledge Distillation', authors, undefined, '2501.00001'), title:'Knowledge Distillation', authors, year:2025, abstract:'teacher student language model', arxivId:'2501.00001', publicationStatus:'preprint', bibtex:'', sourceProviders:['arxiv'], versions:[] };
    work.bibtex = bibtex(work); db.upsertWork(work);
    expect(db.getWork(work.paperId)?.title).toBe('Knowledge Distillation');
    expect(db.search('teacher', 5)).toHaveLength(1);
    db.close();
  });
  it('round-trips graph edges and replaces duplicate provider edges', () => {
    const db = new ResearchDb(':memory:');
    const edge = {sourcePaperId:'work_a',targetPaperId:'work_b',relation:'reference' as const,relationshipClass:'DIRECT' as const,provider:'semantic_scholar',evidenceId:'ev_edge',retrievedAt:'2026-09-01T00:00:00.000Z'};
    db.upsertGraphEdge(edge); db.upsertGraphEdge({...edge,retrievedAt:'2026-09-01T00:01:00.000Z'});
    expect(db.getGraphEdges('work_a')).toEqual([{...edge,retrievedAt:'2026-09-01T00:01:00.000Z'}]);
    db.close();
  });
  it('round-trips parsed documents by URL and content hash', () => {
    const db = new ResearchDb(':memory:');
    const document: ParsedDocument = {format:'html',url:'https://example.com/paper',title:'Paper',sections:[{level:1,heading:'Intro',text:'Text'}],references:[],warnings:[]};
    db.saveParsedDocument(document, 'hash-a');
    expect(db.getParsedDocument(document.url, 'hash-a')).toEqual(document);
    expect(db.getParsedDocument(document.url, 'hash-b')).toBeUndefined();
    db.close();
  });
});
