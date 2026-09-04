import { describe, expect, it } from 'vitest';
import {
  selectRepositoryCandidates,
  extractRepositoryEvidence,
  reconcileEvidence,
  classifyTemporalAlignment,
  assembleStructuredAnswer,
  PinnedRepositoryReader,
} from '../src/research/real-pipeline.js';

describe('real-source research pipeline primitives', () => {
  it('selects bounded explainable research files and excludes generated content', () => {
    const entries = [
      'README.md', 'src/train.py', 'configs/training.yaml', 'vendor/torch.py',
      'checkpoints/model.bin', 'data/train.jsonl', 'scripts/launch.sh', 'dist/app.js',
    ].map(path => ({ path, name: path.split('/').at(-1)!, type: 'file', sha: `sha-${path}` }));
    expect(selectRepositoryCandidates(entries)).toEqual([
      { path: 'README.md', reason: 'README' },
      { path: 'configs/training.yaml', reason: 'configuration' },
      { path: 'scripts/launch.sh', reason: 'launch script' },
      { path: 'src/train.py', reason: 'training source' },
    ]);
  });

  it('extracts exact pinned file lines with source class and normalized parameter', () => {
    const result = extractRepositoryEvidence({
      owner: 'alice', repo: 'paper', commitSha: 'a'.repeat(40), path: 'configs/train.yaml',
      content: '# config\nlearning_rate: 2e-5\nbatch_size: 128\n',
    });
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ parameter: 'learning_rate', rawValue: '2e-5', normalizedValue: 0.00002, sourceClass: 'CONFIG', locator: { path: 'configs/train.yaml', startLine: 2, endLine: 2, commitSha: 'a'.repeat(40) } }),
      expect.objectContaining({ parameter: 'batch_size', rawValue: '128', normalizedValue: 128 }),
    ]));
  });

  it('does not turn provider or parser failure into absence', () => {
    expect(reconcileEvidence({ paper: undefined, repository: undefined, paperInspection: 'UNAVAILABLE', repositoryInspection: 'UNAVAILABLE' })).toMatchObject({ status: 'UNKNOWN' });
    expect(reconcileEvidence({ paper: [], repository: [], paperInspection: 'INSPECTED', repositoryInspection: 'INSPECTED' })).toMatchObject({ status: 'NOT_REPORTED' });
  });

  it('requires conservative temporal evidence', () => {
    expect(classifyTemporalAlignment('2024-01-01', '2024-01-02')).toMatchObject({ status: 'LIKELY_ALIGNED' });
    expect(classifyTemporalAlignment('2024-01-01', '2025-01-01')).toMatchObject({ status: 'POST_PUBLICATION' });
    expect(classifyTemporalAlignment(undefined, '2024-01-01').status).toBe('UNKNOWN');
  });

  it('reads only files selected from the pinned revision and emits a manifest', async () => {
    const sha='c'.repeat(40);
    const github={
      listContents: async () => [{path:'README.md',name:'README.md',type:'file',sha:'blob-readme'},{path:'train.py',name:'train.py',type:'file',sha:'blob-train'},{path:'latest.py',name:'latest.py',type:'file',sha:'blob-latest'}],
      getContent: async (_owner:string,_repo:string,path:string,ref?:string) => ({path,sha:path==='train.py'?'blob-train':'blob-readme',encoding:'base64',content:Buffer.from(path==='train.py'?'optimizer = AdamW\\n':'No parameters here').toString('base64'),repository:'alice/paper',commitSha:ref}),
    };
    const result=await new PinnedRepositoryReader(github).read('alice','paper',sha);
    expect(result.evidence[0]).toMatchObject({parameter:'optimizer',locator:{commitSha:sha,path:'train.py'}});
    expect(result.manifest).toEqual(expect.arrayContaining([expect.objectContaining({commitSha:sha,path:'train.py',contentSha:'blob-train'})]));
    expect(result.failures).toEqual([]);
  });

  it('assembles only evidence-backed answers', () => {
    const evidence = extractRepositoryEvidence({ owner:'alice', repo:'paper', commitSha:'b'.repeat(40), path:'train.py', content:'optimizer = AdamW\n' });
    const answer = assembleStructuredAnswer('optimizer', evidence, []);
    expect(answer.status).toBe('SUPPORTED');
    expect(answer.answer).toBe('AdamW');
    expect(answer.evidence[0]).toMatchObject({ locator: { path: 'train.py', startLine: 1, endLine: 1, commitSha:'b'.repeat(40) } });
  });
});
