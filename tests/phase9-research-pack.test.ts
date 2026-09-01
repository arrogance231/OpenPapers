import { describe, expect, it } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import { ResearchService } from '../src/research/service.js';
import { author, bibtex, paperId } from '../src/research/citations.js';
import type { ResearchWork } from '../src/models/research.js';

describe('ResearchPack export',()=>{
  it('exports a deterministic collection with resolved papers and evidence',()=>{
    const db=new ResearchDb(':memory:');
    const authors=[author('Alice Smith')];
    const paper:ResearchWork={paperId:paperId('Paper A',authors,undefined,'2501.00001'),title:'Paper A',authors,year:2025,abstract:'A study',arxivId:'2501.00001',publicationStatus:'preprint',bibtex:'',sourceProviders:['arxiv'],versions:[]}; paper.bibtex=bibtex(paper); db.upsertWork(paper);
    const collection=db.createCollection('reading list'); db.addToCollection(collection.id,paper.paperId);
    const pack=new ResearchService(db).buildResearchPack(collection.id);
    expect(pack).toEqual({format:'openpapers.research-pack.v1',collection:{id:collection.id,name:'reading list'},papers:[paper],evidence:[]});
    db.close();
  });
});
