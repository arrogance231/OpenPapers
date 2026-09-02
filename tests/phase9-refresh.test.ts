import { describe, expect, it, vi } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import { ResearchService } from '../src/research/service.js';
import { author, bibtex, paperId } from '../src/research/citations.js';
import type { ResearchWork } from '../src/models/research.js';

describe('paper refresh',()=>{
  it('refreshes a paper through its provider-native identifier',async()=>{
    const db=new ResearchDb(':memory:'); const authors=[author('Alice Smith')];
    const paper:ResearchWork={paperId:paperId('Paper A',authors,undefined,'2501.00001'),title:'Paper A',authors,year:2025,arxivId:'2501.00001',semanticScholarId:'s2-a',publicationStatus:'preprint',bibtex:'',sourceProviders:['semantic_scholar'],versions:[]}; paper.bibtex=bibtex(paper); await db.upsertWork(paper);
    const updated={...paper,title:'Paper A Updated',bibtex:paper.bibtex}; const semantic={getPaper:vi.fn().mockResolvedValue(updated)};
    const outcome=await new ResearchService(db,undefined as any,undefined as any,undefined as any,semantic as any).refreshPaper(paper.paperId);
    expect(outcome.status).toBe('REFRESHED'); expect((await db.getWork(paper.paperId))?.title).toBe('Paper A Updated'); expect(semantic.getPaper).toHaveBeenCalledWith('s2-a'); await db.close();
  });
  it('reports unavailable when no refresh identifier exists',async()=>{ const db=new ResearchDb(':memory:'); const service=new ResearchService(db); await expect(service.refreshPaper('missing')).rejects.toThrow('NOT_FOUND'); await db.close(); });
});