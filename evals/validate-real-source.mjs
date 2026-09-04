import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(join(root, 'evals/datasets/research-real-v1.json'), 'utf8'));
const errors = [];
if (data.version !== 'research-real-v1') errors.push('wrong dataset version');
if (data.status !== 'curated-real-source-metadata') errors.push('dataset is not marked real-source');
if (data.splitPolicy?.holdoutInfluencedTuning !== false) errors.push('holdout policy must be false');
const ids = new Set(); const taskIds = new Set(); let dev = 0; let holdout = 0;
for (const item of data.cases ?? []) {
  if (ids.has(item.caseId)) errors.push(`duplicate caseId ${item.caseId}`); ids.add(item.caseId);
  if (item.split === 'development') dev++; else if (item.split === 'holdout') holdout++; else errors.push(`${item.caseId}: invalid split`);
  const s = item.source ?? {};
  for (const field of ['arxivId','arxivVersion','absUrl','pdfUrl','paperRevisionDate','artifactPolicy','paperSha256Status','temporalAlignment']) if (!s[field]) errors.push(`${item.caseId}: missing source.${field}`);
  if (!/^v\d+$/.test(s.arxivVersion ?? '')) errors.push(`${item.caseId}: unversioned arXiv source`);
  if (s.repositoryUrl && !/^[0-9a-f]{40}$/.test(s.repositoryCommitSha ?? '')) errors.push(`${item.caseId}: repository URL lacks exact commit SHA`);
  for (const task of item.tasks ?? []) {
    if (taskIds.has(task.taskId)) errors.push(`duplicate taskId ${task.taskId}`); taskIds.add(task.taskId);
    for (const field of ['query','expectedStatus','expectedAnswer','expectedSourceClass','expectedLocator','annotationRationale']) if (task[field] === undefined) errors.push(`${task.taskId}: missing ${field}`);
    if (task.expectedStatus === 'NOT_REPORTED' && !/inspect|reported|absence|absent/i.test(task.annotationRationale ?? '')) errors.push(`${task.taskId}: NOT_REPORTED lacks absence rationale`);
  }
}
if (data.cases.length < 15) errors.push('real benchmark must contain at least 15 cases');
if (dev < 10 || holdout < 4) errors.push(`invalid split size dev=${dev} holdout=${holdout}`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(JSON.stringify({ valid: true, version: data.version, cases: data.cases.length, development: dev, holdout, tasks: [...taskIds].length }, null, 2));
