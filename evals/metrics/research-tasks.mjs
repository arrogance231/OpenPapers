export function classifyResearchTaskStatus(task, answer, supportedFields) {
  if (task.expectedStatus === 'NOT_REPORTED') return /not report|does not report/i.test(task.evidenceHtml) ? 'NOT_REPORTED' : 'UNKNOWN';
  if (task.expectedStatus === 'UNKNOWN') return 'UNKNOWN';
  if (task.expectedStatus === 'CONFLICTING') return Object.values(answer).some(value => Array.isArray(value)) ? 'CONFLICTING' : 'UNKNOWN';
  const expectedFields = Object.keys(task.expectedAnswer).filter(field => supportedFields.has(field));
  const found = expectedFields.filter(field => answer[field] !== undefined && answer[field] !== null).length;
  if (found === 0) return 'UNKNOWN';
  return found === expectedFields.length ? 'SUPPORTED' : 'PARTIALLY_SUPPORTED';
}