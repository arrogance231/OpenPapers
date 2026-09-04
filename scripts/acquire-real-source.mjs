import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataset = JSON.parse(await readFile(join(root, 'evals/datasets/research-real-v1.json'), 'utf8'));
const cacheRoot = join(root, '.cache', 'real-source');
const maxBytes = 50 * 1024 * 1024;
const split = process.argv.includes('--split=holdout') ? 'holdout' : process.argv.includes('--split=development') ? 'development' : null;
const metadataOnly = process.argv.includes('--metadata-only') || process.env.REAL_SOURCE_METADATA_ONLY === '1';

function assertSafeUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error(`only HTTPS is allowed: ${value}`);
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) throw new Error(`private host rejected: ${value}`);
}
async function fetchBytes(url, redirects = 0) {
  assertSafeUrl(url);
  if (redirects > 4) throw new Error('redirect limit exceeded');
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000), headers: { accept: 'application/pdf' } });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) throw new Error(`redirect without location: ${response.status}`);
    return fetchBytes(new URL(location, url).toString(), redirects + 1);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > maxBytes) throw new Error(`content-length exceeds ${maxBytes} bytes`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxBytes) throw new Error(`body exceeds ${maxBytes} bytes`);
  return { url, buffer };
}

const cases = dataset.cases.filter(item => !split || item.split === split);
const rows = [];
for (const item of cases) {
  const row = { caseId: item.caseId, split: item.split, pdfUrl: item.source.pdfUrl, status: 'SKIPPED', retrievedAt: new Date().toISOString(), sha256: null, bytes: null, path: null, error: null };
  if (!metadataOnly) {
    try {
      const artifact = await fetchBytes(item.source.pdfUrl);
      const sha256 = createHash('sha256').update(artifact.buffer).digest('hex');
      if (item.source.paperSha256 && item.source.paperSha256 !== sha256) throw new Error(`SHA-256 mismatch: expected ${item.source.paperSha256}, got ${sha256}`);
      const path = join(cacheRoot, `${item.caseId}-${item.source.arxivVersion}.pdf`);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, artifact.buffer, { flag: 'wx' }).catch(async error => { if (error.code === 'EEXIST') await writeFile(path, artifact.buffer); else throw error; });
      row.status = 'ACQUIRED'; row.sha256 = sha256; row.bytes = artifact.buffer.byteLength; row.path = path;
    } catch (error) { row.status = 'UNAVAILABLE'; row.error = String(error); }
  }
  rows.push(row);
}
const output = join(root, 'evals', 'results', `real-source-acquisition-${split ?? 'all'}.json`);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify({ schemaVersion: 'openpapers.real-source-acquisition.v1', dataset: dataset.version, split: split ?? 'all', metadataOnly, rows }, null, 2) + '\n');
console.log(JSON.stringify({ output, dataset: dataset.version, split: split ?? 'all', metadataOnly, caseCount: rows.length, acquired: rows.filter(row => row.status === 'ACQUIRED').length, unavailable: rows.filter(row => row.status === 'UNAVAILABLE').length, skipped: rows.filter(row => row.status === 'SKIPPED').length }, null, 2));
