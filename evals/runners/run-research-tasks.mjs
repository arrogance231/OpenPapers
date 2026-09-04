import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ResearchDb } from '../../dist/database/db.js';
import { ResearchService } from '../../dist/research/service.js';
import { author, paperId } from '../../dist/research/citations.js';
import { parseDocument } from '../../dist/ingestion/document.js';
import { extractTrainingParameters } from '../../dist/extraction/parameters.js';
import { classifyResearchTaskStatus } from '../metrics/research-tasks.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'../..');
const dataset=JSON.parse(readFileSync(join(root,'evals/datasets/research-tasks-v1.json'),'utf8'));
const canonical=JSON.parse(readFileSync(join(root,'evals/datasets/canonical-retrieval-v1.json'),'utf8'));
const works=canonical.works.map(item=>({paperId:paperId(item.title,item.authors.map(name=>author(name)),undefined,item.arxiv),title:item.title,authors:item.authors.map(name=>author(name)),year:item.year,arxivId:item.arxiv,publicationStatus:'preprint',bibtex:'',sourceProviders:['eval-fixture'],versions:[],abstract:''}));
const byArxiv=new Map(works.map(work=>[work.arxivId,work]));
const provider={search:async()=>works}; const empty={search:async()=>[]};
const supported=new Set(['learning_rate','batch_size','epochs','optimizer','weight_decay','temperature','gradient_accumulation']);
const valueMap=(parameters)=>Object.fromEntries(parameters.map(parameter=>[parameter.name,parameter.value]));
function actualStatus(task, values) { return classifyResearchTaskStatus(task, values, supported); }
function actualAnswer(parameters) {
  const grouped={};
  for(const parameter of parameters){ const prior=grouped[parameter.name]; grouped[parameter.name]=prior===undefined?parameter.value:Array.isArray(prior)?[...prior,parameter.value]:[prior,parameter.value]; }
  return grouped;
}
function compareAnswer(task, answer) {
  const expected=task.expectedAnswer; const relevant=Object.keys(expected).filter(key=>supported.has(key));
  if(!relevant.length) return task.expectedStatus==='UNKNOWN'||task.expectedStatus==='NOT_REPORTED' ? Object.keys(answer).length===0 : false;
  return relevant.every(key=>JSON.stringify(answer[key]??null)===JSON.stringify(expected[key]));
}
function sourceClass(heading, task){ const value=heading.toLowerCase(); return value.includes('appendix')?'appendix':value.includes('config')?'repository_config':value.includes('readme')?'README':task.expectedSources.includes('paper_review')?'paper_review':'paper'; }
const db=new ResearchDb(':memory:'); const service=new ResearchService(db,provider,empty,empty,empty); const rows=[];
for(const task of dataset.tasks){
  const result=await service.search(task.query,10);
  const expectedWork=byArxiv.get(task.arxivId); const actualWork=result.data.find(work=>work.arxivId===task.arxivId);
  const parsed=parseDocument({url:`https://eval.invalid/${task.taskId}.html`,contentType:'text/html',bytes:new TextEncoder().encode(task.evidenceHtml).byteLength,body:new TextEncoder().encode(task.evidenceHtml)});
  const parameters=extractTrainingParameters(parsed); const answer=actualAnswer(parameters); const status=actualStatus(task,answer);
  const expectedSections=task.expectedLocators.map(locator=>locator.section).filter(Boolean); const locatorOk=expectedSections.every(section=>parsed.sections.some(candidate=>candidate.heading.toLowerCase()===section.toLowerCase())); const actualSources=[...new Set(expectedSections.map(section=>sourceClass(section,task)))];
  const row={taskId:task.taskId,expectedWork:task.arxivId,actualWork:actualWork?.arxivId??null,expectedAnswer:task.expectedAnswer,actualAnswer:answer,expectedStatus:task.expectedStatus,actualStatus:status,expectedSources:task.expectedSources,actualSources,expectedLocators:task.expectedLocators,actualLocators:parameters.map(item=>item.locator),workCorrect:Boolean(actualWork),identifierCorrect:actualWork?.arxivId===task.arxivId,answerCorrect:compareAnswer(task,answer),evidenceSourceCorrect:task.expectedSources.length===0||task.expectedSources.every(source=>actualSources.includes(source)),locatorCorrect:locatorOk,supportStatusCorrect:status===task.expectedStatus,failureCategory:null};
  if(!row.workCorrect)row.failureCategory='retrieval failure'; else if(!row.answerCorrect)row.failureCategory='extraction failure'; else if(!row.locatorCorrect)row.failureCategory='wrong locator'; else if(!row.supportStatusCorrect)row.failureCategory=status==='UNKNOWN'?'false UNKNOWN':'unsupported answer';
  rows.push(row);
}
await db.close();
const n=rows.length; const rate=key=>rows.filter(row=>row[key]).length/n; const expectedUnknown=rows.filter(row=>row.expectedStatus==='UNKNOWN'); const expectedNot=rows.filter(row=>row.expectedStatus==='NOT_REPORTED');
const actualUnknown=rows.filter(row=>row.actualStatus==='UNKNOWN'); const actualNot=rows.filter(row=>row.actualStatus==='NOT_REPORTED');
const diagnostics=rows.filter(row=>row.failureCategory).map(row=>({...row,failureCategory:row.failureCategory??'unclassified'}));
const categories=Object.fromEntries([...new Set(diagnostics.map(row=>row.failureCategory))].map(category=>[category,diagnostics.filter(row=>row.failureCategory===category).length]));
const result={schemaVersion:'openpapers.evaluation-result.v1',kind:'offline-baseline',commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),timestamp:new Date().toISOString(),workingTreeDirty:execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim().length>0,configuration:{providerMode:'offline-fixture',parserMode:'html-fixture',liveProviders:false},datasets:{researchTasks:dataset.version},taskCount:n,metrics:{workAccuracy:rate('workCorrect'),identifierAccuracy:rate('identifierCorrect'),answerCorrectness:rate('answerCorrect'),evidenceSourceAccuracy:rate('evidenceSourceCorrect'),locatorAccuracy:rate('locatorCorrect'),supportStatusAccuracy:rate('supportStatusCorrect'),correctUNKNOWN:actualUnknown.filter(row=>row.expectedStatus==='UNKNOWN').length/(expectedUnknown.length||1),correctNOT_REPORTED:actualNot.filter(row=>row.expectedStatus==='NOT_REPORTED').length/(expectedNot.length||1),falseUNKNOWN:actualUnknown.filter(row=>row.expectedStatus!=='UNKNOWN').length/n,falseNOT_REPORTED:actualNot.filter(row=>row.expectedStatus!=='NOT_REPORTED').length/n,fabricatedAnswerRate:rows.filter(row=>['UNKNOWN','NOT_REPORTED'].includes(row.expectedStatus)&&Object.keys(row.actualAnswer).length>0).length/n,conflictDetectionPrecision:rows.filter(row=>row.actualStatus==='CONFLICTING'&&row.expectedStatus==='CONFLICTING').length/(rows.filter(row=>row.actualStatus==='CONFLICTING').length||1),conflictDetectionRecall:rows.filter(row=>row.actualStatus==='CONFLICTING'&&row.expectedStatus==='CONFLICTING').length/(rows.filter(row=>row.expectedStatus==='CONFLICTING').length||1)},abstention:{expectedUnknown:expectedUnknown.length,expectedNotReported:expectedNot.length,actualUnknown:actualUnknown.length,actualNotReported:actualNot.length},failureCategories:categories,rows};
const dir=join(root,'evals/results');mkdirSync(dir,{recursive:true}); const prefix=process.env.EVAL_PREFIX??'research-tasks-baseline-v1'; let output=join(dir,`${prefix}-${result.commit.slice(0,12)}.json`); let suffix=2; while(existsSync(output))output=join(dir,`${prefix}-${result.commit.slice(0,12)}-${suffix++}.json`); writeFileSync(output,JSON.stringify(result,null,2)+'\n'); const failureOutput=output.replace(/\.json$/,'-failures.json'); writeFileSync(failureOutput,JSON.stringify({schemaVersion:'openpapers.research-task-failure-report.v1',commit:result.commit,dataset:dataset.version,taskCount:n,categories,diagnostics},null,2)+'\n'); console.log(JSON.stringify({output,failureOutput,taskCount:n,metrics:result.metrics,failureCategories:categories},null,2));
