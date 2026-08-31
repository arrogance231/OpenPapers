import { describe, expect, it } from 'vitest';
import type { HubItem, PaperLink } from '../src/providers/huggingface.js';
import { reconcilePaperLinks } from '../src/research/ecosystem-linking.js';

const item: HubItem = { id:'org/model', kind:'model', tags:[], paperLinks:[{type:'arxiv',value:'2006.05525',url:'https://arxiv.org/abs/2006.05525'},{type:'doi',value:'10.9999/missing',url:'https://doi.org/10.9999/missing'}], url:'https://huggingface.co/org/model', source:'huggingface' };
describe('ecosystem paper-link reconciliation', () => {
  it('marks links verified only when the local resolver returns a paper', () => {
    const result = reconcilePaperLinks(item, (link: PaperLink) => link.value === '2006.05525' ? 'paper-1' : undefined);
    expect(result).toEqual({ itemId:'org/model', links:[{...item.paperLinks[0],status:'VERIFIED',paperId:'paper-1'},{...item.paperLinks[1],status:'UNVERIFIED'}] });
  });
});
