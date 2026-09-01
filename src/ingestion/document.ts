import type { AcquiredDocument } from './acquisition.js';

export type DocumentFormat = 'html' | 'pdf' | 'unknown';
export interface DocumentSection { level: number; heading: string; text: string; }
export interface DocumentReference { text: string; href?: string; }
export interface ParsedDocument { format: 'html' | 'pdf'; url: string; title?: string; sections: DocumentSection[]; references: DocumentReference[]; warnings: string[]; }

const decodeEntities = (value: string): string => value.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
const textOf = (value: string): string => decodeEntities(value.replace(/<!--.*?-->/gs, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+([.,!?;:])/g, '$1').replace(/\s+/g, ' ').trim());

export function detectDocumentFormat(contentType: string | undefined, body: Uint8Array): DocumentFormat {
  const type = contentType?.toLowerCase().split(';', 1)[0]?.trim();
  if (type === 'application/pdf' || new TextDecoder().decode(body.slice(0, 5)) === '%PDF-') return 'pdf';
  if (type === 'text/html' || type === 'application/xhtml+xml') return 'html';
  const prefix = new TextDecoder().decode(body.slice(0, 512)).trimStart().toLowerCase();
  return prefix.startsWith('<!doctype html') || prefix.startsWith('<html') || /<(head|body|article|h[1-6])\b/.test(prefix) ? 'html' : 'unknown';
}

export function parseDocument(document: AcquiredDocument): ParsedDocument {
  const format = detectDocumentFormat(document.contentType, document.body);
  if (format === 'pdf') throw new Error('PDF parsing is not available');
  if (format !== 'html') throw new Error('unsupported document format');
  const source = new TextDecoder().decode(document.body);
  const titleMatch = source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const sections: DocumentSection[] = [];
  const references: DocumentReference[] = [];
  let current: DocumentSection | undefined;
  const blockPattern = /<(h[1-6]|p|li)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  for (const match of source.matchAll(blockPattern)) {
    const tag = match[1]!.toLowerCase();
    const raw = match[3]!;
    const text = textOf(raw);
    if (!text) continue;
    if (tag.startsWith('h')) {
      current = {level:Number(tag.slice(1)), heading:text, text:''};
      sections.push(current);
      continue;
    }
    if (!current) { current = {level:0, heading:'', text:''}; sections.push(current); }
    current.text = current.text ? `${current.text} ${text}` : text;
    const href = raw.match(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/i)?.[1];
    if (/^references?$/i.test(current.heading) || /^\[\d+\]/.test(text)) references.push({text, ...(href ? {href} : {})});
  }
  return {format:'html',url:document.url,...(titleMatch ? {title:textOf(titleMatch[1]!)} : {}),sections,references,warnings:[]};
}


export function parseGrobidTei(url: string, tei: string): ParsedDocument {
  const titleMatch = tei.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const sections: DocumentSection[] = [];
  for (const match of tei.matchAll(/<div\b[^>]*>[\s\S]*?<head\b[^>]*>([\s\S]*?)<\/head>([\s\S]*?)(?=<div\b|<\/body>)/gi)) {
    const heading = textOf(match[1]!);
    const text = textOf(match[2]!);
    if (heading || text) sections.push({level:1,heading,text});
  }
  const references: DocumentReference[] = [];
  for (const match of tei.matchAll(/<biblStruct\b[^>]*>([\s\S]*?)<\/biblStruct>/gi)) {
    const text = textOf(match[1]!);
    if (text) references.push({text});
  }
  return {format:'pdf',url,...(titleMatch ? {title:textOf(titleMatch[1]!)} : {}),sections,references,warnings:[]};
}


export interface DocumentChunk { chunkId: string; url: string; format: 'html' | 'pdf'; ordinal: number; sectionHeading: string; sectionLevel: number; text: string; }

export function chunkDocument(document: ParsedDocument, maxChars = 2000): DocumentChunk[] {
  if (!Number.isInteger(maxChars) || maxChars < 1) throw new Error('maxChars must be a positive integer');
  const chunks: DocumentChunk[] = [];
  for (const [sectionIndex, section] of document.sections.entries()) {
    const words = section.text.split(/\s+/).filter(Boolean);
    let text = '';
    for (const word of words) {
      if (text && text.length + word.length + 1 > maxChars) {
        chunks.push({chunkId:`${document.url}#section-${sectionIndex}-chunk-${chunks.length}`,url:document.url,format:document.format,ordinal:chunks.length,sectionHeading:section.heading,sectionLevel:section.level,text});
        text = '';
      }
      text = text ? `${text} ${word}` : word;
    }
    if (text) chunks.push({chunkId:`${document.url}#section-${sectionIndex}-chunk-${chunks.length}`,url:document.url,format:document.format,ordinal:chunks.length,sectionHeading:section.heading,sectionLevel:section.level,text});
  }
  return chunks;
}

export function searchDocument(document: ParsedDocument, query: string, limit = 10): DocumentChunk[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) throw new Error('query must not be empty');
  if (!Number.isInteger(limit) || limit < 1) throw new Error('limit must be a positive integer');
  return chunkDocument(document).filter(chunk => `${chunk.sectionHeading} ${chunk.text}`.toLowerCase().includes(normalized)).sort((a,b) => Number(`${b.sectionHeading} ${b.text}`.toLowerCase().includes(normalized)) - Number(`${a.sectionHeading} ${a.text}`.toLowerCase().includes(normalized)) || a.ordinal-b.ordinal).slice(0,limit);
}
