import { describe, expect, it } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import { ResearchService } from '../src/research/service.js';

describe('claim verification', () => {
  it('keeps derived heuristic claims unknown and preserves evidence', async () => {
    const db = new ResearchDb(':memory:');
    const claim = {claimId:'claim-a',claimKey:'loss|loss',kind:'loss' as const,statement:'Uses KL.',sourceUrl:'https://example.com/paper',locator:{section:'Loss'},confidence:'heuristic' as const,evidenceType:'DERIVED' as const,evidence:{evidenceId:'evidence-a',sourceId:'https://example.com/paper',authors:[],title:'Loss claim',identifiers:{},locator:{section:'Loss'},evidenceType:'DERIVED' as const,sourceQuality:'C' as const,evidence:'Uses KL.',citationText:'https://example.com/paper#Loss'}};
    await db.saveClaim(claim);
    const response = await new ResearchService(db).verifyClaim('claim-a');
    expect(response.data.status).toBe('UNKNOWN');
    expect(response.data.claim).toEqual(claim);
    expect(response.evidence).toEqual([claim.evidence]);
  });
  it('reports persisted claim conflicts instead of treating a conflicted claim as unknown', async () => {
    const db = new ResearchDb(':memory:');
    const base = {claimKey:'loss|loss',kind:'loss' as const,sourceUrl:'https://example.com/paper',locator:{section:'Loss'},confidence:'heuristic' as const,evidenceType:'DERIVED' as const};
    const claimA = {...base,claimId:'claim-a',statement:'Uses KL.',evidence:{evidenceId:'evidence-a',sourceId:base.sourceUrl,authors:[],title:'A',identifiers:{},evidenceType:'DERIVED' as const,sourceQuality:'C' as const,evidence:'Uses KL.',citationText:base.sourceUrl}};
    const claimB = {...base,claimId:'claim-b',statement:'Uses MSE.',evidence:{evidenceId:'evidence-b',sourceId:base.sourceUrl,authors:[],title:'B',identifiers:{},evidenceType:'DERIVED' as const,sourceQuality:'C' as const,evidence:'Uses MSE.',citationText:base.sourceUrl}};
    await db.saveClaim(claimA); await db.saveClaim(claimB); await db.saveClaimConflict({claimKey:base.claimKey,selectedClaimId:'claim-a',alternateClaimId:'claim-b',selectedStatement:claimA.statement,alternateStatement:claimB.statement});
    const response = await new ResearchService(db).verifyClaim('claim-a');
    expect(response.data.status).toBe('CONTRADICTED');
    expect(response.data.conflicts).toHaveLength(1);
  });
});