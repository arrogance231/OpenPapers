import { describe, expect, it } from 'vitest';
import { createReliableFetcher, RequestCache } from '../src/reliability/reliability.js';

const response = (status:number, headers:Record<string,string>={}) => new Response('{}',{status,headers});

describe('reliability infrastructure', () => {
  it('deduplicates concurrent GET requests and caches the response', async () => {
    let calls=0;
    const fetcher=createReliableFetcher(async () => { calls++; return response(200); }, {cacheTtlMs:10_000, minIntervalMs:0, sleep:async()=>{}});
    await Promise.all([fetcher('https://example.test/a'),fetcher('https://example.test/a')]);
    await fetcher('https://example.test/a');
    expect(calls).toBe(1);
  });
  it('retries 429 and 503 using bounded injected sleep and emits events', async () => {
    let calls=0; const events:string[]=[];
    const fetcher=createReliableFetcher(async () => { calls++; return calls<3 ? response(calls===1?429:503, calls===1?{'retry-after':'0'}:{}) : response(200); }, {cacheTtlMs:0,minIntervalMs:0,sleep:async()=>{},maxRetries:3,onEvent:e=>events.push(e.type)});
    expect((await fetcher('https://example.test/b')).status).toBe(200);
    expect(calls).toBe(3); expect(events).toContain('retry'); expect(events).toContain('success');
  });
  it('evicts expired cache entries', async () => {
    let now=0; const cache=new RequestCache(10,()=>now); cache.set('x',response(200)); now=11; expect(cache.get('x')).toBeUndefined();
  });
});
