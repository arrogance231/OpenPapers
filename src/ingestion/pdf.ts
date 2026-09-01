import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseGrobidTei, type ParsedDocument } from './document.js';

const runFile = promisify(execFile);
export interface PdfParser { process(body: Uint8Array, filename?: string): Promise<ParsedDocument>; }
export interface PdfFallback { name: 'pymupdf' | 'docling'; extract(body: Uint8Array, filename?: string): Promise<ParsedDocument>; }

export class GrobidClient implements PdfParser {
  constructor(private readonly baseUrl = process.env.GROBID_URL ?? 'http://127.0.0.1:8070', private readonly fetcher: typeof fetch = fetch, private readonly maxTeiBytes = 25 * 1024 * 1024) {}
  async process(body: Uint8Array, filename = 'paper.pdf'): Promise<ParsedDocument> {
    const form = new FormData();
    const pdfBytes = body.slice();
    form.append('input', new Blob([pdfBytes.buffer as ArrayBuffer], {type:'application/pdf'}), filename);
    const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, '')}/api/processFulltextDocument`, {method:'POST', body:form});
    if (!response.ok) throw new Error(`GROBID request failed: ${response.status}`);
    const tei = await response.text();
    if (new TextEncoder().encode(tei).byteLength > this.maxTeiBytes) throw new Error('GROBID response size limit');
    return parseGrobidTei(filename, tei);
  }
}

export class CommandPdfFallback implements PdfFallback {
  constructor(public readonly name: 'pymupdf' | 'docling', private readonly command: string, private readonly script: string) {}
  async extract(body: Uint8Array, filename = 'paper.pdf'): Promise<ParsedDocument> {
    const directory = await mkdtemp(join(tmpdir(), 'openpapers-pdf-'));
    const path = join(directory, filename.replace(/[^A-Za-z0-9._-]/g, '_'));
    try {
      await writeFile(path, body);
      const result = await runFile(this.command, [this.script, path], {maxBuffer:25 * 1024 * 1024, windowsHide:true});
      const parsed = JSON.parse(result.stdout) as Omit<ParsedDocument, 'url' | 'format'>;
      return {format:'pdf',url:filename,...parsed};
    } finally { await rm(directory, {recursive:true,force:true}); }
  }
}

export function createConfiguredPdfFallbacks(): PdfFallback[] {
  const command = process.env.PYTHON_COMMAND ?? 'python';
  const configured = (process.env.PDF_FALLBACKS ?? '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  const fallbacks: PdfFallback[] = [];
  if (configured.includes('pymupdf')) fallbacks.push(new CommandPdfFallback('pymupdf', command, process.env.PYMUPDF_SCRIPT ?? 'scripts/parse_pymupdf.py'));
  if (configured.includes('docling')) fallbacks.push(new CommandPdfFallback('docling', command, process.env.DOCLING_SCRIPT ?? 'scripts/parse_docling.py'));
  return fallbacks;
}

export class PdfParserChain implements PdfParser {
  constructor(private readonly primary: PdfParser = new GrobidClient(), private readonly fallbacks: PdfFallback[] = createConfiguredPdfFallbacks()) {}
  async process(body: Uint8Array, filename = 'paper.pdf'): Promise<ParsedDocument> {
    const warnings: string[] = [];
    try { return await this.primary.process(body, filename); } catch (error) { warnings.push(`GROBID unavailable: ${String(error)}`); }
    for (const fallback of this.fallbacks) {
      try { const parsed = await fallback.extract(body, filename); return {...parsed, warnings:[...warnings, ...parsed.warnings]}; }
      catch (error) { warnings.push(`${fallback.name} unavailable: ${String(error)}`); }
    }
    throw new Error(`PDF parsing failed: ${warnings.join('; ')}`);
  }
}
