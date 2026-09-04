export function scoreRealSourceRows(rows) {
  const n = rows.length || 1;
  const count = predicate => rows.filter(predicate).length;
  const metric = key => { const measured = rows.filter(row => typeof row[key] === 'boolean'); return measured.length ? measured.filter(row => row[key]).length / measured.length : null; };
  const expectedUnknown = count(row => row.expectedStatus === 'UNKNOWN');
  const expectedNot = count(row => row.expectedStatus === 'NOT_REPORTED');
  const actualUnknown = count(row => row.actualStatus === 'UNKNOWN');
  const actualNot = count(row => row.actualStatus === 'NOT_REPORTED');
  const actualConflicts = count(row => row.actualStatus === 'CONFLICTING');
  const expectedConflicts = count(row => row.expectedStatus === 'CONFLICTING');
  const trueConflicts = count(row => row.actualStatus === 'CONFLICTING' && row.expectedStatus === 'CONFLICTING');
  return {
    workAccuracy: metric('workCorrect'), identifierAccuracy: metric('identifierCorrect'), answerCorrectness: metric('answerCorrect'),
    evidenceSourceAccuracy: metric('evidenceSourceCorrect'), locatorAccuracy: metric('locatorCorrect'), supportStatusAccuracy: metric('supportStatusCorrect'),
    correctUNKNOWN: expectedUnknown ? count(row => row.actualStatus === 'UNKNOWN' && row.expectedStatus === 'UNKNOWN') / expectedUnknown : null,
    correctNOT_REPORTED: expectedNot ? count(row => row.actualStatus === 'NOT_REPORTED' && row.expectedStatus === 'NOT_REPORTED') / expectedNot : null,
    falseUNKNOWN: count(row => row.actualStatus === 'UNKNOWN' && row.expectedStatus !== 'UNKNOWN') / n,
    falseNOT_REPORTED: count(row => row.actualStatus === 'NOT_REPORTED' && row.expectedStatus !== 'NOT_REPORTED') / n,
    fabricatedAnswerRate: count(row => ['UNKNOWN','NOT_REPORTED'].includes(row.expectedStatus) && Object.keys(row.actualAnswer ?? {}).length > 0) / n,
    conflictPrecision: actualConflicts ? trueConflicts / actualConflicts : null,
    conflictRecall: expectedConflicts ? trueConflicts / expectedConflicts : null,
    taskCount: rows.length, expectedUnknown, expectedNotReported: expectedNot, actualUnknown, actualNotReported: actualNot
  };
}
