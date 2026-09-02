import { describe, expect, it, vi } from 'vitest';
import { registerTools } from '../src/mcp/tools.js';

function capture(){const handlers=new Map<string,(args:any)=>Promise<any>>(); const server={registerTool(name:string,_config:unknown,handler:(args:any)=>Promise<any>){handlers.set(name,handler);}}; return handlers;}

describe('model-style MCP workflow',()=>{
  it('discovers then invokes a bounded local tool without provider calls',async()=>{
    const collections=[{id:'collection-a',name:'benchmarks',paperIds:[]}]; const research={listCollections:vi.fn().mockReturnValue(collections)}; const handlers=capture(); registerTools({registerTool:(...args:any[])=>handlers.set(args[0],args[2])} as any,research as any);
    expect(handlers.has('list_collections')).toBe(true); const result=await handlers.get('list_collections')!({}); expect(result.structuredContent).toEqual({collections}); expect(research.listCollections).toHaveBeenCalled();
  });
  it('preserves structured error output for an invalid model-selected tool call',async()=>{const handlers=capture(); registerTools({registerTool:(...args:any[])=>handlers.set(args[0],args[2])} as any,{createCollection:vi.fn().mockImplementation(()=>{throw new Error('collection name must not be empty');})} as any); const result=await handlers.get('create_collection')!({name:''}); expect(result.isError).toBe(true); expect(result.content[0].text).toContain('collection name must not be empty');});
});
