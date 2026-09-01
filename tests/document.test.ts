import { describe, expect, it } from 'vitest';
import { detectDocumentFormat, parseDocument } from '../src/ingestion/document.js';

const html = new TextEncoder().encode('<html><head><title>Paper</title><script>ignore()</script></head><body><h1>Introduction</h1><p>First paragraph.</p><h2>Method</h2><p>Details <a href="https://example.com/ref">reference</a>.</p><h2>References</h2><p>[1] A cited work.</p></body></html>');

describe('structured document parsing', () => {
  it('detects HTML from content type or markup and extracts sections', () => {
    expect(detectDocumentFormat('text/html', html)).toBe('html');
    expect(detectDocumentFormat('application/octet-stream', html)).toBe('html');
    expect(parseDocument({url:'https://example.com/paper',contentType:'text/html',bytes:html.byteLength,body:html})).toMatchObject({format:'html',title:'Paper',sections:[{level:1,heading:'Introduction',text:'First paragraph.'},{level:2,heading:'Method',text:'Details reference.'},{level:2,heading:'References',text:'[1] A cited work.'}]});
  });

  it('detects PDF bytes and refuses to claim they were parsed', () => {
    const pdf = new TextEncoder().encode('%PDF-1.7\n');
    expect(detectDocumentFormat('application/octet-stream', pdf)).toBe('pdf');
    expect(() => parseDocument({url:'https://example.com/paper.pdf',contentType:'application/pdf',bytes:pdf.byteLength,body:pdf})).toThrow('PDF parsing is not available');
  });

  it('rejects unknown binary formats explicitly', () => {
    const binary = new Uint8Array([0, 1, 2, 3]);
    expect(detectDocumentFormat('application/octet-stream', binary)).toBe('unknown');
    expect(() => parseDocument({url:'https://example.com/paper',contentType:'application/octet-stream',bytes:4,body:binary})).toThrow('unsupported document format');
  });
});
