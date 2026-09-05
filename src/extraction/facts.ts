import type { Locator } from '../models/research.js';
import type { ParsedDocument, DocumentSection } from '../ingestion/document.js';
import { normalizePdfText } from './text-normalization.js';

export type FactValue = string | number | boolean;
export type FactPredicate = 'optimization.optimizer' | 'training.dataset' | 'architecture.depth' | 'architecture.attention.algorithm' | 'training.precision' | 'optimization.preference_method' | 'training.parameter_update' | 'retrieval.retriever';
export type CandidateTrigger = 'optimizer' | 'dataset' | 'depth' | 'attention' | 'precision' | 'preference_method' | 'frozen_parameter' | 'retrieval';
export type ValidationReason = 'ACCEPT' | 'REJECT_UNSUPPORTED' | 'REJECT_ROLE' | 'REJECT_SCOPE' | 'REJECT_STAGE' | 'REJECT_NEGATION' | 'REJECT_CITATION' | 'REJECT_BASELINE' | 'REJECT_NORMALIZATION';

export interface CandidateEvidence {
  candidatePredicate: FactPredicate;
  rawValue: string;
  rawText: string;
  normalizedText: string;
  sourceId: string;
  sourceClass: 'PAPER';
  locator: Locator;
  section: string;
  context: string;
  subjectHint?: string | undefined;
  roleHint?: string | undefined;
  scopeHint?: string | undefined;
  stageHint?: string | undefined;
  triggerKind: CandidateTrigger;
}

export interface ResearchFact {
  predicate: FactPredicate;
  value: FactValue;
  rawValue: string;
  valueType: 'string' | 'number' | 'boolean';
  sourceId: string;
  sourceClass: 'PAPER';
  locator: Locator;
  rawEvidence: string;
  subject?: string | undefined;
  role?: string | undefined;
  scope?: string | undefined;
  stage?: string | undefined;
  extractionMethod: 'v5.1-deterministic';
}

export interface ValidationDiagnostic { candidate: CandidateEvidence; reason: ValidationReason; }
export interface FactExtractionResult { candidates: CandidateEvidence[]; facts: ResearchFact[]; diagnostics: { accepted: number; rejections: ValidationDiagnostic[]; }; }

