import { describe, expect, it } from 'vitest';
import { createReliableFetcher, RequestCache } from '../src/reliability/reliability.js';
import { SqliteResponseCache } from '../src/reliability/durable-cache.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStructuredLogger, redactUrl } from '../src/reliability/logger.js';

const response = (status:number, headers:Record<string,string>={}) => new Response('{}',{status,headers});

describe('reliability infrastructure', () => {
  it('redacts credentials from structured provider URLs', () => {
    expect(redactUrl('https://api.example.test/search?query=paper&api_key=SECRET')).toBe('https://api.example.test/search?query=paper&api_key=%5BREDACTED%5D');
    const lines:string[]=[];
    createStructuredLogger({sink:line=>lines.push(line)}).error('provider_request_failed',{url:'https://x.test/?token=SECRET',provider:'x'});
    expect(lines.join('\n')).not.toContain('SECRET');
  });
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

  it('serializes concurrent requests for the same host through the limiter', async () => {
    let clock=0; const starts:number[]=[]; const sleep=async (ms:number)=>{clock+=ms;};
    const fetcher=createReliableFetcher(async()=>{starts.push(clock);return response(200);},{cacheTtlMs:0,minIntervalMs:100,sleep,now:()=>clock});
    await Promise.all([fetcher('https://example.test/one'),fetcher('https://example.test/two')]);
    expect(starts[1]-starts[0]).toBeGreaterThanOrEqual(100);
  });

  it('does not serialize unrelated provider hosts', async () => {
    let clock=0; const starts:string[]=[];
    const sleep=async (ms:number)=>{ clock+=ms; };
    const fetcher=createReliableFetcher(async (input)=>{ starts.push(new URL(input.toString()).hostname); return response(200); },{cacheTtlMs:0,minIntervalMs:100,sleep,now:()=>clock});
    await Promise.all([fetcher('https://arxiv.org/a'),fetcher('https://api.openalex.org/b')]);
    expect(starts).toEqual(['arxiv.org','api.openalex.org']);
    expect(clock).toBe(0);
  });

  it('does not cache cookie-bearing or secret-query requests', async () => {
    let calls=0;
    const fetcher=createReliableFetcher(async()=>{calls++;return response(200);},{minIntervalMs:0});
    await fetcher('https://example.test/a?api_key=secret'); await fetcher('https://example.test/a?api_key=secret');
    await fetcher('https://example.test/b',{headers:{cookie:'session=secret'}}); await fetcher('https://example.test/b',{headers:{cookie:'session=secret'}});
    expect(calls).toBe(4);
  });

  it('does not cache responses with Set-Cookie or Vary authorization', async () => {
    let calls=0;
    const fetcher=createReliableFetcher(async()=>{calls++;return response(200,{'set-cookie':'session=secret',vary:'Authorization'});},{minIntervalMs:0});
    await fetcher('https://example.test/a'); await fetcher('https://example.test/a');
    expect(calls).toBe(2);
  });

  it('degrades to upstream fetch when the durable cache record is corrupt', async () => {
    let calls=0; const durable={get:async()=>({status:200,headers:'{bad}',body:'{}',expiresAt:Date.now()+10000}),set:async()=>{}};
    const fetcher=createReliableFetcher(async()=>{calls++;return response(200);},{minIntervalMs:0,durableCache:durable as never});
    await expect(fetcher('https://example.test/corrupt')).resolves.toBeInstanceOf(Response);
    expect(calls).toBe(1);
  });

  it('evicts expired cache entries', async () => {
    let now=0; const cache=new RequestCache(10,()=>now); cache.set('x',response(200)); now=11; expect(cache.get('x')).toBeUndefined();
  });

  it('records latency histograms per provider host', async () => {
    const fetcher=createReliableFetcher(async()=>response(200),{cacheTtlMs:0,minIntervalMs:0,now:()=>0});
    await fetcher('https://arxiv.org/api/query');
    const stats=(await import('../src/reliability/reliability.js')).getReliabilityStats();
    expect(stats.providerLatency['arxiv.org']?.count).toBeGreaterThan(0);
    expect(stats.providerLatency['arxiv.org']?.buckets.le10).toBeGreaterThan(0);
  });

  it('persists safe GET responses across durable cache instances', async () => {
    const directory=mkdtempSync(join(tmpdir(),'openpapers-cache-')); const path=join(directory,'cache.sqlite');
    const first=new SqliteResponseCache(path); const fetcher=createReliableFetcher(async()=>response(200,{'x-cache':'durable'}),{cacheTtlMs:60_000,durableCache:first,minIntervalMs:0});
    await fetcher('https://example.test/durable'); await first.close?.();
    const second=new SqliteResponseCache(path); let calls=0; const restored=createReliableFetcher(async()=>{calls++;return response(200);},{cacheTtlMs:60_000,durableCache:second,minIntervalMs:0});
    expect((await restored('https://example.test/durable')).headers.get('x-cache')).toBe('durable'); expect(calls).toBe(0); await second.close?.(); rmSync(directory,{recursive:true,force:true});
  });
});
