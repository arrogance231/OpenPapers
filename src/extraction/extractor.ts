import type { ParsedDocument } from '../ingestion/document.js';
import { extractPaperFacts, type PaperFact } from './heuristic.js';

export interface PaperExtractor<T> { readonly name: string; extract(document: ParsedDocument): Promise<T>; }

export class DeterministicPaperExtractor implements PaperExtractor<PaperFact[]> {
  readonly name = 'deterministic';
  async extract(document: ParsedDocument): Promise<PaperFact[]> { return extractPaperFacts(document); }
}
