import { describe, expect, it } from 'vitest';
import { registerEcosystemTools } from '../src/mcp/tool-modules/ecosystem.js';

function registered() { const handlers = new Map<string, (args: any) => Promise<any>>(); const server={registerTool(name:string,_config:unknown,handler:(args:any)=>Promise<any>){handlers.set(name,handler);}}; return {server,handlers}; }

describe('ecosystem MCP evidence boundary', () => {
  it('attaches formal evidence to model and dataset results', async () => {
    const {server,handlers}=registered();
    const hub={searchModels:async()=>[{id:'org/model',kind:'model',url:'https://huggingface.co/org/model',sha:'rev',paperLinks:[]}],searchDatasets:async()=>[{id:'org/data',kind:'dataset',url:'https://huggingface.co/org/data',sha:'rev',paperLinks:[]}]};
    registerEcosystemTools(server as any,{huggingface:hub as any});
    const models=await handlers.get('find_models')!({query:'model',limit:1});
    const datasets=await handlers.get('find_datasets')!({query:'data',limit:1});
    expect(models.structuredContent.evidence[0]).toMatchObject({sourceId:'https://huggingface.co/org/model',evidenceType:'SECONDARY_SOURCE'});
    expect(datasets.structuredContent.evidence[0]).toMatchObject({sourceId:'https://huggingface.co/org/data',evidenceType:'SECONDARY_SOURCE'});
  });
  it('attaches neutral repository evidence to method-only implementation searches', async () => {
    const {server,handlers}=registered();
    const github={searchRepositories:async()=>[{id:1,fullName:'org/repo',name:'repo',owner:'org',htmlUrl:'https://github.com/org/repo',topics:[],implementationStatus:'UNKNOWN',source:'github'}]};
    registerEcosystemTools(server as any,{github:github as any});
    const response=await handlers.get('find_implementations')!({method:'contrastive learning',limit:1});
    expect(response.structuredContent.evidence[0]).toMatchObject({sourceId:'https://github.com/org/repo',evidenceType:'SECONDARY_SOURCE'});
  });
});
