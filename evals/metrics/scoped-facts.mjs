function norm(value) {
  return String(value).trim().toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ');
}

export const EQUIVALENCES = new Map([
  ['supervised fine-tuning', 'sft'], ['sft', 'sft'],
  ['bfloat16', 'bf16'], ['bf16', 'bf16'],
  ['direct preference optimization', 'dpo'], ['dpo', 'dpo']
]);

export function equivalentValue(a, b) {
  const left = EQUIVALENCES.get(norm(a)) ?? norm(a);
  const right = EQUIVALENCES.get(norm(b)) ?? norm(b);
  return left === right;
}

function family(predicate) { return predicate.split('.')[0]; }
function sameScope(predicted, gold) {
  return predicted.section === gold.section && predicted.predicate === gold.predicate;
}

export function validateScopedFactDataset(dataset) {
  const errors = [];
  if (dataset.version !== 'research-facts-v5-development') errors.push('unexpected dataset version');
  if (dataset.completenessPolicy !== 'EXHAUSTIVE_WITHIN_SCOPE') errors.push('dataset is not exhaustive-within-scope');
  const ids = new Set();
  for (const paper of dataset.papers ?? []) {
    if (!paper.artifact?.sha256 || !/^[a-f0-9]{64}$/.test(paper.artifact.sha256)) errors.push(`${paper.paperId}: invalid artifact sha256`);
    const sections = new Set(paper.scope?.sections ?? []);
    const allowed = new Set(paper.allowedPredicateFamilies ?? []);
    for (const section of paper.sourceSections ?? []) {
      if (!sections.has(section.heading)) errors.push(`${paper.paperId}: source section outside scope: ${section.heading}`);
      if (!Number.isInteger(section.page) || !section.text) errors.push(`${paper.paperId}: invalid source section locator`);
    }
    for (const fact of paper.goldFacts ?? []) {
      if (ids.has(fact.factId)) errors.push(`duplicate factId: ${fact.factId}`);
      ids.add(fact.factId);
      if (!([...allowed].some(prefix => fact.predicate === prefix || fact.predicate.startsWith(`${prefix}.`)))) errors.push(`${fact.factId}: predicate outside allowed families`);
      if (!sections.has(fact.section)) errors.push(`${fact.factId}: fact outside scope`);
      const source = paper.sourceSections?.find(item => item.heading === fact.section);
      if (!source || !source.text.includes(fact.rawEvidence)) errors.push(`${fact.factId}: raw evidence not found in source section`);
      if (fact.page !== source?.page) errors.push(`${fact.factId}: page disagrees with source section`);
    }
  }
  return errors;
}

function projectedCandidate(fact) {
  const kindToPredicate = { methodology:'architecture', loss:'optimization', dataset:'training', benchmark:'evaluation', training_stage:'training', hyperparameter:'optimization', limitation:'other', equation:'architecture' };
  return { predicate: kindToPredicate[fact.kind] ?? 'other', value: fact.text, section: fact.locator.section ?? '', locator: fact.locator };
}

export function scoreScopedPaper(paper, predicted) {
  const production = !Array.isArray(predicted);
  const predictedFacts = production ? predicted.facts : predicted;
  const gold = paper.goldFacts;
  const candidates = (production ? predicted.candidates : predictedFacts).map(item => production ? { predicate:item.candidatePredicate, value:item.rawValue, section:item.section, locator:item.locator } : projectedCandidate(item));
  const accepted = production ? predictedFacts.map(item => ({predicate:item.predicate, value:item.value, section:item.locator.section ?? '', locator:item.locator})) : candidates;
  const inScope = candidates.filter(candidate => paper.scope.sections.includes(candidate.section) && paper.allowedPredicateFamilies.some(prefix => candidate.predicate === prefix || candidate.predicate.startsWith(`${prefix}.`)));
  const acceptedInScope = accepted.filter(fact => paper.scope.sections.includes(fact.section) && paper.allowedPredicateFamilies.some(prefix => fact.predicate === prefix || fact.predicate.startsWith(`${prefix}.`)));
  const used = new Set();
  const matches = [];
  for (const fact of acceptedInScope) {
    const index = gold.findIndex((item, i) => !used.has(i) && item.section === fact.section && item.predicate === fact.predicate && equivalentValue(item.canonicalValue, fact.value));
    if (index >= 0) { used.add(index); matches.push({candidate:fact, gold:gold[index], classification:'TP'}); }
  }
  const duplicateEquivalent = [];
  const seen = new Set();
  for (const item of matches) { const key = `${item.gold.predicate}|${norm(item.gold.canonicalValue)}`; if (seen.has(key)) duplicateEquivalent.push(item); else seen.add(key); }
  const tp = matches.length - duplicateEquivalent.length;
  const fp = acceptedInScope.length - matches.length;
  const fn = gold.length - tp;
  const outOfScope = candidates.length - inScope.length;
  const candidateRecall = gold.length ? gold.filter(g => inScope.some(c => c.section === g.section && c.predicate === g.predicate)).length / gold.length : null;
  const precision = tp + fp ? tp / (tp + fp) : (gold.length ? 0 : 1);
  const recall = tp + fn ? tp / (tp + fn) : 1;
  return { paperId: paper.paperId, candidates: candidates.length, inScopeCandidates: inScope.length, candidateRecall, candidatesPerGold: gold.length ? candidates.length / gold.length : null, tp, fp, fn, outOfScope, duplicateEquivalent: duplicateEquivalent.length, precision, recall, f1: precision + recall ? 2 * precision * recall / (precision + recall) : 0, valueAccuracy: tp / (gold.length || 1), predicateAccuracy: tp / (gold.length || 1), roleAccuracy: null, scopeAccuracy: matches.length / (gold.length || 1), stageAccuracy: null, sourceAccuracy: null, locatorAccuracy: matches.length / (gold.length || 1), validatedFactDensityPer1000Tokens: acceptedInScope.length / Math.max(1, paper.sourceSections.reduce((n, s) => n + s.text.split(/\s+/).length, 0)) * 1000, matches, falsePositiveCategories: acceptedInScope.filter(c => !matches.some(m => m.candidate === c)).map(c => ({category:'unsupported_or_normalization_mismatch', predicate:c.predicate, section:c.section, value:c.value})), falseNegativeCategories: gold.filter((_, i) => !used.has(i)).map(g => ({factId:g.factId, category:'candidate_or_value_mismatch'}))};
}

export function aggregateScoped(rows) {
  const sum = key => rows.reduce((n, row) => n + row[key], 0);
  const tp = sum('tp'), fp = sum('fp'), fn = sum('fn');
  const precision = tp + fp ? tp / (tp + fp) : 1;
  const recall = tp + fn ? tp / (tp + fn) : 1;
  return {papers:rows.length, goldFacts:sum('tp') + sum('fn'), candidateCount:sum('candidates'), tp, fp, fn, outOfScope:sum('outOfScope'), duplicateEquivalent:sum('duplicateEquivalent'), precision, recall, f1:precision + recall ? 2 * precision * recall / (precision + recall) : 0, meanCandidateRecall:rows.length ? rows.reduce((n,r)=>n+(r.candidateRecall ?? 0),0)/rows.length:null, meanCandidatesPerGold:rows.length ? rows.reduce((n,r)=>n+(r.candidatesPerGold ?? 0),0)/rows.length:null, meanValidatedDensityPer1000Tokens:rows.length ? rows.reduce((n,r)=>n+r.validatedFactDensityPer1000Tokens,0)/rows.length:null};
}
