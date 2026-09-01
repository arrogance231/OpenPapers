import { describe, expect, it } from 'vitest';
import { registerTools } from '../src/mcp/tools.js';

describe('Phase 7 public tool inventory', () => {
  it('registers every Phase 7 research tool', () => {
    const names: string[] = [];
    const server = { registerTool(name: string) { names.push(name); } };
    registerTools(server as any, {} as any);
    expect(names).toEqual(expect.arrayContaining([
      'get_references','get_citations','get_related_papers','research_method',
      'find_implementations','get_repository_config','find_datasets','find_models',
      'compare_papers','compare_methods','verify_claim','build_research_report','compare_paper_to_code','create_collection','list_collections','add_paper_to_collection','remove_paper_from_collection','delete_collection'
    ]));
  });
});
