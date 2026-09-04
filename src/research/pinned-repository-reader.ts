
import { GitHubProvider, type GitHubContent, type GitHubDirectoryEntry } from '../providers/github.js';
import type { RepositoryEvidence, RepositoryManifestEntry } from './repository-evidence.js';
import { extractPinnedRepositoryEvidence, manifestEntry, selectRepositoryFiles } from './repository-evidence.js';

const ignored=/^(?:vendor|node_modules|dist|build|out|checkpoints?|weights?|data|datasets?)\//i;
export interface PinnedRepositoryRead { evidence:RepositoryEvidence[]; manifest:RepositoryManifestEntry[]; failures:string[]; filesRead:number; }
export class PinnedRepositoryReader {
  constructor(private readonly provider:Pick<GitHubProvider,'listContents'|'getContent'>=new GitHubProvider(), private readonly maxFiles=30, private readonly maxBytes=256_000) {}
  async read(owner:string,repo:string,commitSha:string):Promise<PinnedRepositoryRead> {
    if(!/^[0-9a-f]{40}$/i.test(commitSha))throw new Error('commitSha must be a 40-character SHA');
    const entries:GitHubDirectoryEntry[]=[]; const queue=['']; const visited=new Set<string>();
    while(queue.length&&entries.length<this.maxFiles*4){ const path=queue.shift()!; if(visited.has(path))continue; visited.add(path); let listed:GitHubDirectoryEntry[]; try{listed=await this.provider.listContents(owner,repo,path,commitSha);}catch(error){return{evidence:[],manifest:[],failures:[`directory ${path||'/'}: ${String(error)}`],filesRead:0};} for(const entry of listed){if(entry.type==='dir'){if(!ignored.test(`${entry.path}/`))queue.push(entry.path);}else entries.push(entry);if(entries.length>=this.maxFiles*4)break;} }
    const candidates=selectRepositoryFiles(entries,this.maxFiles); const evidence:RepositoryEvidence[]=[]; const manifest:RepositoryManifestEntry[]=[]; const failures:string[]=[];
    for(const candidate of candidates){try{const file=await this.provider.getContent(owner,repo,candidate.path,commitSha) as GitHubContent|undefined;const content=file?.content?(file.encoding==='base64'?Buffer.from(file.content.replaceAll('\n',''),'base64').toString('utf8'):file.content):undefined;if(content===undefined){failures.push(`${candidate.path}: content unavailable`);continue;}if(Buffer.byteLength(content)>this.maxBytes){failures.push(`${candidate.path}: file exceeds ${this.maxBytes} bytes`);continue;}const input={owner,repo,commitSha,path:candidate.path,content};evidence.push(...extractPinnedRepositoryEvidence(input));manifest.push(manifestEntry(input));}catch(error){failures.push(`${candidate.path}: ${String(error)}`);}}
    return{evidence,manifest,failures,filesRead:candidates.length};
  }
}

