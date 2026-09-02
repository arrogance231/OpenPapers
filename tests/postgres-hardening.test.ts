import { describe, expect, it, vi } from 'vitest';
import { PostgresResearchStore } from '../src/database/postgres.js';

describe('PostgreSQL hardening contracts', () => {
  it('propagates a rejected queued write through flush', async () => {
    const query = vi.fn().mockRejectedValueOnce(new Error('write failed'));
    const store = PostgresResearchStore.fromQueryClient({ query, close: vi.fn(async () => undefined) } as any);
    store.upsertWork({ paperId: 'paper-1', title: 'Test' } as any);
    await expect(store.flush()).rejects.toThrow('write failed');
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
});
