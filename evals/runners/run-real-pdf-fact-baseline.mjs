import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PaperAcquirer } from '../../dist/ingestion/acquisition.js';
import { CommandPdfFallback } from '../../dist/ingestion/pdf.js';
import { extractResearchFacts } from '../../dist/extraction/facts.js';
import { aggregateScoped, scoreScopedPaper, validateScopedFactDataset } from '../metrics/scoped-facts.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'../..');
const dataset=JSON.parse(readFileSync(join(root,'evals/datasets/research-facts-v5-2-development.json'),'utf8'));
const errors=validateScopedFactDataset(dataset); if(errors.length){console.error(JSON.stringify({errors},null,2));process.exit(1);}
const acquirer=new PaperAcquirer(); const parser=new CommandPdfFallback('pymupdf','python','scripts/parse_pymupdf.py');
const rows=await Promise.all(dataset.papers.map(async paper=>{
  const started=Date.now();
  try {
    const acquired=await acquirer.acquire(paper.artifact.url); const sha256=createHash('sha256').update(acquired.body).digest('hex');
    if(sha256!==paper.artifact.sha256) throw new Error(`SHA-256 mismatch: expected ${paper.artifact.sha256}, received ${sha256}`);
    const parsed=await parser.extract(acquired.body,`${paper.paperId}.pdf`); const document={...parsed,url:acquired.url}; const extraction=extractResearchFacts(document);
    const scoped={...paper,sourceSections:parsed.sections.filter(section=>paper.scope.sections.some(name=>section.heading.replace(/^\d+(?:\.\d+)*\s*/,'').toLowerCase().includes(name.toLowerCase()))).map(section=>({heading:section.heading,page:section.page??1,text:section.text}))};
    const scored=scoreScopedPaper(scoped,extraction);
    return {...scored,paperId:paper.paperId,artifactSha256:sha256,parser:'pymupdf',parseSuccess:true,sectionHeadings:parsed.sections.map(section=>section.heading),parserWarnings:parsed.warnings,elapsedMs:Date.now()-started};
  } catch(error) { return {paperId:paper.paperId,parseSuccess:false,error:String(error),elapsedMs:Date.now()-started,candidates:0,candidateRecall:0,candidatesPerGold:null,tp:0,fp:0,fn:paper.goldFacts.length,outOfScope:0,duplicateEquivalent:0,precision:0,recall:0,f1:0}; }
}));
const successful=rows.filter(row=>row.parseSuccess); const metrics=successful.length?aggregateScoped(successful):{papers:0,goldFacts:0,candidateCount:0,tp:0,fp:0,fn:0,precision:0,recall:0,f1:0};
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(); const result={schemaVersion:'openpapers.real-pdf-fact-result.v1',benchmark:'research-facts-v5-development',commit,timestamp:new Date().toISOString(),parser:'pymupdf-live',networkRequired:true,metrics:{...metrics,papersAttempted:dataset.papers.length,parseSuccess:successful.length,parseFailure:rows.length-successful.length},perPaper:rows,holdout:{created:false,usedForTuning:false}};
const output=join(root,`evals/results/v5-real-pdf-fact-baseline-${commit.slice(0,12)}.json`);mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({output,metrics:result.metrics,failures:rows.filter(r=>!r.parseSuccess)},null,2));
