import { z } from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/server';
import type { ResearchService } from '../../research/service.js';
import { extractTrainingParameters } from '../../extraction/parameters.js';
import { extractResearchPropositions } from '../../extraction/propositions.js';
import { assembleExplicitParameterAnswer, assemblePropositionAnswer } from '../../research/answer-assembly.js';
import type { Locator } from '../../models/research.js';

export interface ReconstructionToolDependencies { research:ResearchService; }
const evidence=(id:string,sourceId:string,title:string,locator:Locator,text:string)=>({evidenceId:id,sourceId,authors:[],title,identifiers:{},locator,evidenceType:'DERIVED' as const,sourceQuality:'C' as const,evidence:text,citationText:`${sourceId}#${locator.section ?? locator.page ?? 'source'}`});
export function registerReconstructionTools(server:McpServer,dependencies:ReconstructionToolDependencies):void {
  server.registerTool('reconstruct_research', { title:'Reconstruct research evidence', description:'Extract a bounded structured answer from an acquired paper and optional exact pinned repository revision. Missing or unavailable evidence remains UNKNOWN; repository content is never executed.', inputSchema:z.object({paper_url:z.string().url().max(2048),question:z.string().min(1).max(500),fields:z.array(z.string().min(1).max(100)).min(1).max(10),repository_owner:z.string().regex(/^[A-Za-z0-9_.-]+$/).optional(),repository_name:z.string().regex(/^[A-Za-z0-9_.-]+$/).optional(),repository_commit_sha:z.string().regex(/^[0-9a-f]{40}$/i).optional()}).refine(value=>Boolean(value.repository_owner&&value.repository_name&&value.repository_commit_sha)||(!value.repository_owner&&!value.repository_name&&!value.repository_commit_sha),{message:'repository_owner, repository_name, and repository_commit_sha must be supplied together'}) }, async ({paper_url,question,fields,repository_owner,repository_name,repository_commit_sha})=>{
    try {
      const document=await dependencies.research.readPaper(paper_url); const parameters=extractTrainingParameters(document); const propositions=extractResearchPropositions(document,question);
      const paperParameterAnswer=assembleExplicitParameterAnswer(fields,parameters,(parameter,index)=>evidence(`paper-parameter-${parameter.name}-${index}`,paper_url,'Explicit paper parameter',parameter.locator,parameter.value));
      const paperPropositionAnswer=assemblePropositionAnswer(fields,propositions,(proposition,index)=>evidence(`paper-proposition-${proposition.field}-${index}`,paper_url,'Explicit paper proposition',proposition.locator,proposition.sourceText));
      const answer={...paperParameterAnswer.answer,...paperPropositionAnswer.answer}; const answerEvidence=[...paperParameterAnswer.evidence,...paperPropositionAnswer.evidence]; let repositoryResult;
      if(repository_owner&&repository_name&&repository_commit_sha) repositoryResult=await dependencies.research.readPinnedRepository(repository_owner,repository_name,repository_commit_sha);
      const status=Object.keys(answer).length===fields.length?'SUPPORTED':Object.keys(answer).length?'PARTIALLY_SUPPORTED':'UNKNOWN';
      return {content:[{type:'text' as const,text:`Research reconstruction ${status}: ${Object.keys(answer).length}/${fields.length} requested field(s) supported.`}],structuredContent:{question,paper:{url:paper_url,format:document.format,sections:document.sections.length,warnings:document.warnings},answer,status,evidence:answerEvidence,repository:repositoryResult ? {owner:repository_owner,repo:repository_name,commitSha:repository_commit_sha,filesRead:repositoryResult.filesRead,manifest:repositoryResult.manifest,evidence:repositoryResult.evidence,failures:repositoryResult.failures} : null,diagnostics:{paperInspection:'INSPECTED',repositoryInspection:repositoryResult ? repositoryResult.failures.length?'PARTIAL':'INSPECTED':'NOT_REQUESTED'}}};
    } catch(error) { return {content:[{type:'text' as const,text:`Research reconstruction failed: ${String(error)}`}],isError:true}; }
  });
}
