import { describe, expect, it, vi } from 'vitest';
import { registerTools } from '../src/mcp/tools.js';

function capture() { const handlers=new Map<string,(args:any)=>Promise<any>>(); const server={registerTool(name:string,_config:unknown,handler:(args:any)=>Promise<any>){handlers.set(name,handler);}}; return {server,handlers}; }

describe('Phase 9 collection MCP boundary',()=>{
  it('creates, lists, and adds papers through public handlers',async()=>{
    const collection={id:'collection-a',name:'papers',paperIds:[]}; const research={createCollection:vi.fn().mockReturnValue(collection),listCollections:vi.fn().mockReturnValue([collection]),addToCollection:vi.fn(),removeFromCollection:vi.fn(),deleteCollection:vi.fn()}; const {server,handlers}=capture(); registerTools(server as any,research as any);
    expect((await handlers.get('create_collection')!({name:'papers'})).structuredContent.collection).toEqual(collection);
    expect((await handlers.get('list_collections')!({})).structuredContent.collections).toEqual([collection]);
    expect((await handlers.get('add_paper_to_collection')!({collection_id:'collection-a',paper_id:'paper-a'})).structuredContent).toEqual({collectionId:'collection-a',paperId:'paper-a'});
    expect(research.addToCollection).toHaveBeenCalledWith('collection-a','paper-a');
    expect((await handlers.get('remove_paper_from_collection')!({collection_id:'collection-a',paper_id:'paper-a'})).structuredContent).toEqual({collectionId:'collection-a',paperId:'paper-a'});
    expect((await handlers.get('delete_collection')!({collection_id:'collection-a'})).structuredContent).toEqual({collectionId:'collection-a'});
    expect(research.removeFromCollection).toHaveBeenCalledWith('collection-a','paper-a');
    expect(research.deleteCollection).toHaveBeenCalledWith('collection-a');
  });
  it('returns collection membership failures as structured MCP errors',async()=>{
    const {server,handlers}=capture(); registerTools(server as any,{addToCollection:vi.fn().mockImplementation(()=>{throw new Error('NOT_FOUND: paper does not exist');})} as any);
    const response=await handlers.get('add_paper_to_collection')!({collection_id:'missing',paper_id:'paper-a'});
    expect(response.isError).toBe(true); expect(response.content[0].text).toContain('NOT_FOUND');
  });
  it('exports ResearchPacks through the public handler',async()=>{
    const pack={format:'openpapers.research-pack.v1',collection:{id:'collection-a',name:'papers'},papers:[],evidence:[]}; const {server,handlers}=capture(); registerTools(server as any,{buildResearchPack:vi.fn().mockReturnValue(pack)} as any);
    const response=await handlers.get('export_research_pack')!({collection_id:'collection-a'});
    expect(response.structuredContent).toEqual(pack); expect(response.content[0].text).toContain('0 paper(s)');
  });
});
