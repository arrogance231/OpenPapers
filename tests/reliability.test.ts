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
  it('retries transient thrown network errors', async () => {
    let calls=0; const events:string[]=[];
    const fetcher=createReliableFetcher(async () => { calls++; if(calls<3) throw new Error('socket reset'); return response(200); }, {cacheTtlMs:0,minIntervalMs:0,sleep:async()=>{},onEvent:e=>events.push(e.type)});
    expect((await fetcher('https://example.test/network')).status).toBe(200);
    expect(calls).toBe(3); expect(events.filter(type=>type==='retry')).toHaveLength(2);
  });
  it('honors HTTP-date Retry-After values', async () => {
    let calls=0; const delays:number[]=[]; const retryAt=new Date(Date.now()+5000).toUTCString();
    const fetcher=createReliableFetcher(async () => { calls++; return calls===1 ? response(429,{'retry-after':retryAt}) : response(200); }, {cacheTtlMs:0,minIntervalMs:0,sleep:async ms=>{delays.push(ms);},maxRetries:1});
    await fetcher('https://example.test/date');
    expect(delays[0]).toBeGreaterThan(1000);
  });

  it('isolates cached responses by request headers', async () => {
    let calls=0; const fetcher=createReliableFetcher(async (_input,init) => { calls++; return response(200,{'x-token':String(new Headers(init?.headers).get('authorization'))}); }, {minIntervalMs:0});
    await fetcher('https://example.test/private',{headers:{authorization:'Bearer one'}});
    await fetcher('https://example.test/private',{headers:{authorization:'Bearer two'}});
    expect(calls).toBe(2);
  });

  it('does not cache responses marked private or no-store', async () => {
    let calls=0; const fetcher=createReliableFetcher(async () => { calls++; return response(200,{'cache-control':'private, no-store'}); }, {minIntervalMs:0});
    await fetcher('https://example.test/no-cache'); await fetcher('https://example.test/no-cache');
    expect(calls).toBe(2);
  });

  it('serializes concurrent requests through the shared limiter', async () => {
    let clock=0; const starts:number[]=[]; const sleep=async (ms:number)=>{clock+=ms;};
    const make=()=>createReliableFetcher(async()=>{starts.push(clock); return response(200);},{cacheTtlMs:0,minIntervalMs:100,sleep,now:()=>clock});
    await Promise.all([make()('https://example.test/one'),make()('https://example.test/two')]);
    expect(starts[1]-starts[0]).toBeGreaterThanOrEqual(100);
  });

  it('evicts expired cache entries', async () => {
    let now=0; const cache=new RequestCache(10,()=>now); cache.set('x',response(200)); now=11; expect(cache.get('x')).toBeUndefined();
  });
});
