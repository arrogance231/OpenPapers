import { describe, expect, it } from 'vitest';
import { ResearchDb } from '../src/database/db.js';
import { ResearchService } from '../src/research/service.js';

describe('Phase 8 training recipe projection', () => {
  it('projects methodology, losses, and datasets from extracted facts', async () => {
    const html = '<html><head><title>Recipe</title></head><body><h1>Method</h1><p>We train a student model.</p><h1>Loss</h1><p>We optimize cross entropy loss.</p><h1>Dataset</h1><p>We use the WikiText dataset.</p></body></html>';
    const body = new TextEncoder().encode(html);
    const acquirer = { acquire: async () => ({ url:'https://example.com/recipe.html', contentType:'text/html', bytes:body.byteLength, body }) };
    const recipe = await new ResearchService(new ResearchDb(':memory:'), undefined, undefined, undefined, undefined, acquirer as never).recipeFromPaper('https://example.com/recipe.html');
    expect(recipe.data.method).toContain('student model');
    expect(recipe.data.losses).toMatchObject({status:'REPORTED'});
    expect(recipe.data.datasets).toMatchObject({status:'REPORTED'});
  });
});