type CandidateRule = { predicate: FactPredicate; triggerKind: CandidateTrigger; pattern: RegExp; value: (match: RegExpMatchArray, sentence: string) => string; subject?: (match: RegExpMatchArray) => string | undefined; scope: string; stage: string; };
const rules: CandidateRule[] = [
  {predicate:'optimization.optimizer',triggerKind:'optimizer',pattern:/\b(AdamW|Adam|SGD|Adafactor|Lion)\b/i,value:m=>m[1]!,scope:'optimization',stage:'training'},
  {predicate:'training.dataset',triggerKind:'dataset',pattern:/\b((?:WMT|WikiText|C4|The Pile|ImageNet)[^,.]*?)\s+dataset\b/i,value:m=>m[1]!.trim(),scope:'training',stage:'training'},
  {predicate:'architecture.depth',triggerKind:'depth',pattern:/\b([A-Z][A-Za-z0-9_-]*(?:BASE|LARGE)?)\s+has\s+(\d+)\s+layers?\b/i,value:m=>m[2]!,subject:m=>m[1],scope:'architecture',stage:'all'},
  {predicate:'architecture.depth',triggerKind:'depth',pattern:/\b([A-Z][A-Za-z0-9_-]*)\s+(BASE|LARGE)\s*\(\s*L\s*=\s*(\d+)/i,value:m=>m[3]!,subject:m=>`${m[1]}${m[2]}`,scope:'architecture',stage:'all'},
  {predicate:'architecture.attention.algorithm',triggerKind:'attention',pattern:/\b(FlashAttention|PagedAttention|Multi-Head Attention)\b/i,value:m=>m[1]!,scope:'architecture',stage:'all'},
  {predicate:'training.precision',triggerKind:'precision',pattern:/\b(\d+\s*-\s*bit)\s+(?:quantized|precision|finetuning)\b/i,value:m=>m[1]!.replace(/\s+/g,''),scope:'training',stage:'finetuning'},
  {predicate:'optimization.preference_method',triggerKind:'preference_method',pattern:/\b(?:Direct Preference Optimization)\s*\((DPO)\)/i,value:m=>m[1]!,scope:'training',stage:'preference optimization'},
  {predicate:'training.parameter_update',triggerKind:'frozen_parameter',pattern:/\b(frozen)\b|does not receive gradient updates/i,value:()=> 'base weights frozen',scope:'training',stage:'finetuning'},
  {predicate:'retrieval.retriever',triggerKind:'retrieval',pattern:/\bretrieval\b/i,value:()=> 'retrieval',scope:'retrieval',stage:'inference'}
];

function sentences(text: string): Array<{rawText:string; normalizedText:string}> { return text.split(/(?<=[.!?])\s+/).map(rawText=>({rawText,normalizedText:normalizePdfText(rawText)})).filter(item=>item.normalizedText); }
function locator(section: DocumentSection): Locator { return {section:section.heading,...(section.page===undefined?{}:{page:section.page}),...(section.pageId===undefined?{}:{pageId:section.pageId})}; }
function isExternal(section: string, sentence: string): ValidationReason | undefined {
  if (/related|references?|prior work|previous work|cited|literature/i.test(section) || /\b(?:prior|previous|existing)\s+work\b|\bcited\s+(?:model|work)\b/i.test(sentence)) return 'REJECT_CITATION';
  if (/baseline|ablation|comparison|control/i.test(sentence)) return 'REJECT_BASELINE';
  return undefined;
}
function isNegated(sentence: string): boolean { return /\b(?:do|does|did)\s+not\b|\bwithout\b|\bnever\b|\bno\s+(?:longer\s+)?use\b/i.test(sentence); }

export function extractCandidateEvidence(document: ParsedDocument): CandidateEvidence[] {
  const candidates: CandidateEvidence[] = [];
  for (const section of document.sections) {
    if (!section.text) continue;
    for (const sentencePair of sentences(section.text)) {
      const sentence=sentencePair.normalizedText;
      for (const rule of rules) {
        const match = sentence.match(rule.pattern);
        if (!match) continue;
        const candidate: CandidateEvidence = {candidatePredicate:rule.predicate,rawValue:rule.value(match,sentence),rawText:sentencePair.rawText,normalizedText:sentence,sourceId:document.url,sourceClass:'PAPER',locator:locator(section),section:section.heading,context:normalizePdfText(section.text),scopeHint:rule.scope,stageHint:rule.stage,triggerKind:rule.triggerKind,...(rule.subject?.(match) ? {subjectHint:rule.subject(match)} : {})};
        candidates.push(candidate);
      }
    }
  }
  return candidates;
}

export function validateCandidateEvidence(candidate: CandidateEvidence): { reason: ValidationReason; fact?: ResearchFact } {
  const sentence=candidate.normalizedText;
  const external = isExternal(candidate.section,sentence);
  if (external) return {reason:external};
  if (isNegated(sentence) && !(candidate.candidatePredicate === 'training.parameter_update' && /\bfrozen\b|\bfixed\b|does not receive gradient updates/i.test(sentence))) return {reason:'REJECT_NEGATION'};
  if (!candidate.rawValue.trim()) return {reason:'REJECT_NORMALIZATION'};
  const value: FactValue = candidate.candidatePredicate === 'architecture.depth' ? Number(candidate.rawValue) : candidate.rawValue;
  if (typeof value === 'number' && !Number.isInteger(value)) return {reason:'REJECT_NORMALIZATION'};
  return {reason:'ACCEPT',fact:{predicate:candidate.candidatePredicate,value,rawValue:candidate.rawValue,valueType:typeof value as 'string'|'number'|'boolean',sourceId:candidate.sourceId,sourceClass:candidate.sourceClass,locator:candidate.locator,rawEvidence:candidate.rawText,scope:candidate.scopeHint,stage:candidate.stageHint,extractionMethod:'v5.1-deterministic',...(candidate.subjectHint ? {subject:candidate.subjectHint} : {})}};
}

export function extractResearchFacts(document: ParsedDocument): FactExtractionResult {
  const candidates=extractCandidateEvidence(document); const rejections:ValidationDiagnostic[]=[]; const facts:ResearchFact[]=[];
  for (const candidate of candidates) { const result=validateCandidateEvidence(candidate); if (result.fact) facts.push(result.fact); else rejections.push({candidate,reason:result.reason}); }
  return {candidates,facts,diagnostics:{accepted:facts.length,rejections}};
}
