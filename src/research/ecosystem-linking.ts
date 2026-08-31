import type { HubItem, PaperLink } from '../providers/huggingface.js';

export interface ReconciledPaperLink extends PaperLink { status: 'VERIFIED' | 'UNVERIFIED'; paperId?: string; }
export interface ReconciledPaperLinks { itemId: string; links: ReconciledPaperLink[]; }
export type PaperResolver = (link: PaperLink) => string | undefined;
export interface RepositoryLinkAssessment { level: 'PAPER_REFERENCED' | 'AUTHOR_OVERLAP' | 'UNVERIFIED'; implementationStatus: 'UNKNOWN'; reasons: string[]; }
export function assessRepositoryLink(repository: { owner: string }, paper: { arxivId?: string; doi?: string; authors: Array<{ normalizedName: string; name: string }> }, readme = ''): RepositoryLinkAssessment { const reasons:string[]=[]; const text=readme.toLowerCase(); const arxiv=paper.arxivId?.toLowerCase(); const doi=paper.doi?.toLowerCase(); if ((arxiv && text.includes(arxiv)) || (doi && text.includes(doi))) reasons.push('README references the paper identifier'); const owner=repository.owner.toLowerCase().replace(/[^a-z0-9]/g,''); const authorOverlap=paper.authors.some(author=>author.normalizedName.toLowerCase().split(/[^a-z0-9]+/).some(part=>part.length>=4&&part===owner)); if (authorOverlap) reasons.push('Repository owner overlaps a paper author name'); return {level:reasons.includes('README references the paper identifier')?'PAPER_REFERENCED':authorOverlap?'AUTHOR_OVERLAP':'UNVERIFIED',implementationStatus:'UNKNOWN',reasons}; }

export function reconcilePaperLinks(item: HubItem, resolver: PaperResolver): ReconciledPaperLinks { return { itemId:item.id, links:item.paperLinks.map(link=>{ const paperId=resolver(link); return paperId ? {...link,status:'VERIFIED' as const,paperId} : {...link,status:'UNVERIFIED' as const}; }) }; }
