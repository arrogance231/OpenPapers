import { describe, expect, it } from 'vitest';
import { extractConfigFields } from '../src/research/config-extraction.js';

describe('configuration extraction', () => {
  it('extracts scalar YAML fields with exact line locators', () => {
    const result = extractConfigFields('learning_rate: 0.00002\nbatch_size: 4\n# ignored\n', 'config.yaml');
    expect(result.format).toBe('yaml');
    expect(result.fields).toEqual([
      { name: 'learning_rate', value: '0.00002', lineStart: 1, lineEnd: 1 },
      { name: 'batch_size', value: '4', lineStart: 2, lineEnd: 2 }
    ]);
  });

  it('extracts top-level JSON scalar fields and preserves source lines', () => {
    const result = extractConfigFields('{\n  "epochs": 3,\n  "precision": "bf16"\n}\n', 'training_config.json');
    expect(result.format).toBe('json');
    expect(result.fields).toContainEqual({ name: 'epochs', value: '3', lineStart: 2, lineEnd: 2 });
    expect(result.fields).toContainEqual({ name: 'precision', value: 'bf16', lineStart: 3, lineEnd: 3 });
  });

  it('reports unsupported or malformed syntax without guessing', () => {
    const result = extractConfigFields('learning_rate: [not closed\n', 'config.yaml');
    expect(result.fields).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
