import { describe, expect, it } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import { ResearchService } from '../src/research/service.js';
import { author, bibtex, paperId } from '../src/research/citations.js';
import type { ResearchWork } from '../src/models/research.js';

describe('ResearchPack import',()=>{
  it('restores a validated pack into a local collection without remote calls',()=>{
    const sourceDb=new ResearchDb(':memory:'); const authors=[author('Alice Smith')];
    const paper:ResearchWork={paperId:paperId('Paper A',authors,undefined,'2501.00001'),title:'Paper A',authors,year:2025,abstract:'A study',arxivId:'2501.00001',publicationStatus:'preprint',bibtex:'',sourceProviders:['arxiv'],versions:[]}; paper.bibtex=bibtex(paper);
    const pack={format:'openpapers.research-pack.v1' as const,collection:{id:'ignored',name:'restored'},papers:[paper],evidence:[]};
    const targetDb=new ResearchDb(':memory:'); const collection=new ResearchService(targetDb).importResearchPack(pack);
    expect(collection.name).toBe('restored'); expect(targetDb.getWork(paper.paperId)).toEqual(paper); expect(targetDb.getCollection(collection.id)?.paperIds).toEqual([paper.paperId]); sourceDb.close(); targetDb.close();
  });
  it('rejects an unsupported pack format',()=>{ expect(()=>new ResearchService(new ResearchDb(':memory:')).importResearchPack({format:'unknown'} as any)).toThrow('unsupported ResearchPack format'); });
});
