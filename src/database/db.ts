import { DatabaseSync } from 'node:sqlite';
import type { ResearchWork, Evidence } from '../models/research.js';

export class ResearchDb {
  private db: DatabaseSync;
  constructor(path = process.env.RESEARCH_DB_PATH ?? ':memory:') { this.db = new DatabaseSync(path); this.db.exec('PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS works (paper_id TEXT PRIMARY KEY, data TEXT NOT NULL, title TEXT NOT NULL, doi TEXT, arxiv_id TEXT, year INTEGER); CREATE TABLE IF NOT EXISTS evidence (evidence_id TEXT PRIMARY KEY, source_id TEXT NOT NULL, paper_id TEXT NOT NULL, data TEXT NOT NULL); CREATE VIRTUAL TABLE IF NOT EXISTS works_fts USING fts5(paper_id UNINDEXED, title, abstract);'); }
  upsertWork(work: ResearchWork): void { this.db.prepare('INSERT INTO works(paper_id,data,title,doi,arxiv_id,year) VALUES(?,?,?,?,?,?) ON CONFLICT(paper_id) DO UPDATE SET data=excluded.data,title=excluded.title,doi=excluded.doi,arxiv_id=excluded.arxiv_id,year=excluded.year').run(work.paperId, JSON.stringify(work), work.title, work.doi ?? null, work.arxivId ?? null, work.year ?? null); this.db.prepare('DELETE FROM works_fts WHERE paper_id=?').run(work.paperId); this.db.prepare('INSERT INTO works_fts(paper_id,title,abstract) VALUES(?,?,?)').run(work.paperId, work.title, work.abstract ?? ''); }
  addEvidence(e: Evidence, paperId: string): void { this.db.prepare('INSERT OR REPLACE INTO evidence(evidence_id,source_id,paper_id,data) VALUES(?,?,?,?)').run(e.evidenceId, e.sourceId, paperId, JSON.stringify(e)); }
  getWork(id: string): ResearchWork | undefined { const row = this.db.prepare('SELECT data FROM works WHERE paper_id=? OR doi=? OR arxiv_id=?').get(id, id, id) as {data: string} | undefined; return row ? JSON.parse(row.data) as ResearchWork : undefined; }
  search(query: string, limit = 20): ResearchWork[] { const rows = this.db.prepare('SELECT data FROM works WHERE paper_id IN (SELECT paper_id FROM works_fts WHERE works_fts MATCH ? LIMIT ?)').all(query.replace(/["']/g, ' '), limit) as {data: string}[]; return rows.map(r => JSON.parse(r.data) as ResearchWork); }
  close(): void { this.db.close(); }
}
