import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const run=promisify(execFile); const root=join(dirname(fileURLToPath(import.meta.url)),'../..');
const dataset=JSON.parse(await readFile(join(root,'evals/datasets/research-real-v1.json'),'utf8'));
const acquisitionPath=join(root,'evals/results/real-source-acquisition-development.json');
const acquisition=existsSync(acquisitionPath)?JSON.parse(await readFile(acquisitionPath,'utf8')):null;
const rows=[]; for(const item of dataset.cases.filter(item=>item.split==='development')){const a=acquisition?.rows?.find(row=>row.caseId===item.caseId); const row={caseId:item.caseId,status:a?.status??'NOT_ACQUIRED',parser:'pymupdf',title:item.title,sections:0,pages:0,error:null}; if(a?.status==='ACQUIRED'&&a.path){try{const {stdout}=await run(process.env.PYTHON_COMMAND??'python',[join(root,'scripts/parse_pymupdf.py'),a.path],{maxBuffer:25*1024*1024,timeout:120000}); const parsed=JSON.parse(stdout); row.sections=parsed.sections.length; row.pages=parsed.sections.length; row.parserWarnings=parsed.warnings; row.parseSuccess=true;}catch(error){row.error=String(error);row.parseSuccess=false;}}else row.parseSuccess=false; rows.push(row);}
const successful=rows.filter(row=>row.parseSuccess).length; const result={schemaVersion:'openpapers.real-pdf-evaluation.v1',kind:'real-source-development-pdf',dataset:dataset.version,corpusSize:rows.length,parserModes:['pymupdf'],unavailableParsers:['grobid:live service not attempted','docling:not configured'],metrics:{parseSuccess:successful/(rows.length||1),titleRecovery:null,sectionRecovery:successful/(rows.length||1),pageMapping:null,referenceDetection:null,downstreamExtractionImpact:'NOT_MEASURED'},rows}; const output=join(root,'evals/results','real-pdf-development.json'); await mkdir(dirname(output),{recursive:true}); await writeFile(output,JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify({output,corpusSize:rows.length,parseSuccess:successful,unavailable:rows.filter(row=>row.status!=='ACQUIRED').map(row=>row.caseId)},null,2));
