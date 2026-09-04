import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync, execFile } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { extractTrainingParameters } from '../../dist/extraction/parameters.js';
import { scoreRealSourceRows } from '../metrics/real-source.mjs';

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dataset = JSON.parse(await readFile(join(root, 'evals/datasets/research-real-v1.json'), 'utf8'));
const split = process.argv.includes('--split=holdout') || process.env.REAL_SOURCE_SPLIT === 'holdout' ? 'holdout' : 'development';
if (split === 'holdout' && process.env.REAL_SOURCE_ALLOW_HOLDOUT !== '1' && !process.argv.includes('--allow-holdout')) throw new Error('holdout evaluation requires explicit --allow-holdout');
const acquisitionPath = join(root, 'evals/results', `real-source-acquisition-${split}.json`);
const acquisition = existsSync(acquisitionPath) ? JSON.parse(await readFile(acquisitionPath, 'utf8')) : null;
const acquired = new Map((acquisition?.rows ?? []).map(row => [row.caseId, row]));
const rows = [];
for (const item of dataset.cases.filter(item => item.split === split)) {
  let parsed = null; let parserError = null;
  const artifact = acquired.get(item.caseId);
  if (artifact?.status === 'ACQUIRED') {
    try {
      const { stdout } = await run(process.env.PYTHON_COMMAND ?? 'python', [join(root, 'scripts/parse_pymupdf.py'), artifact.path], { maxBuffer: 25 * 1024 * 1024, timeout: 120_000 });
      parsed = JSON.parse(stdout);
      parsed.url = item.source.pdfUrl; parsed.format = 'pdf';
    } catch (error) { parserError = String(error); }
  }
  const parameters = parsed ? extractTrainingParameters(parsed) : [];
  const actualAnswer = Object.fromEntries(parameters.map(parameter => [parameter.name, parameter.value]));
  for (const task of item.tasks) {
    const relevant = Object.keys(task.expectedAnswer).filter(key => key in actualAnswer);
    const answerCorrect = task.expectedStatus === 'UNKNOWN' || task.expectedStatus === 'NOT_REPORTED'
      ? Object.keys(actualAnswer).length === 0
      : relevant.length > 0 && Object.keys(task.expectedAnswer).every(key => actualAnswer[key] !== undefined && String(actualAnswer[key]) === String(task.expectedAnswer[key]));
    const actualStatus = Object.keys(actualAnswer).length ? 'PARTIALLY_SUPPORTED' : 'UNKNOWN';
    rows.push({ caseId: item.caseId, taskId: task.taskId, expectedStatus: task.expectedStatus, expectedAnswer: task.expectedAnswer, expectedSourceClass: task.expectedSourceClass, expectedLocator: task.expectedLocator, actualStatus, actualAnswer, actualSourceClass: parsed ? ['paper_pdf'] : [], actualLocator: parameters[0]?.locator ?? null, workCorrect:null,identifierCorrect:null,answerCorrect,evidenceSourceCorrect:null,locatorCorrect:null, supportStatusCorrect: actualStatus === task.expectedStatus, artifactStatus: artifact?.status ?? 'NOT_ACQUIRED', parserMode: parsed ? 'pymupdf-real-pdf' : 'not_configured', parserError, failureCategory: !artifact || artifact.status !== 'ACQUIRED' ? 'pdf acquisition unavailable' : parserError ? 'parser failure' : answerCorrect ? null : 'field extraction failure' });
  }
}
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const result = { schemaVersion: 'openpapers.real-source-evaluation.v1', kind: split === 'holdout' ? 'real-source-holdout' : 'real-source-development', commit, dataset: dataset.version, split, holdoutInfluencedTuning: split === 'holdout' ? false : null, configuration: { providerMode: 'offline-pinned-artifact', parserMode: 'pymupdf-real-pdf', liveProviders: false }, taskCount: rows.length, metrics: scoreRealSourceRows(rows), failureCategories: Object.fromEntries([...new Set(rows.map(row => row.failureCategory).filter(Boolean))].map(category => [category, rows.filter(row => row.failureCategory === category).length])), rows };
const dir = join(root, 'evals/results'); await mkdir(dir, { recursive: true });
const prefix = split === 'holdout' ? 'real-source-holdout' : 'real-source-dev-baseline-v1';
const output = join(dir, `${prefix}-${commit.slice(0, 12)}.json`); await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output, dataset: dataset.version, split, metrics: result.metrics, failureCategories: result.failureCategories }, null, 2));
