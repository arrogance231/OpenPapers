import { describe, expect, it } from 'vitest';
import { registerReconstructionTools } from '../src/mcp/tool-modules/reconstruction.js';

describe('real reconstruction MCP boundary',()=>{
  it('registers one bounded reconstruction tool',()=>{const names:string[]=[];registerReconstructionTools({registerTool:(name:string,_config:unknown)=>{names.push(name);}} as any,{research:{} as any});expect(names).toEqual(['reconstruct_research']);});
  it('returns UNKNOWN rather than fabricating when no supported field is extracted',async()=>{
    let handler:any; const service={readPaper:async()=>({format:'pdf',sections:[{level:0,heading:'Page 1',text:'No requested setting.',page:1}],warnings:[]}),readPinnedRepository:async()=>({filesRead:0,manifest:[],evidence:[],failures:[]})};
    registerReconstructionTools({registerTool:(_name:string,_config:unknown,fn:any)=>{handler=fn;}} as any,{research:service as any});
    const result=await handler({paper_url:'https://example.test/paper.pdf',question:'What GPU count was used for training?',fields:['gpu_count']});
    expect(result.structuredContent).toMatchObject({answer:{},status:'UNKNOWN',diagnostics:{paperInspection:'INSPECTED',repositoryInspection:'NOT_REQUESTED'}});
  });
});
