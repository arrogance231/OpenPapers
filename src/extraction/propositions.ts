import type { ParsedDocument } from '../ingestion/document.js';
import type { Locator } from '../models/research.js';

export type PropositionField='objectives'|'formulation'|'parallelism'|'partitioned_state'|'components'|'regimes'|'stages'|'attention'|'trace'|'parameter';
export interface ResearchProposition { field:PropositionField; value:string; sourceText:string; locator:Locator; rule:string; }
const rules:Array<[PropositionField,string,RegExp,string]>= [
 ['objectives','masked language model',/masked language model/i,'explicit objective phrase'],
 ['objectives','next sentence prediction',/next sentence prediction/i,'explicit objective phrase'],
 ['objectives','next-token prediction',/next[- ]token prediction/i,'explicit objective phrase'],
 ['formulation','text-to-text',/text[- ]to[- ]text/i,'explicit task formulation'],
 ['formulation','draft-and-verify',/draft(?:ing)?[- ]and[- ]verif(?:y|ication)/i,'explicit decoding formulation'],
 ['parallelism','tensor model parallelism',/tensor model parallel(?:ism)?/i,'explicit parallelism phrase'],
 ['parallelism','pipeline model parallelism',/pipeline model parallel(?:ism)?/i,'explicit parallelism phrase'],
 ['partitioned_state','optimizer states',/optimizer states?/i,'explicit partitioned training state'],
 ['partitioned_state','gradients',/\bgradients\b/i,'explicit partitioned training state'],
 ['partitioned_state','parameters',/\bparameters\b/i,'explicit partitioned training state'],
 ['components','retriever',/\bretriever\b/i,'explicit RAG component'],
 ['components','generator',/\bgenerator\b/i,'explicit RAG component'],
 ['regimes','zero-shot',/zero[- ]shot/i,'explicit evaluation regime'],
 ['regimes','one-shot',/one[- ]shot/i,'explicit evaluation regime'],
 ['regimes','few-shot',/few[- ]shot/i,'explicit evaluation regime'],
 ['stages','SFT',/\bSFT\b|supervised fine[- ]tuning/i,'explicit training stage'],
 ['stages','reward model',/reward model/i,'explicit training stage'],
 ['stages','PPO',/\bPPO\b|proximal policy optimization/i,'explicit training stage'],
 ['attention','exact',/\bexact attention\b/i,'explicit attention property'],
 ['attention','FlashAttention',/FlashAttention/i,'explicit attention implementation'],
 ['trace','thought',/\bthought\b/i,'explicit ReAct trace element'],
 ['trace','action',/\baction\b/i,'explicit ReAct trace element'],
 ['trace','observation',/\bobservation\b/i,'explicit ReAct trace element'],
 ['parameter','r',/\br\s*=\s*\d+|rank\s+(?:of\s+)?r\b/i,'explicit low-rank parameter symbol'],
];
const fieldFor=(query:string):PropositionField|undefined=>{const q=query.toLowerCase();if(/objective|self-supervised/.test(q))return'objectives';if(/formulation|frame .*task|what does .* do/.test(q))return'formulation';if(/parallelism/.test(q))return'parallelism';if(/partition|partitioned/.test(q))return'partitioned_state';if(/component/.test(q))return'components';if(/regime|zero-shot|one-shot|few-shot/.test(q))return'regimes';if(/stage|stages/.test(q))return'stages';if(/attention/.test(q))return'attention';if(/trace|reasoning/.test(q))return'trace';if(/rank|parameter/.test(q))return'parameter';return undefined;};
function sentence(text:string,index:number):string { const start=Math.max(text.lastIndexOf('.',index)+1,text.lastIndexOf('\n',index)+1); const end=text.indexOf('.',index); return text.slice(start,end<0?text.length:end+1).trim(); }
export function extractResearchPropositions(document:ParsedDocument,query:string):ResearchProposition[] { const field=fieldFor(query);if(!field)return[];const out:ResearchProposition[]=[];for(const section of document.sections){for(const [ruleField,value,pattern,rule] of rules){if(ruleField!==field)continue;const match=pattern.exec(section.text);if(!match)continue;const sourceText=sentence(section.text,match.index);out.push({field,value,sourceText,locator:{section:section.heading,...(section.page===undefined?{}:{page:section.page}),...(section.pageId===undefined?{}:{pageId:section.pageId})},rule});}}return [...new Map(out.map(item=>[`${item.field}:${item.value}`,item])).values()];}
