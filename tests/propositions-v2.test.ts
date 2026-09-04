import { describe, expect, it } from 'vitest';
import { extractResearchPropositions } from '../src/extraction/propositions.js';
const doc=(text:string)=>({format:'pdf' as const,url:'https://paper',sections:[{level:0,heading:'Page 3',text,page:3}],references:[],warnings:[]});
describe('generalized research propositions',()=>{
 it('routes varied objective wording to bounded concepts',()=>{expect(extractResearchPropositions(doc('The model is optimized with a contrastive loss.'),'What learning signal trains the model?').map(x=>x.value)).toEqual(['contrastive learning']);});
 it('recognizes bounded architecture terminology without title-specific rules',()=>{expect(extractResearchPropositions(doc('We use grouped-query attention for inference.'),'What attention topology is used?')[0]).toMatchObject({field:'attention',value:'grouped-query attention',locator:{page:3}});});
 it('does not infer concepts from unrelated questions',()=>{expect(extractResearchPropositions(doc('We compare against a model that uses PPO and FlashAttention.'),'What optimizer was used for training?')).toEqual([]);});
});
