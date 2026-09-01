import { describe, expect, it, vi } from 'vitest';
import { registerTools } from '../src/mcp/tools.js';
import { ResearchDb } from '../src/database/db.js';
import { ResearchService } from '../src/research/service.js';
import { makeEvidence } from '../src/research/citations.js';

function capture() { const handlers=new Map<string,(args:any)=>Promise<any>>(); const server={registerTool(name:string,_config:unknown,handler:(args:any)=>Promise<any>){handlers.set(name,handler);}}; return {server,handlers}; }
const paper={paperId:'https://example.com/paper',title:'Recipe Paper',authors:[{name:'Author',normalizedName:'author'}],publicationStatus:'unknown' as const,bibtex:'',sourceProviders:['paper'],versions:[]};
const evidence=makeEvidence(paper.paperId,paper,'Metadata');

describe('Phase 8 training recipe MCP boundary',()=>{
  it('preserves reported recipe fields and evidence',async()=>{
    const {server,handlers}=capture();
    registerTools(server as any,{recipeFromPaper:vi.fn().mockResolvedValue({summary:'Recipe extracted. [Author]',data:{method:'student model',learning_rate:{value:0.0001,status:'REPORTED',sources:[paper.paperId]}},evidence:[evidence],references:[paper],transparency:{expandedQueries:[],sourcesSearched:['paper'],candidates:1,retrievedAt:'now',rankingRationale:[]}})} as any);
    const response=await handlers.get('extract_training_recipe_from_url')!({url:paper.paperId});
    expect(response.structuredContent.data.method).toBe('student model');
    expect(response.structuredContent.evidence).toEqual([evidence]);
  });
  it('serializes the real enriched recipe without discarding derived facts',async()=>{
    const body=new TextEncoder().encode('<h1>Method</h1><p>We train a student model.</p><h1>Dataset</h1><p>We use WikiText.</p>');
    const acquirer={acquire:async()=>({url:'https://example.com/real.html',contentType:'text/html',bytes:body.byteLength,body})};
    const research=new ResearchService(new ResearchDb(':memory:'),undefined,undefined,undefined,undefined,acquirer as never);
    const {server,handlers}=capture(); registerTools(server as any,research);
    const response=await handlers.get('extract_training_recipe_from_url')!({url:'https://example.com/real.html'});
    expect(response.isError).not.toBe(true);
    expect(response.structuredContent.data.method).toContain('student model');
  });
});
