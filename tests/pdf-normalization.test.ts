import { describe, expect, it } from 'vitest';
import { normalizePdfText } from '../src/extraction/text-normalization.js';
import { extractCandidateEvidence } from '../src/extraction/facts.js';

describe('PDF evidence span normalization', () => {
  it('repairs formatting without changing semantic content', () => {
    expect(normalizePdfText('pre-\ntraining  ﬁ  ﬂ  4\u00a0-\u00a0bit 2 × 10−5')).toBe('pretraining fi fl 4-bit 2 x 10-5');
  });

  it('discovers existing predicates across PDF surface variants', () => {
    const document = { format:'pdf' as const, url:'https://example.test/p.pdf', references:[], warnings:[], sections:[
      {level:1, heading:'BERT', page:3, text:'BERTBASE has 12\n layers, a hidden size of 768.'},
      {level:1, heading:'QLORA Finetuning', page:4, text:'QLORA achieves high-fidelity 4-\nbit finetuning.'}
    ]};
    const candidates = extractCandidateEvidence(document);
    expect(candidates.some(item => item.candidatePredicate === 'architecture.depth' && item.rawValue === '12')).toBe(true);
    const precisionCandidate=candidates.find(item => item.candidatePredicate === 'training.precision');
    expect(precisionCandidate?.rawText).toContain('4-\nbit');
    expect(precisionCandidate?.normalizedText).toContain('4-bit');
  });
});
