import { describe, expect, it } from 'vitest';
import { paperCodeMetrics } from '../evals/metrics/paper-code.mjs';

describe('paper/code metrics',()=>{
  it('separates agreement, conflict, unknown, and false agreement',()=>{
    const result=paperCodeMetrics([
      {field:'optimizer',expected:'MATCH',predicted:'MATCH'},
      {field:'learning_rate',expected:'CONFLICT',predicted:'CONFLICT'},
      {field:'batch_size',expected:'UNKNOWN',predicted:'UNKNOWN'},
      {field:'epochs',expected:'MISSING_IN_CODE',predicted:'MATCH'},
      {field:'steps',expected:'MISSING_IN_PAPER',predicted:'CONFLICT'}
    ]);
    expect(result.classificationAccuracy).toBe(0.6);
    expect(result.conflictPrecision).toBe(0.5);
    expect(result.conflictRecall).toBe(1);
    expect(result.falseAgreementRate).toBe(0.2);
    expect(result.falseConflictRate).toBe(0.2);
    expect(result.correctUnknownRate).toBe(1);
    expect(result.byField.optimizer.classificationAccuracy).toBe(1);
  });
});
