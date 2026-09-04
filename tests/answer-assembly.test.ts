import { describe, expect, it } from 'vitest';
import { assembleExplicitParameterAnswer, assemblePropositionAnswer } from '../src/research/answer-assembly.js';

describe('explicit answer assembly', () => {
  it('does not emit unrelated extracted parameters', () => {
    const parameters = [
      {name:'optimizer',value:'Adam',sourceUrl:'https://paper',locator:{section:'Training'},confidence:'explicit' as const},
      {name:'batch_size',value:'16',sourceUrl:'https://paper',locator:{section:'Training'},confidence:'explicit' as const},
    ];
    const result=assembleExplicitParameterAnswer(['optimizer'],parameters,(parameter)=>({evidenceId:parameter.name,sourceId:parameter.sourceUrl,authors:[],title:'paper',identifiers:{},locator:parameter.locator,evidenceType:'DERIVED',sourceQuality:'C',evidence:parameter.value,citationText:parameter.sourceUrl}));
    expect(result.answer).toEqual({optimizer:'Adam'}); expect(result.evidence).toHaveLength(1); expect(result.status).toBe('SUPPORTED');
  });
  it('assembles a composite only from all explicit components', () => {
    const propositions = ['optimizer states','gradients','parameters'].map(value => ({field:'partitioned_state' as const,value,sourceText:value,locator:{page:2},rule:'explicit'}));
    const result=assemblePropositionAnswer(['partitioned_state'],propositions,(p)=>({evidenceId:p.value,sourceId:'https://paper',authors:[],title:'paper',identifiers:{},locator:p.locator,evidenceType:'DERIVED',sourceQuality:'C',evidence:p.sourceText,citationText:'https://paper'}));
    expect(result.answer).toEqual({partitioned_state:'optimizer states, gradients, and parameters'});
  });
  it('canonicalizes ordered regimes and prefers exact attention when both are explicit', () => {
    const propositions = [
      {field:'regimes' as const,value:'few-shot',sourceText:'few-shot',locator:{page:1},rule:'explicit'},
      {field:'regimes' as const,value:'zero-shot',sourceText:'zero-shot',locator:{page:1},rule:'explicit'},
      {field:'regimes' as const,value:'one-shot',sourceText:'one-shot',locator:{page:1},rule:'explicit'},
      {field:'attention' as const,value:'exact',sourceText:'exact attention',locator:{page:1},rule:'explicit'},
      {field:'attention' as const,value:'FlashAttention',sourceText:'FlashAttention',locator:{page:1},rule:'explicit'},
    ];
    const evidenceFor=(p:any)=>({evidenceId:p.value,sourceId:'https://paper',authors:[],title:'paper',identifiers:{},locator:p.locator,evidenceType:'DERIVED',sourceQuality:'C',evidence:p.sourceText,citationText:'https://paper'});
    expect(assemblePropositionAnswer(['regimes'],propositions,evidenceFor).answer.regimes).toEqual(['zero-shot','one-shot','few-shot']);
    expect(assemblePropositionAnswer(['attention'],propositions,evidenceFor).answer.attention).toBe('exact');
  });
});
