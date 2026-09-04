import { describe, expect, it } from 'vitest';
import { classifyResearchTaskStatus } from '../evals/metrics/research-tasks.mjs';

const supported = new Set(['optimizer', 'learning_rate', 'batch_size', 'epochs']);

describe('research-task status metrics', () => {
  it('does not call a partially reconstructed answer supported', () => {
    const task = { expectedStatus: 'SUPPORTED', expectedAnswer: { batch_size: '32', epochs: '3' }, evidenceHtml: '' };
    expect(classifyResearchTaskStatus(task, { epochs: '3' }, supported)).toBe('PARTIALLY_SUPPORTED');
    expect(classifyResearchTaskStatus(task, { batch_size: '32', epochs: '3' }, supported)).toBe('SUPPORTED');
    expect(classifyResearchTaskStatus(task, {}, supported)).toBe('UNKNOWN');
  });
});