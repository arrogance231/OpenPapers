import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ResearchDb } from '../src/database/db.js';
import { author, bibtex, paperId } from '../src/research/citations.js';
import type { ResearchWork } from '../src/models/research.js';
import type { ParsedDocument } from '../src/ingestion/document.js';
import type { PaperClaim } from '../src/extraction/claims.js';

describe('research database', () => {
  it('round-trips works and supports full-text search', async () => {
    const db = new ResearchDb(':memory:');
    const authors = [author('Alice Smith')];
    const work: ResearchWork = { paperId: paperId('Knowledge Distillation', authors, undefined, '2501.00001'), title:'Knowledge Distillation', authors, year:2025, abstract:'teacher student language model', arxivId:'2501.00001', publicationStatus:'preprint', bibtex:'', sourceProviders:['arxiv'], versions:[] };
    work.bibtex = bibtex(work); await db.upsertWork(work);
    expect((await db.getWork(work.paperId))?.title).toBe('Knowledge Distillation');
    expect(await db.search('teacher', 5)).toHaveLength(1);
    await db.close();
  });
  it('round-trips graph edges and replaces duplicate provider edges', async () => {
    const db = new ResearchDb(':memory:');
    const edge = {sourcePaperId:'work_a',targetPaperId:'work_b',relation:'reference' as const,relationshipClass:'DIRECT' as const,provider:'semantic_scholar',evidenceId:'ev_edge',retrievedAt:'2026-09-01T00:00:00.000Z'};
    await db.upsertGraphEdge(edge); await db.upsertGraphEdge({...edge,retrievedAt:'2026-09-01T00:01:00.000Z'});
    expect(await db.getGraphEdges('work_a')).toEqual([{...edge,retrievedAt:'2026-09-01T00:01:00.000Z'}]);
    await db.close();
  });
  it('round-trips parsed documents by URL and content hash', async () => {
    const db = new ResearchDb(':memory:');
    const document: ParsedDocument = {format:'html',url:'https://example.com/paper',title:'Paper',sections:[{level:1,heading:'Intro',text:'Text'}],references:[],warnings:[]};
    await db.saveParsedDocument(document, 'hash-a');
    expect(await db.getParsedDocument(document.url, 'hash-a')).toEqual(document);
    expect(await db.getParsedDocument(document.url, 'hash-b')).toBeUndefined();
    await db.close();
  });
  it('persists claims and conflicts', async () => {
    const db = new ResearchDb(':memory:');
    const claim: PaperClaim = {claimId:'claim-a',claimKey:'loss|loss',kind:'loss',statement:'Uses KL.',sourceUrl:'https://example.com/paper',locator:{section:'Loss'},confidence:'heuristic',evidenceType:'DERIVED',evidence:{evidenceId:'evidence-a',sourceId:'https://example.com/paper',authors:[],title:'Loss claim',identifiers:{},locator:{section:'Loss'},evidenceType:'DERIVED',sourceQuality:'C',evidence:'Uses KL.',citationText:'https://example.com/paper#Loss'}};
    const conflict = {claimKey:'loss|loss',selectedClaimId:'claim-a',alternateClaimId:'claim-b',selectedStatement:'Uses KL.',alternateStatement:'Uses CE.'};
    await db.saveClaim(claim); await db.saveClaimConflict(conflict);
    expect(await db.getClaims()).toEqual([claim]);
    expect(await db.getClaimConflicts()).toEqual([conflict]);
    await db.close();
  });
  it('persists named collections and paper membership', async () => {
    const db = new ResearchDb(':memory:');
    const collection = await db.createCollection('distillation');
    await db.addToCollection(collection.id, 'paper-a');
    await db.addToCollection(collection.id, 'paper-a');
    await db.addToCollection(collection.id, 'paper-b');
    expect(await db.getCollection(collection.id)).toEqual({id:collection.id,name:'distillation',paperIds:['paper-a','paper-b']});
    expect(await db.listCollections()).toEqual([{id:collection.id,name:'distillation',paperIds:['paper-a','paper-b']}]);
    await db.removeFromCollection(collection.id, 'paper-a');
    expect((await db.getCollection(collection.id))?.paperIds).toEqual(['paper-b']);
    await db.deleteCollection(collection.id);
    expect(await db.getCollection(collection.id)).toBeUndefined();
    await db.close();
  });
  it('records an idempotent schema version for file-backed databases', async () => {
    const directory=mkdtempSync(join(tmpdir(),'openpapers-'));
    const path=join(directory,'research.sqlite');
    const first=new ResearchDb(path); expect(first.schemaVersion()).toBe(2); first.close();
    const second=new ResearchDb(path); expect(second.schemaVersion()).toBe(2); second.close();
    rmSync(directory,{recursive:true,force:true});
  });
  it('creates missing parent directories for file-backed databases', async () => {
    const directory=mkdtempSync(join(tmpdir(),'openpapers-')); const path=join(directory,'nested','research.sqlite');
    const db=new ResearchDb(path); expect(db.schemaVersion()).toBe(2); db.close(); rmSync(directory,{recursive:true,force:true});
  });
  it('upgrades a legacy graph schema through the ordered migration', async () => {
    const directory=mkdtempSync(join(tmpdir(),'openpapers-')); const path=join(directory,'legacy.sqlite');
    const legacy=new DatabaseSync(path); legacy.exec('CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY); CREATE TABLE graph_edges (source_paper_id TEXT NOT NULL,target_paper_id TEXT NOT NULL,relation TEXT NOT NULL,provider TEXT NOT NULL,evidence_id TEXT NOT NULL,retrieved_at TEXT NOT NULL,PRIMARY KEY(source_paper_id,target_paper_id,relation,provider));'); legacy.close();
    const db=new ResearchDb(path); expect(db.schemaVersion()).toBe(2); await db.upsertGraphEdge({sourcePaperId:'a',targetPaperId:'b',relation:'reference',relationshipClass:'DIRECT',provider:'legacy',evidenceId:'e',retrievedAt:'2026-01-01T00:00:00.000Z'}); expect(await db.getGraphEdges()).toHaveLength(1); await db.close(); rmSync(directory,{recursive:true,force:true});
  });
});