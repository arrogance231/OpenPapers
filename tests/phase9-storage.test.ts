import { describe, expect, it } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import type { AsyncResearchStore, PostgresQueryClient } from '../src/database/store.js';

const acceptsStore=(store:AsyncResearchStore):AsyncResearchStore=>store;

describe('storage contracts',()=>{
  it('accepts the SQLite implementation through the shared store contract', async () =>{ const db=new ResearchDb(':memory:'); expect(acceptsStore(db)).toBe(db); await db.close(); });
  it('defines an injected Postgres query boundary without requiring a driver', async () =>{ const client:PostgresQueryClient={query:async()=>({rows:[]}),close:async()=>{}}; expect(typeof client.query).toBe('function'); });
});