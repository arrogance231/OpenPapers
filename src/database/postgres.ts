import { Pool, type PoolConfig } from 'pg';
import type { ResearchWork, Evidence, GraphEdge } from '../models/research.js';
import type { ParsedDocument } from '../ingestion/document.js';
import type { PaperClaim, ClaimConflict } from '../extraction/claims.js';
import type { Collection } from './db.js';
import type { ResearchStore } from './store.js';

type PostgresClient={query<Row=Record<string,unknown>>(text:string,parameters?:readonly unknown[]):Promise<{rows:Row[]}>;end?:()=>Promise<void>;close?:()=>Promise<void>};

export const POSTGRES_SCHEMA=`
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS works(paper_id text PRIMARY KEY,payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS evidence(evidence_id text PRIMARY KEY,paper_id text NOT NULL,payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS graph_edges(edge_key text PRIMARY KEY,source_paper_id text NOT NULL,payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS parsed_documents(cache_key text PRIMARY KEY,url text NOT NULL,content_hash text NOT NULL,payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS claims(claim_id text PRIMARY KEY,payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS claim_conflicts(conflict_key text PRIMARY KEY,payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS collections(collection_id text PRIMARY KEY,name text UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS collection_items(collection_id text NOT NULL,paper_id text NOT NULL,PRIMARY KEY(collection_id,paper_id));
CREATE TABLE IF NOT EXISTS vector_records(record_id text PRIMARY KEY,embedding vector NOT NULL,payload jsonb NOT NULL);
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='vector_records' AND column_name='embedding' AND udt_name='_float4') THEN
    ALTER TABLE vector_records ALTER COLUMN embedding TYPE vector USING ('['||array_to_string(embedding,',')||']')::vector;
  END IF;
END $$;
`;

