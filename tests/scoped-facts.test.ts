import { describe, expect, it } from 'vitest';
import dataset from '../evals/datasets/research-facts-v5-development.json';
import { aggregateScoped, equivalentValue, scoreScopedPaper, validateScopedFactDataset } from '../evals/metrics/scoped-facts.mjs';

describe('V5 exhaustive scoped fact benchmark', () => {
  it('validates independent, exhaustive-within-scope gold', () => {
    expect(validateScopedFactDataset(dataset)).toEqual([]);
    expect(dataset.papers).toHaveLength(6);
    expect(dataset.papers.reduce((n, paper) => n + paper.goldFacts.length, 0)).toBe(7);
  });

  it('only applies explicit equivalences and never fuzzy matches', () => {
    expect(equivalentValue('bfloat16', 'bf16')).toBe(true);
    expect(equivalentValue('Direct Preference Optimization', 'DPO')).toBe(true);
    expect(equivalentValue('AdamW', 'Adam')).toBe(false);
    expect(equivalentValue('12 layers', '12')).toBe(false);
  });

  it('counts TP/FP/FN and out-of-scope separately', () => {
    const paper = dataset.papers[0];
    const row = scoreScopedPaper(paper, [
      { kind:'training_stage', text:'unrelated', locator:{section:'Results'} },
      { kind:'training_stage', text:paper.sourceSections[0].text, locator:{section:'Training'} }
    ]);
    expect(row.outOfScope).toBe(1);
    expect(row.fp).toBe(1);
    expect(row.fn).toBe(2);
    expect(aggregateScoped([row]).tp).toBe(0);
  });
});
