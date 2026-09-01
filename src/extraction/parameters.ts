import type { ParsedDocument } from '../ingestion/document.js';
import type { Locator } from '../models/research.js';

export interface TrainingParameter { name: 'learning_rate' | 'batch_size' | 'epochs' | 'optimizer' | 'weight_decay' | 'temperature' | 'gradient_accumulation'; value: string; sourceUrl: string; locator: Locator; confidence: 'explicit'; }

type Rule = [TrainingParameter['name'], RegExp];
const rules: Rule[] = [
  ['learning_rate', /(?:learning\s*rate|lr)\s*(?:of|=|:)?\s*([0-9]+(?:\.[0-9]+)?(?:e[-+]?\d+)?)/i],
  ['batch_size', /batch\s*size\s*(?:of|=|:)?\s*(\d+)/i],
  ['epochs', /(?:(?:number\s+of\s+)?epochs?\s*(?:of|=|:)?\s*(\d+)|(\d+)\s*epochs?)/i],
  ['optimizer', /(?:optimizer\s*(?:of|=|:)?|use|using)\s*(AdamW|Adam|SGD|Adafactor|Lion)\b/i],
  ['weight_decay', /weight\s*decay\s*(?:of|=|:)?\s*([0-9]+(?:\.[0-9]+)?(?:e[-+]?\d+)?)/i],
  ['temperature', /temperature\s*(?:of|=|:)?\s*([0-9]+(?:\.[0-9]+)?)/i],
  ['gradient_accumulation', /gradient\s*accumulation(?:\s*steps?)?\s*(?:of|=|:)?\s*(\d+)/i],
];

export function extractTrainingParameters(document: ParsedDocument): TrainingParameter[] {
  const output: TrainingParameter[] = [];
  for (const section of document.sections) {
    for (const [name, pattern] of rules) {
      const match = section.text.match(pattern);
      if (!match) continue;
      const value = match[1] ?? match[2];
      if (!value) continue;
      output.push({name,value,sourceUrl:document.url,locator:{section:section.heading,...(section.page === undefined ? {} : {page:section.page}),...(section.pageId === undefined ? {} : {pageId:section.pageId})},confidence:'explicit'});
    }
  }
  return output;
}
