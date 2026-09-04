import { describe, expect, it } from 'vitest';
import { extractResearchFacts } from '../src/research/facts.js';
import { interpretResearchQuery } from '../src/research/query-intent.js';
import { assembleFactAnswer } from '../src/research/answer-assembly.js';
const document={format:'pdf' as const,url:'https://paper',sections:[{level:1,heading:'Training',text:'We optimize with direct preference optimization and use grouped-query attention.',page:4}],references:[],warnings:[]};
describe('query-independent research facts',()=>{
 it('extracts the same facts without receiving a query',()=>{const facts=extractResearchFacts(document);expect(facts.map(x=>[x.predicate,x.value])).toEqual(expect.arrayContaining([['training.preference_method','DPO'],['architecture.attention','grouped-query attention']]));expect(facts.every(x=>x.locator.page===4&&x.rawEvidence.length>0)).toBe(true);});
 it('maps paraphrases to predicates after extraction',()=>{const facts=extractResearchFacts(document);const a=assembleFactAnswer(interpretResearchQuery('Which alignment algorithm did the paper use?',['training.preference_method']),facts);const b=assembleFactAnswer(interpretResearchQuery('How was preference optimization performed?',['training.preference_method']),facts);expect(a.answer).toEqual(b.answer);expect(a.status).toBe('SUPPORTED');});
 it('does not create a fact for an unsupported predicate',()=>{const facts=extractResearchFacts(document);const result=assembleFactAnswer(interpretResearchQuery('What GPU count was used?',['system.hardware']),facts);expect(result).toMatchObject({status:'UNKNOWN',answer:{},facts:[]});});
});
