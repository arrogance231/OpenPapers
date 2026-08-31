export type ReliabilityEvent = { type: 'cache_hit' | 'request' | 'retry' | 'success' | 'failure'; url: string; attempt?: number; status?: number; delayMs?: number; durationMs?: number };
export interface ReliabilityStats { requests: number; cacheHits: number; retries: number; successes: number; failures: number; totalLatencyMs: number; lastLatencyMs?: number; }
export interface ReliableFetcherOptions { cacheTtlMs?: number; minIntervalMs?: number; maxRetries?: number; baseDelayMs?: number; sleep?: (ms:number)=>Promise<void>; now?: ()=>number; onEvent?: (event:ReliabilityEvent)=>void; }
export class RequestCache {
  private readonly values=new Map<string,{response:Response;expiresAt:number}>();
  constructor(private readonly ttlMs:number,private readonly now=()=>Date.now()){}
  get(key:string):Response|undefined { const entry=this.values.get(key); if(!entry)return undefined; if(entry.expiresAt<=this.now()){this.values.delete(key);return undefined;} return entry.response.clone(); }
  set(key:string,response:Response):void { if(this.ttlMs>0)this.values.set(key,{response:response.clone(),expiresAt:this.now()+this.ttlMs}); }
}
let nextAllowedAt=0;
const stats:ReliabilityStats={requests:0,cacheHits:0,retries:0,successes:0,failures:0,totalLatencyMs:0};
export function getReliabilityStats():ReliabilityStats { return {...stats}; }
function emit(event:ReliabilityEvent,callback?: (event:ReliabilityEvent)=>void):void { if(event.type==='request')stats.requests++; else if(event.type==='cache_hit')stats.cacheHits++; else if(event.type==='retry')stats.retries++; else if(event.type==='success')stats.successes++; else stats.failures++; if(event.durationMs!==undefined){stats.totalLatencyMs+=event.durationMs;stats.lastLatencyMs=event.durationMs;} callback?.(event); }
export function createReliableFetcher(fetcher: typeof fetch = fetch, options:ReliableFetcherOptions={}):typeof fetch {
  const cache=new RequestCache(options.cacheTtlMs ?? 30_000,options.now); const sleep=options.sleep ?? ((ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))); const minInterval=options.minIntervalMs ?? 0; const maxRetries=options.maxRetries ?? 2; const baseDelay=options.baseDelayMs ?? 250; const inFlight=new Map<string,Promise<Response>>();
  const run=async (input:RequestInfo|URL,init?:RequestInit):Promise<Response>=>{
    const url=typeof input==='string'?input:input instanceof URL?input.toString():input.url; const method=(init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase(); const key=`${method}:${url}`;
    if(method==='GET'){ const cached=cache.get(key); if(cached){emit({type:'cache_hit',url},options.onEvent);return cached;} const existing=inFlight.get(key); if(existing)return (await existing).clone(); }
    const operation=(async()=>{ for(let attempt=0;;attempt++){ const now=options.now?.() ?? Date.now(); const wait=Math.max(0,nextAllowedAt-now); if(wait>0)await sleep(wait); nextAllowedAt=(options.now?.() ?? Date.now())+minInterval; emit({type:'request',url,attempt},options.onEvent); const startedAt=Date.now(); const result=await fetcher(input,init); const durationMs=Date.now()-startedAt; if((result.status===429||result.status>=500)&&attempt<maxRetries){ const retryAfter=result.headers.get('retry-after'); const seconds=retryAfter ? Number(retryAfter) : NaN; const delay=Number.isFinite(seconds)?Math.max(0,seconds*1000):baseDelay*2**attempt; emit({type:'retry',url,attempt,status:result.status,delayMs:delay},options.onEvent); await sleep(delay); continue; } if(!result.ok){emit({type:'failure',url,attempt,status:result.status,durationMs},options.onEvent);return result;} emit({type:'success',url,attempt,status:result.status,durationMs},options.onEvent); if(method==='GET')cache.set(key,result); return result; } })();
    if(method==='GET')inFlight.set(key,operation); try{return await operation;} finally{if(method==='GET')inFlight.delete(key);}
  }; return run as typeof fetch;
}
