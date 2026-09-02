import { createReliableFetcher, type ReliableFetcherOptions } from './reliability.js';
import { SqliteResponseCache } from './durable-cache.js';

const durableCache=process.env.RESEARCH_CACHE_PATH ? new SqliteResponseCache(process.env.RESEARCH_CACHE_PATH) : undefined;
export const createConfiguredProviderFetcher=(fetcher:typeof fetch, options:ReliableFetcherOptions={}):typeof fetch=>{
  const configured:ReliableFetcherOptions={...options};
  if(configured.cacheTtlMs===undefined&&durableCache) configured.cacheTtlMs=Number(process.env.RESEARCH_CACHE_TTL_MS ?? 30000);
  if(durableCache) configured.durableCache=durableCache;
  return createReliableFetcher(fetcher,configured);
};
