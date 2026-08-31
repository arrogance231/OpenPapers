import type { HubItem, PaperLink } from '../providers/huggingface.js';

export interface ReconciledPaperLink extends PaperLink { status: 'VERIFIED' | 'UNVERIFIED'; paperId?: string; }
export interface ReconciledPaperLinks { itemId: string; links: ReconciledPaperLink[]; }
export type PaperResolver = (link: PaperLink) => string | undefined;
export function reconcilePaperLinks(item: HubItem, resolver: PaperResolver): ReconciledPaperLinks { return { itemId:item.id, links:item.paperLinks.map(link=>{ const paperId=resolver(link); return paperId ? {...link,status:'VERIFIED' as const,paperId} : {...link,status:'UNVERIFIED' as const}; }) }; }
