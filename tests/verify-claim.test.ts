import { describe, expect, it } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import { ResearchService } from '../src/research/service.js';

describe('claim verification', () => {
  it('keeps derived heuristic claims unknown and preserves evidence', async () => {
    const db = new ResearchDb(':memory:');
    const claim = {claimId:'claim-a',claimKey:'loss|loss',kind:'loss' as const,statement:'Uses KL.',sourceUrl:'https://example.com/paper',locator:{section:'Loss'},confidence:'heuristic' as const,evidenceType:'DERIVED' as const,evidence:{evidenceId:'evidence-a',sourceId:'https://example.com/paper',authors:[],title:'Loss claim',identifiers:{},locator:{section:'Loss'},evidenceType:'DERIVED' as const,sourceQuality:'C' as const,evidence:'Uses KL.',citationText:'https://example.com/paper#Loss'}};
    db.saveClaim(claim);
    const response = await new ResearchService(db).verifyClaim('claim-a');
    expect(response.data.status).toBe('UNKNOWN');
    expect(response.data.claim).toEqual(claim);
    expect(response.evidence).toEqual([claim.evidence]);
  });
});
