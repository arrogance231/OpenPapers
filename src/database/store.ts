import type { ResearchWork, Evidence, GraphEdge } from '../models/research.js';
import type { ParsedDocument } from '../ingestion/document.js';
import type { PaperClaim, ClaimConflict } from '../extraction/claims.js';
import type { Collection } from './db.js';

/** The sole persistence boundary consumed by ResearchService. */
export interface AsyncResearchStore {
  upsertWork(work: ResearchWork): Promise<void>;
  getWork(id: string): Promise<ResearchWork | undefined>;
  search(query: string, limit?: number): Promise<ResearchWork[]>;
  addEvidence(evidence: Evidence, paperId: string): Promise<void>;
  getEvidenceForPaper(paperId: string): Promise<Evidence[]>;
  upsertGraphEdge(edge: GraphEdge): Promise<void>;
  getGraphEdges(sourcePaperId?: string): Promise<GraphEdge[]>;
  saveParsedDocument(document: ParsedDocument, contentHash: string): Promise<void>;
  getParsedDocument(url: string, contentHash: string): Promise<ParsedDocument | undefined>;
  saveClaim(claim: PaperClaim): Promise<void>;
  getClaims(): Promise<PaperClaim[]>;
  getClaim(claimId: string): Promise<PaperClaim | undefined>;
  saveClaimConflict(conflict: ClaimConflict): Promise<void>;
  getClaimConflicts(): Promise<ClaimConflict[]>;
  createCollection(name: string): Promise<Collection>;
  addToCollection(collectionId: string, paperId: string): Promise<void>;
  removeFromCollection(collectionId: string, paperId: string): Promise<void>;
  deleteCollection(collectionId: string): Promise<void>;
  getCollection(collectionId: string): Promise<Collection | undefined>;
  listCollections(): Promise<Collection[]>;
  close(): Promise<void>;
  flush?(): Promise<void>;
  deleteCollectionTransactional?(collectionId: string): Promise<void>;
  importResearchPackTransactional?(pack: import('../research/research-pack.js').ResearchPack): Promise<Collection>;
  persistGraphTransactional?(records: Array<{work: ResearchWork; evidence: Evidence; edge: GraphEdge}>): Promise<void>;
  persistClaimsTransactional?(claims: PaperClaim[], conflicts: ClaimConflict[]): Promise<void>;
}

export interface PostgresQueryResult<Row=Record<string,unknown>> { rows:Row[]; }
export interface PostgresQueryClient { query<Row=Record<string,unknown>>(text:string,parameters?:readonly unknown[]):Promise<PostgresQueryResult<Row>>; close():Promise<void>; }
