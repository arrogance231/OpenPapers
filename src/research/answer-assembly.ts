import type { TrainingParameter } from '../extraction/parameters.js';
import type { Evidence } from '../models/research.js';

export interface StructuredResearchAnswer { answer:Record<string,string>; status:'SUPPORTED'|'PARTIALLY_SUPPORTED'|'UNKNOWN'|'NOT_REPORTED'; evidence:Evidence[]; }
export function assembleExplicitParameterAnswer(requestedFields:string[], parameters:TrainingParameter[], evidenceFor:(parameter:TrainingParameter,index:number)=>Evidence):StructuredResearchAnswer {
  const requested=new Set(requestedFields); const selected=parameters.filter(parameter=>requested.has(parameter.name));
  const answer=Object.fromEntries(selected.map(parameter=>[parameter.name,parameter.value]));
  const evidence=selected.map((parameter,index)=>evidenceFor(parameter,index));
  if(!selected.length)return {answer:{},status:'UNKNOWN',evidence:[]};
  return {answer,status:selected.length===requested.size?'SUPPORTED':'PARTIALLY_SUPPORTED',evidence};
}
