import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ResearchDb } from '../src/database/db.js';
import { ResearchService } from '../src/research/service.js';

describe('real-paper fixture ingestion',()=>{
  it('runs one bounded fixture through parsing, facts, claims, parameters, recipe, and persistence',async()=>{
    const url='https://fixture.test/attention-is-all-you-need.html'; const body=readFileSync('tests/fixtures/attention-is-all-you-need.html');
    const db=new ResearchDb(':memory:'); const acquirer={acquire:async()=>({url,contentType:'text/html',bytes:body.byteLength,body:new Uint8Array(body)})}; const service=new ResearchService(db,undefined as any,undefined as any,undefined as any,undefined as any,acquirer as any);
    const document=await service.readPaper(url); const facts=await service.extractPaperFacts(url); const claims=await service.extractPaperClaims(url); const parameters=await service.extractTrainingParameters(url); const recipe=await service.recipeFromPaper(url);
    expect(document.title).toBe('Attention Is All You Need'); expect(facts.some(fact=>fact.kind==='methodology')).toBe(true); expect(claims.claims.length).toBeGreaterThan(0); expect(parameters.map(item=>item.name)).toEqual(expect.arrayContaining(['learning_rate','batch_size','epochs'])); expect(recipe.data.datasets.status).toBe('REPORTED'); expect(db.getClaims().length).toBeGreaterThan(0); db.close();
  });
});
