import { describe, expect, it } from 'vitest';
import { extractPinnedRepositoryEvidence, selectRepositoryFiles, reconcileRealEvidence } from '../src/research/repository-evidence.js';

describe('pinned repository evidence', () => {
  it('selects explainable files while excluding generated and vendored paths', () => {
    const files = ['README.md','configs/train.yaml','src/train.py','scripts/run.sh','vendor/train.py','checkpoints/model.bin','data/train.jsonl']
      .map(path => ({path,name:path.split('/').at(-1)!,type:'file',sha:`sha-${path}`}));
    expect(selectRepositoryFiles(files)).toEqual([
      {path:'README.md',reason:'README'},
      {path:'configs/train.yaml',reason:'configuration'},
      {path:'scripts/run.sh',reason:'launch script'},
      {path:'src/train.py',reason:'training source'},
    ]);
  });

  it('preserves exact pinned revision, raw values, normalized values, and lines', () => {
    const commitSha='a'.repeat(40);
    const evidence=extractPinnedRepositoryEvidence({owner:'org',repo:'paper',commitSha,path:'configs/train.yaml',content:'# config\nlearning_rate: 2e-5\nbatch_size: 128\n'});
    expect(evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({parameter:'learning_rate',rawValue:'2e-5',normalizedValue:0.00002,sourceClass:'CONFIG',locator:{path:'configs/train.yaml',startLine:2,endLine:2,commitSha}}),
      expect.objectContaining({parameter:'batch_size',rawValue:'128',normalizedValue:128}),
    ]));
  });

  it('keeps provider failure distinct from inspected absence', () => {
    expect(reconcileRealEvidence({paperInspection:'UNAVAILABLE',repositoryInspection:'UNAVAILABLE',paper:[],repository:[]})).toMatchObject({status:'UNKNOWN'});
    expect(reconcileRealEvidence({paperInspection:'INSPECTED',repositoryInspection:'INSPECTED',paper:[],repository:[]})).toMatchObject({status:'NOT_REPORTED'});
  });
});
