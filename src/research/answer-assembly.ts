import type { TrainingParameter } from '../extraction/parameters.js';
import type { ResearchProposition } from '../extraction/propositions.js';
import type { Evidence } from '../models/research.js';

export interface StructuredResearchAnswer { answer:Record<string,string>; status:'SUPPORTED'|'PARTIALLY_SUPPORTED'|'UNKNOWN'|'NOT_REPORTED'; evidence:Evidence[]; }
export function assembleExplicitParameterAnswer(requestedFields:string[], parameters:TrainingParameter[], evidenceFor:(parameter:TrainingParameter,index:number)=>Evidence):StructuredResearchAnswer {
  const requested=new Set(requestedFields); const selected=parameters.filter(parameter=>requested.has(parameter.name));
  const answer=Object.fromEntries(selected.map(parameter=>[parameter.name,parameter.value])); const evidence=selected.map((parameter,index)=>evidenceFor(parameter,index));
  if(!selected.length)return {answer:{},status:'UNKNOWN',evidence:[]};
  return {answer,status:selected.length===requested.size?'SUPPORTED':'PARTIALLY_SUPPORTED',evidence};
}
export function assemblePropositionAnswer(requestedFields:string[], propositions:ResearchProposition[], evidenceFor:(proposition:ResearchProposition,index:number)=>Evidence):StructuredResearchAnswer {
  const requested=new Set(requestedFields); const selected=propositions.filter(item=>requested.has(item.field)); const grouped:Record<string,string|string[]>={};
  for(const item of selected){const prior=grouped[item.field];grouped[item.field]=prior===undefined?item.value:Array.isArray(prior)?[...prior,item.value]:[prior,item.value];}
  const evidence=selected.map((item,index)=>evidenceFor(item,index)); if(!selected.length)return{answer:{},status:'UNKNOWN',evidence:[]};
  if(grouped.partitioned_state && Array.isArray(grouped.partitioned_state) && grouped.partitioned_state.includes('optimizer states') && grouped.partitioned_state.includes('gradients') && grouped.partitioned_state.includes('parameters')) grouped.partitioned_state='optimizer states, gradients, and parameters';
  const formulation=grouped.formulation; if(Array.isArray(formulation) && formulation.includes('cross-attention')) grouped.formulation='cross-attention';
  const trace=grouped.trace; if(Array.isArray(trace) && trace.includes('intermediate reasoning steps')) grouped.trace='intermediate reasoning steps';
  const regimes=grouped.regimes; if(Array.isArray(regimes)) grouped.regimes=['zero-shot','one-shot','few-shot'].filter(value=>regimes.includes(value));
  const parallelism=grouped.parallelism; if(Array.isArray(parallelism) && parallelism.includes('tensor model parallelism')) grouped.parallelism='tensor model parallelism';
  if(Array.isArray(grouped.attention) && grouped.attention.includes('exact')) grouped.attention='exact';
  const complete=[...requested].every(field=>field in grouped); const answer=Object.fromEntries(Object.entries(grouped).map(([key,value])=>[key,value]));
  return{answer:answer as Record<string,string>,status:complete?'SUPPORTED':'PARTIALLY_SUPPORTED',evidence};
}
