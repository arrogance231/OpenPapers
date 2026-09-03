import { describe, expect, it, vi } from 'vitest';
import { PostgresResearchStore } from '../src/database/postgres.js';
import { ResearchService } from '../src/research/service.js';

describe('PostgreSQL hardening contracts', () => {
  it('propagates a rejected write through the async repository boundary', async () => {
    const query = vi.fn().mockRejectedValueOnce(new Error('write failed'));
    const store = PostgresResearchStore.fromQueryClient({ query, close: vi.fn(async () => undefined) } as any);
    await expect(store.upsertWork({ paperId: 'paper-1', title: 'Test' } as any)).rejects.toThrow('write failed');
    await expect(store.flush()).resolves.toBeUndefined();
  });

  it('does not expose a work from the local mirror when its durable write fails', async () => {
    const query = vi.fn().mockRejectedValueOnce(new Error('write failed'));
    const store = PostgresResearchStore.fromQueryClient({ query, close: vi.fn(async () => undefined) } as any);
    await expect(store.upsertWork({ paperId: 'paper-1', title: 'Test' } as any)).rejects.toThrow('write failed');
    await expect(store.getWork('paper-1')).resolves.toBeUndefined();
  });

  it('allows later writes after an earlier queued write fails', async () => {
    const query = vi.fn().mockRejectedValueOnce(new Error('write failed')).mockResolvedValue({ rows: [] });
    const store = PostgresResearchStore.fromQueryClient({ query, close: vi.fn(async () => undefined) } as any);
    await expect(store.upsertWork({ paperId: 'paper-1', title: 'Test' } as any)).rejects.toThrow('write failed');
    await expect(store.upsertWork({ paperId: 'paper-2', title: 'Test 2' } as any)).resolves.toBeUndefined();
    await expect(store.getWork('paper-2')).resolves.toMatchObject({paperId:'paper-2'});
  });

  it('uses SQL cosine distance for vector ranking', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [
      { record_id: 'near', score: '1' },
      { record_id: 'far', score: '0' },
    ] });
    const store = PostgresResearchStore.fromQueryClient({ query, close: vi.fn(async () => undefined) } as any);
    await expect(store.searchVectorsSql([1, 0], 2)).resolves.toEqual([
      { recordId: 'near', score: 1, payload: undefined },
      { recordId: 'far', score: 0, payload: undefined },
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('<=>'), ['[1,0]', 2]);
  });

  it('preserves adapter context when the service flushes storage', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const store = PostgresResearchStore.fromQueryClient({ query, close: vi.fn(async () => undefined) } as any);
    await new ResearchService(store).flushStorage();
    expect(query).not.toHaveBeenCalled();
  });

  it('commits successful transactions and rolls back failures', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const store = PostgresResearchStore.fromQueryClient({ query, close: vi.fn(async () => undefined) } as any);
    await store.withTransaction(async tx => { await tx('INSERT INTO works VALUES ($1,$2)', ['id', {}]); return 'ok'; });
    expect(query.mock.calls.map(call => call[0])).toEqual(['BEGIN', 'INSERT INTO works VALUES ($1,$2)', 'COMMIT']);

    query.mockClear().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }).mockRejectedValueOnce(new Error('transaction failed')).mockResolvedValueOnce({ rows: [] });
    await expect(store.withTransaction(async tx => { await tx('INSERT INTO works VALUES ($1,$2)', ['id', {}]); throw new Error('transaction failed'); })).rejects.toThrow('transaction failed');
    expect(query.mock.calls.map(call => call[0])).toEqual(['BEGIN', 'INSERT INTO works VALUES ($1,$2)', 'ROLLBACK']);
  });
  it('uses one checked-out client for production transactions', async () => {
    const poolQuery = vi.fn().mockResolvedValue({rows:[]});
    const clientQuery = vi.fn().mockResolvedValue({rows:[]});
    const release = vi.fn();
    const store = PostgresResearchStore.fromQueryClient({query:poolQuery,connect:vi.fn(async()=>({query:clientQuery,release})),close:vi.fn(async()=>undefined)} as any);
    await store.withTransaction(async tx => { await tx('UPDATE works SET payload=$1', [{}]); });
    expect(clientQuery.mock.calls.map(call=>call[0])).toEqual(['BEGIN','UPDATE works SET payload=$1','COMMIT']);
    expect(poolQuery).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledOnce();
  });
});