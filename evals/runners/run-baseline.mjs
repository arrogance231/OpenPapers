import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ResearchDb } from '../../dist/database/db.js';
import { ResearchService, explainRanking } from '../../dist/research/service.js';
import { author, makeEvidence, normalizeDoi, paperId } from '../../dist/research/citations.js';
import { parseDocument } from '../../dist/ingestion/document.js';
import { extractTrainingParameters } from '../../dist/extraction/parameters.js';
import { validateCitationIntegrity } from '../../dist/research/verification.js';
import { rankingMetrics, aggregateRanking, identityMetrics, extractionMetrics, citationMetrics } from '../metrics/metrics.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'../..');
const load=name=>JSON.parse(readFileSync(join(root,'evals/datasets',name),'utf8'));
const canonical=load('canonical-retrieval-v1.json');
const retrieval=load('retrieval-v1.json');
const extraction=load('extraction-v1.json');
const citation=load('citation-v1.json');
const abstracts={
  'attention-is-all-you-need':'Transformer architecture, self-attention, encoder decoder sequence modeling, and efficient language understanding.',
  bert:'Bidirectional transformer pretraining for language understanding and representation learning.',
  gpt3:'Large language model pretraining and few-shot learning with language models.',
  llama:'Efficient foundation language model training, scaling, and mixture of experts research.',
  lora:'Low rank adaptation for parameter efficient fine tuning of large language models.',
  qlora:'Quantized language model fine tuning, low rank adapters, and memory efficient training.',
  flashattention:'Fast memory efficient exact attention and long context attention efficiency through IO awareness.',
  dpo:'Direct preference optimization and language model preference learning without an explicit reward model.',
  orpo:'Monolithic preference optimization without a reference model for language model alignment.',
  toolformer:'Language model tool use, API calls, function calling, and self supervised tool learning.',
  medusa:'Multiple decoding heads and speculative decoding for accelerated language model inference.',
  eagle:'Speculative sampling, feature uncertainty, and speculative decoding acceleration.',
  distilbert:'Knowledge distillation and compressed transformer language models that are smaller and faster.',
  minilm:'Self attention distillation for task agnostic compression of pretrained transformers.',
  tinybert:'Distilling BERT for natural language understanding and compact transformer models.',
  instructgpt:'Instruction fine tuning and reinforcement learning from human feedback for language models.',
  flan:'Scaling instruction finetuned language models and instruction tuning.',
  'self-instruct':'Self generated instructions for aligning and instruction tuning language models.',
  gorilla:'Large language models connected with massive APIs and tool use.',
  toollm:'Large language model tool use and instruction following with tools.',
  mixtral:'Sparse mixture of experts language model architecture and routing.',
  mistral:'Open language model architecture, grouped query attention, and efficient inference.',
  gemma:'Open foundation language models and instruction tuning based on Gemini research.'
};
const works=canonical.works.map(item=>{const authors=item.authors.map(name=>author(name));const arxiv=item.arxiv;return {paperId:paperId(item.title,authors,undefined,arxiv),title:item.title,authors,year:item.year,arxivId:arxiv,publicationStatus:'preprint',bibtex:'',sourceProviders:['eval-fixture'],versions:[],abstract:abstracts[item.id]??''};});
const byId=new Map(canonical.works.map((item,index)=>[item.id,works[index]]));

async function evaluateRetrieval(){
  const provider={search:async()=>works};
  const empty={search:async()=>[]};
  const service=new ResearchService(new ResearchDb(':memory:'),provider,empty,empty,empty);
  const rows=[];
  const candidateIds=works.map(work=>canonical.works.find(gold=>gold.arxiv===work.arxivId)?.id).filter(Boolean);
  for(const item of retrieval.queries){const result=await service.search(item.query,10);const ids=result.data.map(work=>canonical.works.find(gold=>gold.arxiv===work.arxivId)?.id).filter(Boolean);const diagnostics=item.relevant.map(goldId=>{const candidateRank=candidateIds.indexOf(goldId)+1;const finalRank=ids.indexOf(goldId)+1;const work=byId.get(goldId);const ranking=work?explainRanking(work,item.query):undefined;return {goldWorkId:goldId,returned:finalRank>0,finalRank:finalRank>0?finalRank:null,provider:'eval-fixture',providerNativeRank:candidateRank>0?candidateRank:null,providerNativeScore:null,normalizedOpenPapersScore:ranking?.score??null,signals:ranking?{textContainsQuery:ranking.textContainsQuery,titleTokenOverlap:ranking.titleTokenOverlap,textTokenOverlap:ranking.textTokenOverlap,citationContribution:ranking.citationContribution,arxivBoost:ranking.arxivBoost}:null,failure:candidateRank<1?'not_retrieved':finalRank<1?'ranked_below_k':null};});rows.push({query:item.query,...rankingMetrics(ids,item.relevant),returnedWorkIds:ids,diagnostics});}
  return {dataset:retrieval.version,perQuery:rows,aggregate:aggregateRanking(rows),providerMode:'offline-fixture'};
}

