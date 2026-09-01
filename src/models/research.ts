export type EvidenceType = 'DIRECT' | 'DERIVED' | 'CODE_VERIFIED' | 'SECONDARY_SOURCE' | 'UNVERIFIED' | 'CONFLICTING';
export type SourceQuality = 'A' | 'B' | 'C' | 'D' | 'E';
export type PublicationStatus = 'preprint' | 'workshop' | 'conference' | 'journal' | 'technical_report' | 'unknown';

export interface Author { name: string; normalizedName: string; orcid?: string; }
export interface Identifier { doi?: string; arxiv?: string; semanticScholar?: string; openAlex?: string; }
export interface Locator { page?: number; section?: string; subsection?: string; table?: string; figure?: string; equation?: string; appendix?: string; repositoryPath?: string; repositoryLineStart?: number; repositoryLineEnd?: number; commitSha?: string; }
export interface Evidence { evidenceId: string; sourceId: string; authors: Author[]; title: string; year?: number; identifiers: Identifier; locator?: Locator; evidenceType: EvidenceType; sourceQuality: SourceQuality; evidence: string; citationText: string; }
export interface PaperVersion { versionId: string; sourceId: string; version?: string; canonicalUrl?: string; pdfUrl?: string; submittedAt?: string; updatedAt?: string; }
export interface ResearchWork { paperId: string; title: string; authors: Author[]; authorIds?: string[]; topics?: string[]; year?: number; venue?: string; doi?: string; arxivId?: string; semanticScholarId?: string; openAlexId?: string; canonicalUrl?: string; pdfUrl?: string; citationCount?: number; publicationStatus: PublicationStatus; bibtex: string; sourceProviders: string[]; versions: PaperVersion[]; abstract?: string; }
export type GraphRelation = 'reference' | 'citation' | 'related';
export type RelationshipClass = 'DIRECT' | 'FOUNDATIONAL_CANDIDATE' | 'FOLLOW_UP_CANDIDATE' | 'UNKNOWN';
export interface GraphItem { work: ResearchWork; relation: GraphRelation; relationshipClass: RelationshipClass; source: string; evidence: Evidence; }
export interface AuthorProfile { authorId: string; name: string; aliases: string[]; paperIds: string[]; source: string; }
export interface GraphEdge { sourcePaperId: string; targetPaperId: string; relation: GraphRelation; relationshipClass: RelationshipClass; provider: string; evidenceId: string; retrievedAt: string; }
export interface SourceConflict { field: string; selected: string; alternate: string; selectedSource: string; alternateSource: string; }
export interface MissingValue { value: null; status: 'NOT_REPORTED' | 'NOT_FOUND' | 'SOURCE_UNAVAILABLE' | 'AMBIGUOUS' | 'UNVERIFIED'; }
export type Reported<T> = { value: T; status: 'REPORTED' | 'CODE_VERIFIED' | 'CONFLICTING'; sources: string[] } | MissingValue;
export interface TrainingRecipe { method: string; teacher: Record<string, Reported<string>>; student: Record<string, Reported<string>>; objectives: Reported<string[]>; losses: Reported<string[]>; temperature: Reported<number>; alpha: Reported<number>; optimizer: Record<string, Reported<string>>; scheduler: Record<string, Reported<string>>; learning_rate: Reported<number>; batch_size: Reported<number>; gradient_accumulation: Reported<number>; sequence_length: Reported<number>; epochs: Reported<number>; training_steps: Reported<number>; warmup: Reported<string>; weight_decay: Reported<number>; precision: Reported<string>; gradient_clipping: Reported<number>; datasets: Reported<string[]>; missing_information: string[]; sources: Evidence[]; }
export interface ResearchResponse<T> { summary: string; data: T; evidence: Evidence[]; references: ResearchWork[]; transparency: { query?: string; expandedQueries: string[]; sourcesSearched: string[]; providerFailures?: string[]; conflicts?: SourceConflict[]; reliability?: { requests: number; cacheHits: number; retries: number; successes: number; failures: number; totalLatencyMs: number; lastLatencyMs?: number }; candidates: number; retrievedAt: string; rankingRationale: string[]; }; }
