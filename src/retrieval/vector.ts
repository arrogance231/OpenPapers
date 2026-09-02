export interface VectorRecord { id:string; text:string; metadata?:Record<string,unknown>; }
export interface VectorMatch { id:string; score:number; metadata?:Record<string,unknown>; }
export interface VectorRetriever { index(records:VectorRecord[]):Promise<void>; search(query:string,limit?:number):Promise<VectorMatch[]>; }
export interface SqlVectorStore { upsertVector(recordId:string,embedding:number[],payload:unknown):Promise<void>; searchVectorsSql(query:number[],limit:number):Promise<Array<{recordId:string;score:number;payload:unknown}>>; flush?():Promise<void>; }

const terms=(text:string):string[]=>text.toLowerCase().match(/[a-z0-9]+/g)??[];
const vector=(text:string):Map<string,number>=>{ const counts=new Map<string,number>(); for(const term of terms(text)) counts.set(term,(counts.get(term)??0)+1); return counts; };
const similarity=(left:Map<string,number>,right:Map<string,number>):number=>{ let dot=0,leftNorm=0,rightNorm=0; for(const value of left.values())leftNorm+=value*value; for(const value of right.values())rightNorm+=value*value; for(const [term,value] of left)dot+=value*(right.get(term)??0); return leftNorm&&rightNorm?dot/Math.sqrt(leftNorm*rightNorm):0; };

export class InMemoryVectorRetriever implements VectorRetriever {
  private readonly records=new Map<string,VectorRecord>();
  async index(records:VectorRecord[]):Promise<void>{ for(const record of records){ if(!record.id.trim()||!record.text.trim())throw new Error('vector records require non-empty id and text'); this.records.set(record.id,record); } }
  async search(query:string,limit=10):Promise<VectorMatch[]>{ if(!query.trim())throw new Error('vector query must not be empty'); if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error('vector result limit must be between 1 and 100'); const queryVector=vector(query); return [...this.records].map(([id,record])=>({id,score:similarity(queryVector,vector(record.text)),...(record.metadata?{metadata:record.metadata}:{})})).filter(match=>match.score>0).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,limit); }
}

export class PostgresVectorRetriever implements VectorRetriever {
  constructor(private readonly store:SqlVectorStore, private readonly embed:(text:string)=>Promise<number[]>) {}
  async index(records:VectorRecord[]):Promise<void>{for(const record of records){if(!record.id.trim()||!record.text.trim())throw new Error('vector records require non-empty id and text');const embedding=await this.embed(record.text);await this.store.upsertVector(record.id,embedding,{text:record.text,metadata:record.metadata});}if(this.store.flush)await this.store.flush();}
  async search(query:string,limit=10):Promise<VectorMatch[]>{if(!query.trim())throw new Error('vector query must not be empty');if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error('vector result limit must be between 1 and 100');const matches=await this.store.searchVectorsSql(await this.embed(query),limit);return matches.map(match=>{const payload=match.payload as {metadata?:Record<string,unknown>}|undefined;return {id:match.recordId,score:match.score,...(payload?.metadata?{metadata:payload.metadata}:{})};});}
}
