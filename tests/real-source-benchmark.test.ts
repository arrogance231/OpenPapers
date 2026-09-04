import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { scoreRealSourceRows } from '../evals/metrics/real-source.mjs';

const root = join(process.cwd());
const dataset = JSON.parse(readFileSync(join(root, 'evals/datasets/research-real-v1.json'), 'utf8'));

describe('real-source benchmark contract', () => {
  it('contains a paper-level development/holdout split with pinned versions', () => {
    expect(dataset.version).toBe('research-real-v1');
    expect(dataset.cases).toHaveLength(19);
    expect(dataset.cases.filter(item => item.split === 'development')).toHaveLength(13);
    expect(dataset.cases.filter(item => item.split === 'holdout')).toHaveLength(6);
    for (const item of dataset.cases) {
      expect(item.source.arxivVersion).toMatch(/^v\d+$/);
      if (item.source.repositoryUrl) expect(item.source.repositoryCommitSha).toMatch(/^[0-9a-f]{40}$/);
    }
  });
  it('keeps fabrication and uncertainty metrics separate', () => {
    const result = scoreRealSourceRows([
      { expectedStatus: 'UNKNOWN', actualStatus: 'UNKNOWN', actualAnswer: {} },
      { expectedStatus: 'SUPPORTED', actualStatus: 'UNKNOWN', actualAnswer: {} },
      { expectedStatus: 'NOT_REPORTED', actualStatus: 'PARTIALLY_SUPPORTED', actualAnswer: { optimizer: 'Adam' } }
    ]);
    expect(result.correctUNKNOWN).toBe(1);
    expect(result.falseUNKNOWN).toBeCloseTo(1 / 3);
    expect(result.fabricatedAnswerRate).toBeCloseTo(1 / 3);
    expect(result.workAccuracy).toBeNull();
  });
});
