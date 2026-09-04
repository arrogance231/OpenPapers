import { describe, expect, it } from 'vitest';
import { assembleExplicitParameterAnswer } from '../src/research/answer-assembly.js';

describe('explicit answer assembly', () => {
  it('does not emit unrelated extracted parameters', () => {
    const parameters = [
      {name:'optimizer',value:'Adam',sourceUrl:'https://paper',locator:{section:'Training'},confidence:'explicit' as const},
      {name:'batch_size',value:'16',sourceUrl:'https://paper',locator:{section:'Training'},confidence:'explicit' as const},
    ];
    const result=assembleExplicitParameterAnswer(['optimizer'],parameters,(parameter)=>({evidenceId:parameter.name,sourceId:parameter.sourceUrl,authors:[],title:'paper',identifiers:{},locator:parameter.locator,evidenceType:'DERIVED',sourceQuality:'C',evidence:parameter.value,citationText:parameter.sourceUrl}));
    expect(result.answer).toEqual({optimizer:'Adam'});
    expect(result.evidence).toHaveLength(1);
    expect(result.status).toBe('SUPPORTED');
  });
});
