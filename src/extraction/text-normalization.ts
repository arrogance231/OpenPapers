const LIGATURES: Record<string,string> = { 'ﬁ':'fi', 'ﬂ':'fl', 'ﬀ':'ff', 'ﬃ':'ffi', 'ﬄ':'ffl' };

export function normalizePdfText(value: string): string {
  return value.normalize('NFKC')
    .replace(/[ﬁﬂﬀﬃﬄ]/g, match => LIGATURES[match]!)
    .replace(/\u00ad/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/(?<=[A-Za-z])-\s*\n\s*(?=[A-Za-z])/g, '')
    .replace(/(?<=\d)-\s*\n\s*(?=[A-Za-z])/g, '-')
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/×/g, 'x')
    .replace(/[\u00a0\u2007\u202f\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, match => match.includes('\n') ? '-' : '-')
    .trim();
}

export function normalizedTokenSequence(value: string): string[] {
  return normalizePdfText(value).toLowerCase().match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu) ?? [];
}
