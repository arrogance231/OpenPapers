import { describe, expect, it } from 'vitest';
import { extractResearchPropositions } from '../src/extraction/propositions.js';
const doc=(text:string)=>({format:'pdf' as const,url:'https://paper',sections:[{level:0,heading:'Page 3',text,page:3}],references:[],warnings:[]});
describe('bounded research propositions',()=>{
 it('extracts only explicit objective vocabulary with evidence',()=>{const r=extractResearchPropositions(doc('We use a masked language model and next sentence prediction objective.'),'Which objectives were used?');expect(r.map(x=>x.value)).toEqual(['masked language model','next sentence prediction']);expect(r[0]).toMatchObject({locator:{page:3},rule:'explicit objective phrase'});});
 it('does not infer a proposition from an unrelated query',()=>{expect(extractResearchPropositions(doc('The paper cites FlashAttention.'),'What GPU count was used for training?')).toEqual([]);});
});
