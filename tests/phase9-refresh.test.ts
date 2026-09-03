import { describe, expect, it, vi } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import { ResearchService } from '../src/research/service.js';
import { author, bibtex, paperId } from '../src/research/citations.js';
import type { ResearchWork } from '../src/models/research.js';
import { makeEvidence } from '../src/research/citations.js';

describe('paper refresh',()=>{
  it('refreshes a paper through its provider-native identifier',async()=>{
    const db=new ResearchDb(':memory:'); const authors=[author('Alice Smith')];
    const paper:ResearchWork={paperId:paperId('Paper A',authors,undefined,'2501.00001'),title:'Paper A',authors,year:2025,arxivId:'2501.00001',semanticScholarId:'s2-a',publicationStatus:'preprint',bibtex:'',sourceProviders:['semantic_scholar'],versions:[]}; paper.bibtex=bibtex(paper); await db.upsertWork(paper);
    const updated={...paper,title:'Paper A Updated',bibtex:paper.bibtex}; const semantic={getPaper:vi.fn().mockResolvedValue(updated)};
    const outcome=await new ResearchService(db,undefined as any,undefined as any,undefined as any,semantic as any).refreshPaper(paper.paperId);
    expect(outcome.status).toBe('REFRESHED'); expect((await db.getWork(paper.paperId))?.title).toBe('Paper A Updated'); expect(semantic.getPaper).toHaveBeenCalledWith('s2-a'); await db.close();
  });
  it('reports unavailable when no refresh identifier exists',async()=>{ const db=new ResearchDb(':memory:'); const service=new ResearchService(db); await expect(service.refreshPaper('missing')).rejects.toThrow('NOT_FOUND'); await db.close(); });
  it('migrates every paper reference atomically when refresh improves its identity', async () => {
    const db = new ResearchDb(':memory:');
    const paper: ResearchWork = {paperId:'temporary-a', title:'Paper A', authors:[], semanticScholarId:'s2-a', publicationStatus:'preprint', bibtex:'', sourceProviders:['semantic_scholar'], versions:[]};
    const canonical: ResearchWork = {...paper, paperId:'canonical-b', title:'Paper A (canonical)', doi:'10.1000/paper-a'};
    await db.upsertWork(paper);
    const collection = await db.createCollection('refresh migration');
    await db.addToCollection(collection.id, paper.paperId);
    await db.addEvidence(makeEvidence(paper.paperId, paper, 'metadata'), paper.paperId);
    await db.saveClaim({claimId:'migration-claim',claimKey:'migration',kind:'methodology',statement:'method',sourceUrl:paper.paperId,locator:{section:'Method'},confidence:'heuristic',evidenceType:'DERIVED',evidence:makeEvidence(paper.paperId,paper,'method')} as any);
    await db.upsertGraphEdge({sourcePaperId:'root', targetPaperId:paper.paperId, relation:'reference', relationshipClass:'DIRECT', provider:'test', evidenceId:'ev', retrievedAt:'2026-09-03T00:00:00.000Z'});
    await db.migrateWorkIdentity(paper.paperId, canonical);
    expect(await db.getWork('temporary-a')).toEqual(canonical);
    expect(await db.getWork('canonical-b')).toEqual(canonical);
    expect((await db.getCollection(collection.id))?.paperIds).toEqual(['canonical-b']);
    expect((await db.getEvidenceForPaper('canonical-b'))[0]?.sourceId).toBe('canonical-b');
    expect((await db.getClaim('migration-claim'))?.evidence.sourceId).toBe('canonical-b');
    expect((await db.getGraphEdges('root'))[0]?.targetPaperId).toBe('canonical-b');
    await db.close();
  });
});