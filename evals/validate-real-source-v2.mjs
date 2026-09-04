import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await readFile(join(root,'evals/datasets/research-real-v2.json'),'utf8'));
const v1=JSON.parse(await readFile(join(root,'evals/datasets/research-real-v1.json'),'utf8'));
const errors=[]; const ids=new Set(); const v1Ids=new Set(v1.cases.map(x=>x.source.arxivId)); let tasks=0;
if(data.version!=='research-real-v2') errors.push('wrong version');
if(data.splitPolicy?.holdoutInfluencedTuning!==false) errors.push('holdout policy is not frozen');
for(const item of data.cases){ if(ids.has(item.caseId))errors.push(`duplicate case ${item.caseId}`); ids.add(item.caseId); if(v1Ids.has(item.source.arxivId))errors.push(`V1 overlap ${item.source.arxivId}`); if(!/^\d{4}\.\d{4,5}$/.test(item.source.arxivId))errors.push(`invalid arXiv ID ${item.caseId}`); if(!/^v\d+$/.test(item.source.arxivVersion))errors.push(`invalid paper version ${item.caseId}`); if(item.source.repositoryUrl&&!/^[0-9a-f]{40}$/i.test(item.source.repositoryCommitSha??''))errors.push(`repository SHA missing ${item.caseId}`); tasks+=item.tasks.length; }
const dev=data.cases.filter(x=>x.split==='development').length, hold=data.cases.filter(x=>x.split==='holdout').length;
if(dev!==15)errors.push(`expected 15 development cases, got ${dev}`); if(hold!==5)errors.push(`expected 5 holdout cases, got ${hold}`);
if(errors.length){console.error(JSON.stringify({valid:false,errors},null,2));process.exit(1)} console.log(JSON.stringify({valid:true,version:data.version,cases:data.cases.length,development:dev,holdout:hold,tasks},null,2));
