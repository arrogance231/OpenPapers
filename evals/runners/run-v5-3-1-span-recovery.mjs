import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PaperAcquirer } from '../../dist/ingestion/acquisition.js';
import { CommandPdfFallback } from '../../dist/ingestion/pdf.js';
import { normalizePdfText, normalizedTokenSequence } from '../../dist/extraction/text-normalization.js';

const root=join(dirname(fileURLToPath(import.meta.url)),'../..');
const dataset=JSON.parse(readFileSync(join(root,'evals/datasets/research-facts-v5-2-development.json'),'utf8'));
const parser=new CommandPdfFallback('pymupdf','python','scripts/parse_pymupdf.py');
const acquirer=new PaperAcquirer();
const containsTokens=(haystack,needle)=>{ if(!needle.length)return true; for(let i=0;i<=haystack.length-needle.length;i++) if(needle.every((token,j)=>haystack[i+j]===token)) return true; return false; };
const pagesFor=parsed=>parsed.pages??[];
const analyze=async (paper,gold)=>{
  const acquired=await acquirer.acquire(paper.artifact.url); const sha256=createHash('sha256').update(acquired.body).digest('hex');
  const parsed=await parser.extract(acquired.body,`${paper.paperId}.pdf`); const goldRaw=gold.rawEvidence;
  const raw=pagesFor(parsed).filter(page=>page.text.includes(goldRaw));
  const layout=pagesFor(parsed).filter(page=>normalizePdfText(page.text).includes(normalizePdfText(goldRaw)));
  const goldTokens=normalizedTokenSequence(goldRaw);
  const token=pagesFor(parsed).filter(page=>containsTokens(normalizedTokenSequence(page.text),goldTokens));
  const sourceSection=(parsed.sections??[]).find(section=>normalizePdfText(section.text).includes(normalizePdfText(goldRaw)));
  return {paperId:paper.paperId,factId:gold.factId,predicate:gold.predicate,goldPage:gold.page,goldSection:gold.section,rawEvidence:goldRaw,sha256,rawExactPresent:raw.length>0,rawPages:raw.map(p=>p.page),layoutNormalizedPresent:layout.length>0,layoutPages:layout.map(p=>p.page),tokenSequencePresent:token.length>0,tokenPages:token.map(p=>p.page),recoveredOriginalLocator:token[0]?{page:token[0].page}:null,sectionRecovered:Boolean(sourceSection),section:sourceSection?.heading??null};
};
const rows=[]; for(const paper of dataset.papers) for(const gold of paper.goldFacts) rows.push(await analyze(paper,gold));
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const count=key=>rows.filter(row=>row[key]).length; const result={schemaVersion:'openpapers.v5-3-1-span-recovery.v2',benchmark:'research-facts-v5-2-development',commit,timestamp:new Date().toISOString(),parser:'pymupdf-live',rows,summary:{facts:rows.length,rawExactRecall:count('rawExactPresent')/rows.length,layoutNormalizedRecall:count('layoutNormalizedPresent')/rows.length,tokenSequenceRecall:count('tokenSequencePresent')/rows.length,sectionRecovery:count('sectionRecovered')/rows.length,physicalPageAgreement:rows.filter(row=>row.tokenPages.includes(row.goldPage)).length/rows.length},holdout:{created:false,usedForTuning:false}};
const output=join(root,`evals/results/v5-3-1-span-recovery-${commit.slice(0,12)}.json`); mkdirSync(dirname(output),{recursive:true}); writeFileSync(output,JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify({output,summary:result.summary},null,2));
