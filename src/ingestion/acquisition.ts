import { isIP } from 'node:net';

export interface AcquiredDocument { url: string; contentType: string; bytes: number; body: Uint8Array; }
export interface AcquisitionOptions { maxBytes?: number; timeoutMs?: number; maxRedirects?: number; }

function assertSafeUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('invalid URL'); }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('unsupported protocol');
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const ipVersion = isIP(host);
  const unsafeIpv4 = ipVersion === 4 && (host === '0.0.0.0' || host === '127.0.0.1' || host.startsWith('10.') || host.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(host));
  const unsafeIpv6 = ipVersion === 6 && (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:'));
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || unsafeIpv4 || unsafeIpv6) throw new Error('unsafe host');
  return url;
}

export class PaperAcquirer {
  constructor(private readonly fetcher: typeof fetch = fetch, private readonly options: AcquisitionOptions = {}) {}
  async acquire(input: string): Promise<AcquiredDocument> {
    const maxBytes = this.options.maxBytes ?? 25 * 1024 * 1024;
    const timeoutMs = this.options.timeoutMs ?? 30_000;
    const maxRedirects = this.options.maxRedirects ?? 3;
    let url = assertSafeUrl(input);
    for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try { response = await this.fetcher(url, {redirect:'manual', signal:controller.signal}); } finally { clearTimeout(timeout); }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new Error('redirect missing location');
        if (redirect === maxRedirects) throw new Error('redirect limit');
        url = assertSafeUrl(new URL(location, url).toString());
        continue;
      }
      if (!response.ok) throw new Error(`acquisition failed: ${response.status}`);
      const declared = Number(response.headers.get('content-length') ?? 0);
      if (declared > maxBytes) throw new Error('size limit');
      const chunks: Uint8Array[] = [];
      let total = 0;
      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          total += next.value.byteLength;
          if (total > maxBytes) { await reader.cancel(); throw new Error('size limit'); }
          chunks.push(next.value);
        }
      } else {
        const buffer = new Uint8Array(await response.arrayBuffer());
        total = buffer.byteLength;
        if (total > maxBytes) throw new Error('size limit');
        chunks.push(buffer);
      }
      const body = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
      return {url:url.toString(), contentType:response.headers.get('content-type')?.split(';',1)[0]?.trim() ?? 'application/octet-stream', bytes:total, body};
    }
    throw new Error('redirect limit');
  }
}
