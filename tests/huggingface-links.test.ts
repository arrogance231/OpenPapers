import { describe, expect, it } from 'vitest';
import { extractPaperLinks } from '../src/providers/huggingface.js';

describe('Hugging Face card paper links', () => {
  it('extracts normalized arXiv and DOI links from card metadata', () => {
    expect(extractPaperLinks({ papers: ['arXiv:2006.05525', 'https://doi.org/10.1234/example'], nested: { citation: 'https://arxiv.org/abs/2401.00001' } })).toEqual([
      { type: 'arxiv', value: '2006.05525', url: 'https://arxiv.org/abs/2006.05525' },
      { type: 'doi', value: '10.1234/example', url: 'https://doi.org/10.1234/example' },
      { type: 'arxiv', value: '2401.00001', url: 'https://arxiv.org/abs/2401.00001' }
    ]);
  });

  it('ignores non-paper URLs and duplicate links', () => {
    expect(extractPaperLinks({ homepage: 'https://example.com', paper: 'arxiv:2006.05525', duplicate: 'https://arxiv.org/abs/2006.05525' })).toEqual([
      { type: 'arxiv', value: '2006.05525', url: 'https://arxiv.org/abs/2006.05525' }
    ]);
  });
});
