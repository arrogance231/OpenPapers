import type { ResearchWork, Evidence, GraphEdge } from '../models/research.js';
import type { ParsedDocument } from '../ingestion/document.js';
import type { PaperClaim, ClaimConflict } from '../extraction/claims.js';
import type { Collection } from './db.js';

export interface ResearchStore {
  upsertWork(work:ResearchWork):void;
  getWork(id:string):ResearchWork|undefined;
  search(query:string,limit?:number):ResearchWork[];
  addEvidence(evidence:Evidence,paperId:string):void;
  getEvidenceForPaper(paperId:string):Evidence[];
  upsertGraphEdge(edge:GraphEdge):void;
  getGraphEdges(sourcePaperId?:string):GraphEdge[];
  saveParsedDocument(document:ParsedDocument,contentHash:string):void;
  getParsedDocument(url:string,contentHash:string):ParsedDocument|undefined;
  saveClaim(claim:PaperClaim):void;
  getClaims():PaperClaim[];
  getClaim(claimId:string):PaperClaim|undefined;
  saveClaimConflict(conflict:ClaimConflict):void;
  getClaimConflicts():ClaimConflict[];
  createCollection(name:string):Collection;
  addToCollection(collectionId:string,paperId:string):void;
  removeFromCollection(collectionId:string,paperId:string):void;
  deleteCollection(collectionId:string):void;
  getCollection(collectionId:string):Collection|undefined;
  listCollections():Collection[];
  close():void;
}

export type AsyncResearchStore = {
  [K in keyof ResearchStore]: ResearchStore[K] extends (...args: infer A) => infer R ? (...args: A) => Promise<Awaited<R>> : ResearchStore[K]
};

export interface PostgresQueryResult<Row=Record<string,unknown>> { rows:Row[]; }
export interface PostgresQueryClient { query<Row=Record<string,unknown>>(text:string,parameters?:readonly unknown[]):Promise<PostgresQueryResult<Row>>; close():Promise<void>; }
