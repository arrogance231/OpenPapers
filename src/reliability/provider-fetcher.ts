import { createReliableFetcher, type ReliableFetcherOptions } from './reliability.js';
import { SqliteResponseCache } from './durable-cache.js';
import { createStructuredLogger } from './logger.js';

const durableCache=process.env.RESEARCH_CACHE_PATH ? new SqliteResponseCache(process.env.RESEARCH_CACHE_PATH) : undefined;
const logger=createStructuredLogger({minLevel:'warn'});
export const createConfiguredProviderFetcher=(fetcher:typeof fetch, options:ReliableFetcherOptions={}):typeof fetch=>{
  const configured:ReliableFetcherOptions={...options};
  if(configured.cacheTtlMs===undefined&&durableCache) configured.cacheTtlMs=Number(process.env.RESEARCH_CACHE_TTL_MS ?? 30000);
  if(durableCache) configured.durableCache=durableCache;
  if(configured.logger===undefined) configured.logger=logger;
  return createReliableFetcher(fetcher,configured);
};