export class PostgresResearchStore implements ResearchStore {
  private pending:Promise<void>=Promise.resolve();
  private readonly works=new Map<string,ResearchWork>(); private readonly evidence=new Map<string,{paperId:string;value:Evidence}>(); private readonly edges=new Map<string,GraphEdge>(); private readonly parsed=new Map<string,ParsedDocument>(); private readonly claims=new Map<string,PaperClaim>(); private readonly conflicts=new Map<string,ClaimConflict>(); private readonly collections=new Map<string,Collection>(); private readonly vectors=new Map<string,{embedding:number[];payload:unknown}>();
  private constructor(private readonly pool:PostgresClient){}
  static fromConfig(config:PoolConfig|string|undefined=process.env.DATABASE_URL){if(!config)throw new Error('DATABASE_URL is required for PostgreSQL'); return new PostgresResearchStore(new Pool(typeof config==='string'?{connectionString:config}:config));}
  static fromQueryClient(client:PostgresClient):PostgresResearchStore{return new PostgresResearchStore(client);}
  async initialize():Promise<void>{await this.pool.query(POSTGRES_SCHEMA); const [works,evidence,edges,parsed,claims,conflicts,collections,items,vectors]=await Promise.all([this.pool.query<any>('SELECT paper_id,payload FROM works'),this.pool.query<any>('SELECT evidence_id,paper_id,payload FROM evidence'),this.pool.query<any>('SELECT edge_key,payload FROM graph_edges'),this.pool.query<any>('SELECT cache_key,payload FROM parsed_documents'),this.pool.query<any>('SELECT claim_id,payload FROM claims'),this.pool.query<any>('SELECT conflict_key,payload FROM claim_conflicts'),this.pool.query<any>('SELECT collection_id,name FROM collections'),this.pool.query<any>('SELECT collection_id,paper_id FROM collection_items'),this.pool.query<any>('SELECT record_id,embedding,payload FROM vector_records')]); works.rows.forEach((x:any)=>this.works.set(x.paper_id,x.payload)); evidence.rows.forEach((x:any)=>this.evidence.set(x.evidence_id,{paperId:x.paper_id,value:x.payload})); edges.rows.forEach((x:any)=>this.edges.set(x.edge_key,x.payload)); parsed.rows.forEach((x:any)=>this.parsed.set(x.cache_key,x.payload)); claims.rows.forEach((x:any)=>this.claims.set(x.claim_id,x.payload)); conflicts.rows.forEach((x:any)=>this.conflicts.set(x.conflict_key,x.payload)); collections.rows.forEach((x:any)=>this.collections.set(x.collection_id,{id:x.collection_id,name:x.name,paperIds:[]})); items.rows.forEach((x:any)=>this.collections.get(x.collection_id)?.paperIds.push(x.paper_id)); vectors.rows.forEach((x:any)=>this.vectors.set(x.record_id,{embedding:x.embedding,payload:x.payload}));}
  private write(promise:Promise<unknown>):void{this.pending=this.pending.then(()=>promise.then(()=>undefined));}
  async flush():Promise<void>{await this.pending;}
  upsertWork(w:ResearchWork):void{this.works.set(w.paperId,w);this.write(this.pool.query('INSERT INTO works(paper_id,payload) VALUES($1,$2) ON CONFLICT(paper_id) DO UPDATE SET payload=excluded.payload',[w.paperId,w]));}
  getWork(id:string):ResearchWork|undefined{return this.works.get(id);}
  search(q:string,limit=10):ResearchWork[]{const needle=q.toLowerCase();return [...this.works.values()].filter(w=>`${w.title} ${w.abstract??''}`.toLowerCase().includes(needle)).sort((a,b)=>a.paperId.localeCompare(b.paperId)).slice(0,limit);}
  addEvidence(e:Evidence,paperId:string):void{this.evidence.set(e.evidenceId,{paperId,value:e});this.write(this.pool.query('INSERT INTO evidence(evidence_id,paper_id,payload) VALUES($1,$2,$3) ON CONFLICT(evidence_id) DO UPDATE SET paper_id=excluded.paper_id,payload=excluded.payload',[e.evidenceId,paperId,e]));}
  getEvidenceForPaper(id:string):Evidence[]{return [...this.evidence.values()].filter(x=>x.paperId===id).map(x=>x.value).sort((a,b)=>a.evidenceId.localeCompare(b.evidenceId));}
  upsertGraphEdge(e:GraphEdge):void{const key=[e.sourcePaperId,e.targetPaperId,e.relation,e.provider].join('|');this.edges.set(key,e);this.write(this.pool.query('INSERT INTO graph_edges(edge_key,source_paper_id,payload) VALUES($1,$2,$3) ON CONFLICT(edge_key) DO UPDATE SET payload=excluded.payload',[key,e.sourcePaperId,e]));}
  getGraphEdges(source?:string):GraphEdge[]{return [...this.edges.values()].filter(e=>!source||e.sourcePaperId===source).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));}
  saveParsedDocument(d:ParsedDocument,h:string):void{this.parsed.set(`${d.url}|${h}`,d);this.write(this.pool.query('INSERT INTO parsed_documents(cache_key,url,content_hash,payload) VALUES($1,$2,$3,$4) ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload',[`${d.url}|${h}`,d.url,h,d]));}
  getParsedDocument(url:string,h:string):ParsedDocument|undefined{return this.parsed.get(`${url}|${h}`);}
  saveClaim(c:PaperClaim):void{this.claims.set(c.claimId,c);this.write(this.pool.query('INSERT INTO claims(claim_id,payload) VALUES($1,$2) ON CONFLICT(claim_id) DO UPDATE SET payload=excluded.payload',[c.claimId,c]));}
  getClaims():PaperClaim[]{return [...this.claims.values()].sort((a,b)=>a.claimId.localeCompare(b.claimId));}
  getClaim(id:string):PaperClaim|undefined{return this.claims.get(id);}
  saveClaimConflict(c:ClaimConflict):void{const key=JSON.stringify(c);this.conflicts.set(key,c);this.write(this.pool.query('INSERT INTO claim_conflicts(conflict_key,payload) VALUES($1,$2) ON CONFLICT(conflict_key) DO NOTHING',[key,c]));}
  getClaimConflicts():ClaimConflict[]{return [...this.conflicts.values()];}
  createCollection(name:string):Collection{const id=`collection_${Buffer.from(name).toString('hex').slice(0,24)}`;const existing=[...this.collections.values()].find(c=>c.name===name);if(existing)return existing;const c={id,name,paperIds:[]} as Collection;this.collections.set(id,c);this.write(this.pool.query('INSERT INTO collections(collection_id,name) VALUES($1,$2) ON CONFLICT(name) DO NOTHING',[id,name]));return c;}
  addToCollection(id:string,paperId:string):void{const c=this.collections.get(id);if(c&&!c.paperIds.includes(paperId))c.paperIds.push(paperId);this.write(this.pool.query('INSERT INTO collection_items(collection_id,paper_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[id,paperId]));}
  removeFromCollection(id:string,paperId:string):void{const c=this.collections.get(id);if(c)c.paperIds=c.paperIds.filter(x=>x!==paperId);this.write(this.pool.query('DELETE FROM collection_items WHERE collection_id=$1 AND paper_id=$2',[id,paperId]));}
  deleteCollection(id:string):void{this.collections.delete(id);this.write(this.pool.query('DELETE FROM collection_items WHERE collection_id=$1',[id]).then(()=>this.pool.query('DELETE FROM collections WHERE collection_id=$1',[id])));}
  getCollection(id:string):Collection|undefined{return this.collections.get(id);}
  listCollections():Collection[]{return [...this.collections.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(c=>({...c,paperIds:[...c.paperIds].sort()}));}
  upsertVector(recordId:string,embedding:number[],payload:unknown):void{this.vectors.set(recordId,{embedding,payload});this.write(this.pool.query('INSERT INTO vector_records(record_id,embedding,payload) VALUES($1,$2::vector,$3) ON CONFLICT(record_id) DO UPDATE SET embedding=excluded.embedding,payload=excluded.payload',[recordId,toVectorLiteral(embedding),payload]));}
  searchVectors(query:number[],limit=10):Array<{recordId:string;score:number;payload:unknown}>{return [...this.vectors.entries()].map(([recordId,v])=>{const dot=v.embedding.reduce((s,x,i)=>s+x*(query[i]??0),0);const na=Math.sqrt(v.embedding.reduce((s,x)=>s+x*x,0));const nb=Math.sqrt(query.reduce((s,x)=>s+x*x,0));return {recordId,score:na&&nb?dot/(na*nb):0,payload:v.payload};}).sort((a,b)=>b.score-a.score||a.recordId.localeCompare(b.recordId)).slice(0,limit);}
  async searchVectorsSql(query:number[],limit=10):Promise<Array<{recordId:string;score:number;payload:unknown}>>{const r=await this.pool.query<any>('SELECT record_id,payload,1-(embedding <=> $1::vector) AS score FROM vector_records ORDER BY embedding <=> $1::vector,record_id LIMIT $2',[toVectorLiteral(query),limit]);return r.rows.map((row:any)=>({recordId:row.record_id,score:Number(row.score),payload:row.payload}));}
  close():void{this.write((this.pool.close??this.pool.end!)());}
}
function toVectorLiteral(values:number[]):string{return `[${values.map(value=>{if(!Number.isFinite(value))throw new Error('vector values must be finite');return String(value);}).join(',')}]`;}