function evaluateIdentity(){
  const cases=[];
  for(const item of canonical.works){const aliases=[item.arxiv,`arXiv:${item.arxiv}`,`${item.arxiv}v1`,`https://arxiv.org/abs/${item.arxiv}v7`,`https://www.arxiv.org/pdf/${item.arxiv}v1.pdf`];const expected=paperId(item.title,item.authors.map(name=>author(name)),undefined,item.arxiv);for(const value of aliases)cases.push({expected,predicted:paperId(item.title,item.authors.map(name=>author(name)),undefined,value),group:item.id,unresolved:false,alias:value});}
  for(const item of canonical.doiAliases??[]){const expected=paperId(item.title,item.authors.map(name=>author(name)),item.canonicalDoi);for(const value of item.aliases)cases.push({expected,predicted:paperId(item.title,item.authors.map(name=>author(name)),value),group:item.id,unresolved:false,alias:value,normalized:normalizeDoi(value)});}
  return {dataset:canonical.version,metrics:identityMetrics(cases),cases};
}

function evaluateExtraction(){
  const rows=[];
  for(const item of extraction.cases){const body=new TextEncoder().encode(item.html);const document=parseDocument({url:`https://eval.invalid/${item.id}.html`,contentType:'text/html',bytes:body.byteLength,body});rows.push({id:item.id,gold:item.gold,predicted:extractTrainingParameters(document)});}
  return {dataset:extraction.version,metrics:extractionMetrics(rows),rows};
}

function evaluateCitation(){
  const work={paperId:'paper-1',title:'Evaluation Paper',authors:[author('Author One')],year:2024,publicationStatus:'journal',bibtex:'',sourceProviders:['eval'],versions:[]};
  const rows=citation.cases.map(item=>{let evidence=[];if(!item.emptyEvidence){evidence=[makeEvidence(item.source,work,item.claim,'DIRECT','A',item.invalidLocator?{page:0}:undefined)];if(item.wrongWork)evidence=[{...evidence[0],title:'Different Work',authors:[]}];}const references=item.source==='paper-1'?[work]:[];const response={summary:item.summary,data:{claim:item.claim},evidence,references,transparency:{expandedQueries:[],sourcesSearched:['eval'],candidates:1,retrievedAt:'2026-01-01T00:00:00.000Z',rankingRationale:[]}};const result=validateCitationIntegrity(response);return {id:item.id,expectedValid:item.expectedValid,actualValid:result.valid,missingSource:result.errors.some(error=>error.includes('missing source')),invalidLocator:result.errors.some(error=>error.includes('invalid page locator')),wrongWork:result.errors.some(error=>error.includes('title does not match')||error.includes('authors do not match')),errors:result.errors};});
  return {dataset:citation.version,metrics:citationMetrics(rows),cases:rows};
}

const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const dirty=execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim().length>0;
const result={schemaVersion:'openpapers.evaluation-result.v1',kind:'offline-baseline',commit,timestamp:new Date().toISOString(),workingTreeDirty:dirty,configuration:{providerMode:'offline-fixture',embeddingModel:'NOT_APPLICABLE',liveProviders:false},datasets:{canonical:canonical.version,retrieval:retrieval.version,extraction:extraction.version,citation:citation.version},identity:evaluateIdentity(),retrieval:await evaluateRetrieval(),extraction:evaluateExtraction(),citation:evaluateCitation(),paperCodeAgreement:'NOT_YET_MEASURED',endToEndTasks:'NOT_YET_MEASURED'};
const outputDir=join(root,'evals/results');mkdirSync(outputDir,{recursive:true});const prefix=process.env.EVAL_PREFIX??'baseline-v1';let output=join(outputDir,`${prefix}-${commit.slice(0,12)}.json`);let suffix=2;while(existsSync(output))output=join(outputDir,`${prefix}-${commit.slice(0,12)}-${suffix++}.json`);writeFileSync(output,JSON.stringify(result,null,2)+'\n');const diagnostics=result.retrieval.perQuery.flatMap(row=>row.diagnostics);const categories={not_retrieved:diagnostics.filter(row=>row.failure==='not_retrieved').length,ranked_below_k:diagnostics.filter(row=>row.failure==='ranked_below_k').length,returned:diagnostics.filter(row=>row.failure===null).length};let failureOutput=join(outputDir,`${prefix}-${commit.slice(0,12)}-failures.json`);let failureSuffix=2;while(existsSync(failureOutput))failureOutput=join(outputDir,`${prefix}-${commit.slice(0,12)}-failures-${failureSuffix++}.json`);writeFileSync(failureOutput,JSON.stringify({schemaVersion:'openpapers.retrieval-failure-report.v1',kind:'offline-fixture',commit,timestamp:result.timestamp,workingTreeDirty:dirty,dataset:retrieval.version,categories,totalRelevant:diagnostics.length,diagnostics:result.retrieval.perQuery.map(row=>({query:row.query,gold:row.diagnostics}))},null,2)+'\n');console.log(JSON.stringify({output,failureOutput,identity:result.identity.metrics,retrieval:result.retrieval.aggregate,citation:result.citation.metrics},null,2));
