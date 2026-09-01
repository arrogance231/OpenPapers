import type { AcquiredDocument } from './acquisition.js';

export type DocumentFormat = 'html' | 'pdf' | 'unknown';
export interface DocumentSection { level: number; heading: string; text: string; }
export interface DocumentReference { text: string; href?: string; }
export interface ParsedDocument { format: 'html'; url: string; title?: string; sections: DocumentSection[]; references: DocumentReference[]; warnings: string[]; }

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
