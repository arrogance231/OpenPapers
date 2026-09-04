import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractResearchFacts } from '../../dist/extraction/facts.js';
import { aggregateScoped, scoreScopedPaper, validateScopedFactDataset } from '../metrics/scoped-facts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dataset = JSON.parse(readFileSync(join(root, 'evals/datasets/research-facts-v5-development.json'), 'utf8'));
const validationErrors = validateScopedFactDataset(dataset);
if (validationErrors.length) { console.error(JSON.stringify({ validationErrors }, null, 2)); process.exit(1); }
if (process.argv.includes('--validate-only')) { console.log(JSON.stringify({ valid:true, papers:dataset.papers.length, goldFacts:dataset.papers.reduce((n,p)=>n+p.goldFacts.length,0) })); process.exit(0); }
const rows = dataset.papers.map(paper => {
  const document = { format:'html', url:paper.artifact.url, sections:paper.sourceSections.map(section => ({level:1, heading:section.heading, text:section.text, page:section.page})), references:[], warnings:[] };
  return scoreScopedPaper(paper, extractResearchFacts(document));
});
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd:root, encoding:'utf8' }).trim();
const familyMetrics = Object.fromEntries([...new Set(dataset.papers.flatMap(p=>p.goldFacts.map(f=>f.predicate.split('.')[0])))].map(family => { const facts=dataset.papers.flatMap((p,i)=>p.goldFacts.filter(f=>f.predicate.startsWith(`${family}.`)).map(f=>({p,i,f}))); const rowFacts=rows.flatMap((r,i)=>r.matches.filter(m=>m.gold.predicate.startsWith(`${family}.`)).map(m=>({r,i,m}))); const tp=rowFacts.length, fn=facts.length-tp, fp=rows.reduce((n,r)=>n+r.falsePositiveCategories.filter(c=>c.predicate.startsWith(`${family}.`)).length,0), precision=tp+fp?tp/(tp+fp):0, recall=tp+fn?tp/(tp+fn):0; return [family,{goldFacts:facts.length,tp,fp,fn,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0}]; }));
const result = { schemaVersion:'openpapers.scoped-fact-result.v1', benchmark:'research-facts-v5-development', commit, timestamp:new Date().toISOString(), workingTreeDirty:Boolean(execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim()), methodology:{completenessPolicy:dataset.completenessPolicy, duplicatePolicy:dataset.annotationPolicy.duplicate, fuzzyEquivalence:false, sourceDerivedGold:false, parser:'bounded source-section fixtures', validatorLayer:'v5.1 CandidateEvidence -> validation -> ResearchFact'}, metrics:aggregateScoped(rows), familyMetrics, perPaper:rows, errorDecomposition:{falsePositiveCategories:Object.fromEntries(rows.flatMap(r=>r.falsePositiveCategories).reduce((m,x)=>(m.set(x.category,(m.get(x.category)||0)+1),m),new Map())), falseNegativeCategories:Object.fromEntries(rows.flatMap(r=>r.falseNegativeCategories).reduce((m,x)=>(m.set(x.category,(m.get(x.category)||0)+1),m),new Map()))}, holdout:{created:false, usedForTuning:false}};
const output = join(root, `evals/results/v5-scoped-fact-baseline-${commit.slice(0,12)}.json`);
mkdirSync(dirname(output), {recursive:true}); writeFileSync(output, JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({output, metrics:result.metrics, validationErrors:[]},null,2));
