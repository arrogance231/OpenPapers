import { describe, expect, it } from 'vitest';
import { createHttpHandler } from '../src/mcp/server.js';
import { ResearchService } from '../src/research/service.js';
import { author, makeEvidence } from '../src/research/citations.js';

async function call(handler:ReturnType<typeof createHttpHandler>,method:string,params:Record<string,unknown>={},id=1){
  const response=await handler.fetch(new Request('http://localhost/mcp',{method:'POST',headers:{'content-type':'application/json','accept':'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id,method,params})}));
  const text=await response.text();let body:any;try{body=JSON.parse(text);}catch{const data=text.split('\n').find(line=>line.startsWith('data:'));if(!data)throw new Error(`missing JSON-RPC data event: ${text}`);body=JSON.parse(data.slice(5).trim());}return {status:response.status,body};
}

describe('MCP SDK transport boundary',()=>{
  it('serves initialize and tool discovery through the real handler',async()=>{
    const handler=createHttpHandler(new ResearchService());
    const initialized=await call(handler,'initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'1'}});
    expect(initialized.status).toBe(200); expect(initialized.body.result.protocolVersion).toBeTruthy();
    const listed=await call(handler,'tools/list');
    expect(listed.status).toBe(200); expect(listed.body.result.tools.length).toBe(37); await handler.close();
  });
  it('returns protocol-level errors for invalid input',async()=>{
    const handler=createHttpHandler(new ResearchService());
    const result=await call(handler,'tools/call',{name:'search_papers',arguments:{query:''}});
    expect(result.status).toBe(200); expect(result.body.result.isError).toBe(true); await handler.close();
  });
  it('returns an error result for provider failure',async()=>{
    class FailingService extends ResearchService { override async search(){throw new Error('provider timeout');} }
    const handler=createHttpHandler(new FailingService()); const result=await call(handler,'tools/call',{name:'search_papers',arguments:{query:'transformers'}});
    expect(result.body.result.isError).toBe(true); expect(JSON.stringify(result.body)).toContain('provider timeout'); expect(JSON.stringify(result.body)).not.toContain('stack'); await handler.close();
  });
  it('returns an evidence-bearing research report through the real transport',async()=>{
    const work={paperId:'paper-transport',title:'Transport Research',authors:[author('Researcher')],year:2025,publicationStatus:'preprint' as const,bibtex:'',sourceProviders:['fixture'],versions:[]};
    const evidence=makeEvidence(work.paperId,work,'The optimizer is AdamW.');
    class FixtureService extends ResearchService { override async buildResearchReport(){return {summary:`AdamW ${evidence.citationText}`,data:{query:'optimizer',mode:'literature_review' as const,facts:['The optimizer is AdamW.'],recommendations:[],timeline:[]},evidence:[evidence],references:[work],transparency:{expandedQueries:[],sourcesSearched:['fixture'],candidates:1,retrievedAt:'2026-01-01T00:00:00.000Z',rankingRationale:[]}};} }
    const handler=createHttpHandler(new FixtureService()); const result=await call(handler,'tools/call',{name:'build_research_report',arguments:{query:'optimizer',mode:'literature_review',limit:1}});
    expect(result.status).toBe(200); expect(result.body.result.isError).not.toBe(true); expect(result.body.result.structuredContent.data.facts).toContain('The optimizer is AdamW.'); expect(JSON.stringify(result.body)).toContain(evidence.citationText); await handler.close();
  });
});
