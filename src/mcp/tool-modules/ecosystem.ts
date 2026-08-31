import { z } from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/server';
import { HuggingFaceProvider } from '../../providers/huggingface.js';
import { GitHubProvider } from '../../providers/github.js';

export interface EcosystemToolDependencies { github?: GitHubProvider; huggingface?: HuggingFaceProvider; }
export function registerEcosystemTools(server: McpServer, dependencies: EcosystemToolDependencies = {}): void {
  const github = dependencies.github ?? new GitHubProvider();
  const huggingface = dependencies.huggingface ?? new HuggingFaceProvider();
  server.registerTool('find_implementations', { title: 'Find implementations', description: 'Find GitHub repositories related to a paper or method. Status is UNKNOWN unless separately verified.', inputSchema: z.object({method:z.string().min(1), limit:z.number().int().min(1).max(20).default(10)}) }, async ({method, limit}) => { const data=await github.searchRepositories(method,limit); return {content:[{type:'text' as const,text:data.length ? data.map(x=>`${x.fullName} — ${x.htmlUrl} [${x.implementationStatus}]`).join('\\n') : 'No repositories found. GitHub search is not evidence that a repository is official.'}],structuredContent:{data,source:'github',implementationStatusPolicy:'UNKNOWN until paper or author linkage is verified.'}}; });
  server.registerTool('find_models', { title: 'Find Hugging Face models', description: 'Find model repositories on Hugging Face, including revision and card metadata when available.', inputSchema: z.object({query:z.string().min(1), limit:z.number().int().min(1).max(20).default(10)}) }, async ({query, limit}) => { const data=await huggingface.searchModels(query,limit); return {content:[{type:'text' as const,text:data.length ? data.map(x=>`${x.id} — ${x.url}${x.sha ? ` (revision ${x.sha})` : ''}`).join('\\n') : 'No verified model repositories found.'}],structuredContent:{data,source:'huggingface'}}; });
  server.registerTool('find_datasets', { title: 'Find Hugging Face datasets', description: 'Find dataset repositories on Hugging Face, including revision and card metadata when available.', inputSchema: z.object({query:z.string().min(1), limit:z.number().int().min(1).max(20).default(10)}) }, async ({query, limit}) => { const data=await huggingface.searchDatasets(query,limit); return {content:[{type:'text' as const,text:data.length ? data.map(x=>`${x.id} — ${x.url}${x.sha ? ` (revision ${x.sha})` : ''}`).join('\\n') : 'No verified dataset repositories found.'}],structuredContent:{data,source:'huggingface'}}; });
}
