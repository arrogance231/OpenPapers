export function rankingMetrics(ranked, relevant, ks=[1,5,10]) {
  const relevantSet=new Set(relevant);
  const first=ranked.findIndex(id=>relevantSet.has(id));
  const out={mrr:first<0?0:1/(first+1)};
  for(const k of ks){
    const top=ranked.slice(0,k);
    const hits=top.filter(id=>relevantSet.has(id)).length;
    out[`recallAt${k}`]=relevant.length ? hits/relevant.length : null;
    out[`precisionAt${k}`]=hits/k;
  }
  return out;
}

export function aggregateRanking(rows) {
  if(!rows.length)return {queries:0,mrr:null};
  const keys=['mrr','recallAt1','precisionAt1','recallAt5','precisionAt5','recallAt10','precisionAt10'];
  return Object.fromEntries([['queries',rows.length],...keys.map(k=>[k,rows.reduce((sum,row)=>sum+(row[k]??0),0)/rows.length])]);
}

export function identityMetrics(rows) {
  const total=rows.length;
  const correct=rows.filter(row=>row.predicted===row.expected).length;
  const groups=new Map();
  for(const row of rows){const values=groups.get(row.group??row.expected)??new Set();values.add(row.predicted);groups.set(row.group??row.expected,values);}
  const falseSplits=[...groups.values()].filter(values=>values.size>1).length;
  const byPrediction=new Map();
  for(const row of rows){const values=byPrediction.get(row.predicted)??new Set();values.add(row.group??row.expected);byPrediction.set(row.predicted,values);}
  const falseMerges=[...byPrediction.values()].filter(values=>values.size>1).length;
  return {cases:total,identityAccuracy:total?correct/total:null,falseMergeRate:total?falseMerges/total:null,falseSplitRate:total?falseSplits/total:null,unresolvedRate:total?rows.filter(row=>row.unresolved).length/total:null,wrongCanonicalRate:total?rows.filter(row=>!row.unresolved&&row.predicted!==row.expected).length/total:null};
}

function key(name,value){return `${name}:${String(value).trim().toLowerCase()}`;}
export function extractionMetrics(rows) {
  const names=[...new Set(rows.flatMap(row=>[...Object.keys(row.gold),...row.predicted.map(item=>item.name)]))];
  const perField={}; let macro=0,tp=0,fp=0,fn=0;
  for(const name of names){const gold=new Set(rows.flatMap(row=>Object.hasOwn(row.gold,name)?[key(name,row.gold[name])]:[]));const predicted=new Set(rows.flatMap(row=>row.predicted.filter(item=>item.name===name).map(item=>key(name,item.value))));const truePos=[...predicted].filter(item=>gold.has(item)).length;const falsePos=predicted.size-truePos;const falseNeg=gold.size-truePos;const precision=truePos+falsePos?truePos/(truePos+falsePos):1;const recall=truePos+falseNeg?truePos/(truePos+falseNeg):1;const f1=precision+recall?2*precision*recall/(precision+recall):0;perField[name]={precision,recall,f1};macro+=f1;tp+=truePos;fp+=falsePos;fn+=falseNeg;}
  const microPrecision=tp+fp?tp/(tp+fp):1;const microRecall=tp+fn?tp/(tp+fn):1;
  const predictedCount=rows.reduce((sum,row)=>sum+row.predicted.length,0);const hallucinated=rows.reduce((sum,row)=>sum+row.predicted.filter(item=>!Object.hasOwn(row.gold,item.name)||String(row.gold[item.name]).trim().toLowerCase()!==String(item.value).trim().toLowerCase()).length,0);
  return {perField,macroF1:names.length?macro/names.length:null,microF1:microPrecision+microRecall?2*microPrecision*microRecall/(microPrecision+microRecall):0,hallucinatedFieldRate:predictedCount?hallucinated/predictedCount:0};
}

export function citationMetrics(rows){const tp=rows.filter(row=>row.expectedValid&&row.actualValid).length;const fp=rows.filter(row=>!row.expectedValid&&row.actualValid).length;const fn=rows.filter(row=>row.expectedValid&&!row.actualValid).length;return {cases:rows.length,citationPrecision:tp+fp?tp/(tp+fp):null,unsupportedCitationRate:rows.length?fp/rows.length:null,invalidLocatorRate:null,wrongWorkRate:null,missingSourceRate:rows.filter(row=>row.missingSource).length/rows.length};}
