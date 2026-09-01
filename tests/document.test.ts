import { describe, expect, it } from 'vitest';
import { chunkDocument, detectDocumentFormat, parseDocument, parseGrobidTei, searchDocument } from '../src/ingestion/document.js';
import { GrobidClient, PdfParserChain } from '../src/ingestion/pdf.js';

const html = new TextEncoder().encode('<html><head><title>Paper</title><script>ignore()</script></head><body><h1>Introduction</h1><p>First paragraph.</p><h2>Method</h2><p>Details <a href="https://example.com/ref">reference</a>.</p><h2>References</h2><p>[1] A cited work.</p></body></html>');

describe('structured document parsing', () => {
  it('parses GROBID TEI sections and bibliographic references', () => {
    const parsed = parseGrobidTei('https://example.com/paper.pdf', '<TEI><teiHeader><fileDesc><titleStmt><title>GROBID Paper</title></titleStmt></fileDesc></teiHeader><text><body><pb n="3" xml:id="page_3"/><div><head>Introduction</head><p>Text <ref type="bibr" target="#b1">[1]</ref>.</p><formula> x = y + 1 </formula><figure><figDesc>System overview.</figDesc></figure><table><head>Results</head><row><cell>A</cell><cell>B</cell></row></table><div><head>Nested</head><p>Nested text.</p></div></div><div type="appendix"><head>Appendix A</head><p>Supplementary details.</p></div></body><back><div type="references"><listBibl><biblStruct xml:id="b1"><analytic><title>Referenced Work</title></analytic></biblStruct></listBibl></div></back></text></TEI>');
    expect(parsed).toMatchObject({format:'pdf',title:'GROBID Paper'});
    expect(parsed.sections).toEqual(expect.arrayContaining([{level:1,heading:'Introduction',text:'Text [1].',page:3,pageId:'page_3'},{level:2,heading:'Nested',text:'Nested text.',page:3,pageId:'page_3'}]));
    expect(parsed.references).toEqual([{text:'Referenced Work'}]);
    expect(parsed.equations).toEqual(['x = y + 1']);
    expect(parsed.figures).toEqual([{caption:'System overview.'}]);
    expect(parsed.tables).toEqual([{caption:'Results',text:'Results A B'}]);
    expect(parsed.appendices).toEqual([{level:1,heading:'Appendix A',text:'Supplementary details.',page:3,pageId:'page_3',isAppendix:true}]);
  });

  it('posts PDF bytes to GROBID and returns parsed TEI', async () => {
    let request: Request | undefined;
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => { request = new Request(input, init); return new Response('<TEI><teiHeader><fileDesc><titleStmt><title>Result</title></titleStmt></fileDesc></teiHeader><text><body><div><head>Body</head><p>Content.</p></div></body></text></TEI>', {status:200, headers:{'content-type':'application/xml'}}); };
    const parsed = await new GrobidClient('http://grobid:8070', fetcher).process(new TextEncoder().encode('%PDF-1.7'), 'paper.pdf');
    expect(parsed.title).toBe('Result');
    expect(request?.url).toBe('http://grobid:8070/api/processFulltextDocument');
    expect(request?.method).toBe('POST');
  });

  it('uses configured fallbacks after GROBID failure and preserves a warning', async () => {
    const fallback = {name:'pymupdf', extract:async () => ({format:'pdf' as const,url:'file.pdf',sections:[],references:[],warnings:[]})};
    const chain = new PdfParserChain({process:async () => { throw new Error('offline'); }}, [fallback]);
    await expect(chain.process(new Uint8Array([37,80,68,70]), 'file.pdf')).resolves.toMatchObject({format:'pdf',warnings:['GROBID unavailable: Error: offline']});
  });
  it('creates stable source-located chunks and searches them', () => {
    const parsed = parseDocument({url:'https://example.com/paper.html',contentType:'text/html',bytes:html.byteLength,body:html});
    const chunks = chunkDocument(parsed, 20);
    expect(chunks.every(chunk => chunk.url === parsed.url && chunk.ordinal >= 0)).toBe(true);
    expect(searchDocument(parsed, 'details', 5)).toMatchObject([{sectionHeading:'Method',text:'Details reference.'}]);
  });
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
