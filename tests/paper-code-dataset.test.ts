import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { paperCodeMetrics } from '../evals/metrics/paper-code.mjs';

const dataset = JSON.parse(readFileSync(new URL('../evals/datasets/paper-code-v1.json', import.meta.url), 'utf8')) as { version: string; cases: Array<{ repository: { commitSha: string }; officialLinkage: { evidenceUrl: string; sourceClass: string }; fields: Array<{ expected: string }> }> };

describe('official paper/code gold dataset', () => {
  it('contains revision-pinned, provenance-bearing cases', () => {
    expect(dataset.version).toBe('paper-code-v1');
    expect(dataset.cases.length).toBeGreaterThanOrEqual(15);
    for (const item of dataset.cases) {
      expect(item.repository.commitSha).toMatch(/^[0-9a-f]{40}$/);
      expect(item.officialLinkage.evidenceUrl).toMatch(/^https:\/\/github\.com\//);
      expect(item.officialLinkage.sourceClass).toBeTruthy();
      expect(item.fields.length).toBeGreaterThan(0);
      for (const field of item.fields) expect(field.expected).toMatch(/^(MATCH|PARTIAL_MATCH|CONFLICT|MISSING_IN_PAPER|MISSING_IN_CODE|UNKNOWN)$/);
    }
  });

  it('does not count absent paper/code values as agreement', () => {
    const result = paperCodeMetrics([
      { field: 'learning_rate', expected: 'MISSING_IN_PAPER', predicted: 'MISSING_IN_PAPER' },
      { field: 'batch_size', expected: 'MISSING_IN_CODE', predicted: 'MISSING_IN_CODE' },
      { field: 'optimizer', expected: 'MATCH', predicted: 'MATCH' }
    ]);
    expect(result.exactAgreementAccuracy).toBe(1);
    expect(result.falseAgreementRate).toBe(0);
    expect(result.missingInPaperAccuracy).toBe(1);
    expect(result.missingInCodeAccuracy).toBe(1);
  });
});