import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PaperAcquirer } from '../../dist/ingestion/acquisition.js';
import { CommandPdfFallback } from '../../dist/ingestion/pdf.js';
import { extractResearchFacts } from '../../dist/extraction/facts.js';
import { equivalentValue } from '../metrics/scoped-facts.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'../..');
const dataset=JSON.parse(readFileSync(join(root,'evals/datasets/research-facts-v5-2-development.json'),'utf8'));
const normalize=value=>String(value).normalize('NFKC').replace(/[ﬁﬂ]/g,m=>m==='ﬁ'?'fi':'fl').replace(/[‐‑‒–—−]/g,'-').replace(/-\s+/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const parser=new CommandPdfFallback('pymupdf','python','scripts/parse_pymupdf.py'); const acquirer=new PaperAcquirer();
const rows=await Promise.all(dataset.papers.flatMap(paper=>paper.goldFacts.map(async gold=>{
  try {
    const acquired=await acquirer.acquire(paper.artifact.url); const sha256=createHash('sha256').update(acquired.body).digest('hex');
    const parsed=await parser.extract(acquired.body,`${paper.paperId}.pdf`); const document={...parsed,url:acquired.url}; const extraction=extractResearchFacts(document);
    const pages=parsed.pages??[]; const rawPage=pages.find(page=>normalize(page.text).includes(normalize(gold.rawEvidence)));
    const parserSections=parsed.sections.filter(section=>normalize(section.text).includes(normalize(gold.rawEvidence)) || normalize(section.heading).includes(normalize(gold.section)));
    const candidates=extraction.candidates.filter(candidate=>candidate.candidatePredicate===gold.predicate && (equivalentValue(candidate.rawValue,gold.canonicalValue) || normalize(candidate.rawText).includes(normalize(gold.rawEvidence))));
    const accepted=extraction.facts.filter(fact=>fact.predicate===gold.predicate && equivalentValue(fact.value,gold.canonicalValue));
    return {paperId:paper.paperId,factId:gold.factId,predicate:gold.predicate,value:gold.canonicalValue,goldPage:gold.page,goldSection:gold.section,rawEvidence:gold.rawEvidence,sha256,rawTextPresent:Boolean(rawPage),rawTextPage:rawPage?.page??null,correctPage:Boolean(rawPage?.page===gold.page),parserSections:parserSections.map(section=>({heading:section.heading,page:section.page??null})),sectionRecovered:parserSections.length>0,candidateGenerated:candidates.length>0,candidates:candidates.map(candidate=>({predicate:candidate.candidatePredicate,value:candidate.rawValue,section:candidate.section,locator:candidate.locator})),validatorAccepted:accepted.length>0,acceptedFacts:accepted.map(fact=>({value:fact.value,section:fact.locator.section??'',locator:fact.locator})),failureStage:accepted.length?'NONE':candidates.length?'VALIDATOR_OR_NORMALIZATION':parserSections.length?'CANDIDATE_DISCOVERY':rawPage?'SECTION_ASSIGNMENT':'RAW_PAGE_TEXT',parseSuccess:true};
  } catch(error) { return {paperId:paper.paperId,factId:gold.factId,predicate:gold.predicate,value:gold.canonicalValue,goldPage:gold.page,goldSection:gold.section,rawEvidence:gold.rawEvidence,parseSuccess:false,error:String(error),failureStage:'ACQUISITION_OR_PARSER'}; }
})));
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(); const counts=key=>rows.filter(row=>row[key]).length; const result={schemaVersion:'openpapers.v5-3-fn-trace.v1',benchmark:'research-facts-v5-2-development',commit,timestamp:new Date().toISOString(),parser:'pymupdf-live',rows,summary:{facts:rows.length,parseSuccess:counts('parseSuccess'),rawTextRecall:counts('rawTextPresent')/rows.length,pageRecall:counts('correctPage')/rows.length,sectionRecovery:counts('sectionRecovered')/rows.length,candidateRecall:counts('candidateGenerated')/rows.length,validatorAcceptance:counts('validatorAccepted')/rows.length,byFailureStage:Object.fromEntries([...new Set(rows.map(row=>row.failureStage))].map(stage=>[stage,rows.filter(row=>row.failureStage===stage).length]))},holdout:{created:false,usedForTuning:false}};
const output=join(root,`evals/results/v5-3-fn-trace-${commit.slice(0,12)}.json`);mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({output,summary:result.summary},null,2));
