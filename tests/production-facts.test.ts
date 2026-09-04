import { describe, expect, it } from 'vitest';
import { extractCandidateEvidence, extractResearchFacts } from '../src/extraction/facts.js';

const document = { format:'html' as const, url:'https://example.test/paper.pdf', references:[], warnings:[], sections:[
  {level:1, heading:'Training', page:5, text:'We trained our models on the WMT 2014 English-German dataset. We used the Adam optimizer.'},
  {level:1, heading:'Related Work', page:2, text:'Prior work uses AdamW and retrieval.'},
  {level:1, heading:'Evaluation', page:6, text:'We do not use retrieval at inference.'}
]};

describe('production fact extraction', () => {
  it('discovers typed candidate evidence with exact sentence locators', () => {
    const candidates = extractCandidateEvidence(document);
    expect(candidates.some(item => item.candidatePredicate === 'optimization.optimizer' && item.rawValue === 'Adam')).toBe(true);
    expect(candidates.every(item => item.locator.section && item.rawText)).toBe(true);
  });

  it('accepts current-work facts and rejects related-work and negated evidence', () => {
    const result = extractResearchFacts(document);
    expect(result.facts.map(item => item.value)).toContain('Adam');
    expect(result.facts.some(item => item.value === 'AdamW')).toBe(false);
    expect(result.facts.some(item => item.predicate.startsWith('retrieval.'))).toBe(false);
    expect(result.diagnostics.rejections.some(item => item.reason === 'REJECT_CITATION')).toBe(true);
    expect(result.diagnostics.rejections.some(item => item.reason === 'REJECT_NEGATION')).toBe(true);
  });

  it('retains provenance and raw values on accepted facts', () => {
    const fact = extractResearchFacts(document).facts.find(item => item.value === 'Adam');
    expect(fact).toMatchObject({predicate:'optimization.optimizer', rawValue:'Adam', sourceId:document.url, extractionMethod:'v5.1-deterministic'});
    expect(fact?.locator).toMatchObject({section:'Training', page:5});
    expect(fact?.rawEvidence).toContain('We used the Adam optimizer');
  });
});
