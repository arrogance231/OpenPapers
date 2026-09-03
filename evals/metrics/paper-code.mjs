const ratio=(numerator,denominator)=>denominator?numerator/denominator:null;

function summarize(rows){
  const matches=rows.filter(row=>row.expected==='MATCH');
  const conflicts=rows.filter(row=>row.expected==='CONFLICT');
  const predictedConflicts=rows.filter(row=>row.predicted==='CONFLICT');
  const nonConflicts=rows.filter(row=>row.expected!=='CONFLICT');
  const predictedMatches=rows.filter(row=>row.predicted==='MATCH');
  const unknowns=rows.filter(row=>row.expected==='UNKNOWN');
  return {
    cases:rows.length,
    exactAgreementAccuracy:ratio(rows.filter(row=>row.expected==='MATCH'&&row.predicted==='MATCH').length,matches.length),
    classificationAccuracy:ratio(rows.filter(row=>row.expected===row.predicted).length,rows.length),
    conflictPrecision:ratio(predictedConflicts.filter(row=>row.expected==='CONFLICT').length,predictedConflicts.length),
    conflictRecall:ratio(conflicts.filter(row=>row.predicted==='CONFLICT').length,conflicts.length),
    falseAgreementRate:ratio(predictedMatches.filter(row=>row.expected!=='MATCH').length,rows.length),
    falseConflictRate:ratio(predictedConflicts.filter(row=>row.expected!=='CONFLICT').length,rows.length),
    correctUnknownRate:ratio(unknowns.filter(row=>row.predicted==='UNKNOWN').length,unknowns.length),
    nonConflictCases:nonConflicts.length
  };
}

export function paperCodeMetrics(rows){
  const byField={};
  for(const field of new Set(rows.map(row=>row.field).filter(Boolean)))byField[field]=summarize(rows.filter(row=>row.field===field));
  return {...summarize(rows),byField};
}
