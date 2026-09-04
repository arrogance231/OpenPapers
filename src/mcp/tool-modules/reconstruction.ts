import { z } from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/server';
import type { ResearchService } from '../../research/service.js';
import { extractResearchFacts } from '../../research/facts.js';
import { interpretResearchQuery } from '../../research/query-intent.js';
import { assembleFactAnswer } from '../../research/answer-assembly.js';
import type { Locator } from '../../models/research.js';

export interface ReconstructionToolDependencies { research:ResearchService; }
export function registerReconstructionTools(server:McpServer,dependencies:ReconstructionToolDependencies):void {
  server.registerTool('reconstruct_research', { title:'Reconstruct research evidence', description:'Extract a bounded query-independent fact set from an acquired paper and optional exact pinned repository revision, then select facts using a separate query intent. Missing or unavailable evidence remains UNKNOWN; repository content is never executed.', inputSchema:z.object({paper_url:z.string().url().max(2048),question:z.string().min(1).max(500),fields:z.array(z.string().min(1).max(100)).min(1).max(10),repository_owner:z.string().regex(/^[A-Za-z0-9_.-]+$/).optional(),repository_name:z.string().regex(/^[A-Za-z0-9_.-]+$/).optional(),repository_commit_sha:z.string().regex(/^[0-9a-f]{40}$/i).optional()}).refine(value=>Boolean(value.repository_owner&&value.repository_name&&value.repository_commit_sha)||(!value.repository_owner&&!value.repository_name&&!value.repository_commit_sha),{message:'repository_owner, repository_name, and repository_commit_sha must be supplied together'}) }, async ({paper_url,question,fields,repository_owner,repository_name,repository_commit_sha})=>{
    try {
      const document=await dependencies.research.readPaper(paper_url); const facts=extractResearchFacts(document); const intent=interpretResearchQuery(question,fields); const assembled=assembleFactAnswer(intent,facts); let repositoryResult;
      if(repository_owner&&repository_name&&repository_commit_sha) repositoryResult=await dependencies.research.readPinnedRepository(repository_owner,repository_name,repository_commit_sha);
      const status=assembled.status==='CONFLICTING'?'CONFLICTING':assembled.status; return {content:[{type:'text' as const,text:`Research reconstruction ${status}: ${Object.keys(assembled.answer).length}/${intent.predicates.length} requested predicate(s) supported.`}],structuredContent:{question,intent,factCount:facts.length,paper:{url:paper_url,format:document.format,sections:document.sections.length,warnings:document.warnings},answer:assembled.answer,status,evidence:assembled.evidence,facts,repository:repositoryResult ? {owner:repository_owner,repo:repository_name,commitSha:repository_commit_sha,filesRead:repositoryResult.filesRead,manifest:repositoryResult.manifest,evidence:repositoryResult.evidence,failures:repositoryResult.failures} : null,diagnostics:{paperInspection:'INSPECTED',repositoryInspection:repositoryResult ? repositoryResult.failures.length?'PARTIAL':'INSPECTED':'NOT_REQUESTED'}}};
    } catch(error) { return {content:[{type:'text' as const,text:`Research reconstruction failed: ${String(error)}`}],isError:true}; }
  });
}
void (undefined as Locator|undefined);
