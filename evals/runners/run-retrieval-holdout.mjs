import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ResearchDb } from '../../dist/database/db.js';
import { ResearchService } from '../../dist/research/service.js';
import { author, paperId } from '../../dist/research/citations.js';
import { rankingMetrics, aggregateRanking } from '../metrics/metrics.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'../..');
const canonical=JSON.parse(readFileSync(join(root,'evals/datasets/canonical-retrieval-v1.json'),'utf8'));
const holdout=JSON.parse(readFileSync(join(root,'evals/datasets/retrieval-holdout-v1.json'),'utf8'));
const abstracts={lora:'parameter efficient fine tuning low rank adapters',orpo:'preference optimization without a reference model',flashattention:'memory efficient exact attention IO awareness', 'self-instruct':'self generated instructions language model alignment',mixtral:'sparse mixture experts routing language model'};
const works=canonical.works.map(item=>({paperId:paperId(item.title,item.authors.map(name=>author(name)),undefined,item.arxiv),title:item.title,authors:item.authors.map(name=>author(name)),year:item.year,arxivId:item.arxiv,publicationStatus:'preprint',bibtex:'',sourceProviders:['eval-fixture'],versions:[],abstract:abstracts[item.id]??''}));
const byId=new Map(canonical.works.map((item,index)=>[item.id,works[index]])); const service=new ResearchService(new ResearchDb(':memory:'),{search:async()=>works},{search:async()=>[]},{search:async()=>[]},{search:async()=>[]}); const rows=[];
for(const item of holdout.queries){const result=await service.search(item.query,10);const returned=result.data.map(work=>canonical.works.find(gold=>gold.arxiv===work.arxivId)?.id).filter(Boolean);rows.push({query:item.query,relevant:item.relevant,returned, ...rankingMetrics(returned,item.relevant)});}
await service.db.close(); const aggregate=aggregateRanking(rows); const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(); const result={schemaVersion:'openpapers.retrieval-holdout-result.v1',kind:'offline-untouched-checkpoint',commit,dataset:holdout.version,developmentDataNotUsed:true,metrics:{...aggregate},rows};const output=join(root,'evals/results',`retrieval-holdout-${commit.slice(0,12)}.json`);mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({output,dataset:holdout.version,queries:rows.length,metrics:aggregate},null,2));
void byId;
