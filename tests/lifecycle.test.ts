import { describe, expect, it, vi } from 'vitest';
import { createShutdownController } from '../src/mcp/lifecycle.js';

describe('HTTP shutdown lifecycle', () => {
  it('runs cleanup steps once when shutdown is called concurrently', async () => {
    const closeTransport=vi.fn(async()=>undefined); const flush=vi.fn(async()=>undefined); const closeStorage=vi.fn(async()=>undefined);
    const shutdown=createShutdownController([closeTransport,flush,closeStorage]);
    await Promise.all([shutdown(),shutdown(),shutdown()]);
    expect(closeTransport).toHaveBeenCalledOnce(); expect(flush).toHaveBeenCalledOnce(); expect(closeStorage).toHaveBeenCalledOnce();
  });
  it('attempts later cleanup steps when an earlier step fails', async () => {
    const failure=new Error('transport close failed'); const closeTransport=vi.fn(async()=>{throw failure;}); const closeStorage=vi.fn(async()=>undefined);
    const shutdown=createShutdownController([closeTransport,closeStorage]);
    await expect(shutdown()).rejects.toBe(failure);
    expect(closeStorage).toHaveBeenCalledOnce();
    await expect(shutdown()).rejects.toBe(failure);
    expect(closeTransport).toHaveBeenCalledOnce();
  });
});
