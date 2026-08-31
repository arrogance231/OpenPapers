import { describe, expect, it } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import { author, bibtex, paperId } from '../src/research/citations.js';
import type { ResearchWork } from '../src/models/research.js';

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
});
