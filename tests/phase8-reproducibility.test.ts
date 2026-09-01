import { describe, expect, it } from 'vitest';
import { compareRecipeToConfig } from '../src/research/reproducibility.js';

describe('paper versus code reproducibility comparison', () => {
  it('reports explicit parameter conflicts with code configuration', () => {
    const recipe = { learning_rate:{value:0.0001,status:'REPORTED' as const,sources:['https://example.com/paper']}, batch_size:{value:32,status:'REPORTED' as const,sources:['https://example.com/paper']} } as any;
    const result = compareRecipeToConfig(recipe,[{name:'learning_rate',value:'0.0002',lineStart:4,lineEnd:4},{name:'batch_size',value:'32',lineStart:5,lineEnd:5}],{url:'https://github.com/org/repo/blob/abc/config.yaml',commitSha:'abc'});
    expect(result.conflicts).toEqual([expect.objectContaining({field:'learning_rate',paperValue:'0.0001',codeValue:'0.0002'})]);
    expect(result.matches).toEqual([expect.objectContaining({field:'batch_size'})]);
  });
});
