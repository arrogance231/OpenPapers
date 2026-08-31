import { describe, expect, it } from 'vitest';
import type { GitHubRepository } from '../src/providers/github.js';
import type { ResearchWork } from '../src/models/research.js';
import { assessRepositoryLink } from '../src/research/ecosystem-linking.js';

const repository: GitHubRepository = { id:1, fullName:'alice/distill', name:'distill', owner:'alice', htmlUrl:'https://github.com/alice/distill', topics:[], implementationStatus:'UNKNOWN', source:'github' };
const paper: ResearchWork = { paperId:'p1', title:'Knowledge Distillation', authors:[{name:'Alice Smith',normalizedName:'alice smith'}], year:2024, arxivId:'2006.05525', publicationStatus:'conference', bibtex:'', sourceProviders:['arxiv'], versions:[] };
describe('GitHub repository linkage assessment', () => {
  it('reports strong paper-reference evidence without calling it official', () => {
    const result = assessRepositoryLink(repository, paper, 'Intro\nOur implementation: https://arxiv.org/abs/2006.05525', {blobSha:'blob-1',commitSha:'commit-1',url:'https://github.com/alice/distill/blob/commit-1/README.md'});
    expect(result.level).toBe('PAPER_REFERENCED');
    expect(result.reasons).toContain('README references the paper identifier');
    expect(result.implementationStatus).toBe('UNKNOWN');
    expect(result.source).toEqual({url:'https://github.com/alice/distill/blob/commit-1/README.md',blobSha:'blob-1',commitSha:'commit-1',lineStart:2,lineEnd:2});
  });
  it('reports author overlap as a weaker independent signal', () => {
    const result = assessRepositoryLink(repository, paper, 'Training code for the method.');
    expect(result.level).toBe('AUTHOR_OVERLAP');
    expect(result.reasons).toContain('Repository owner overlaps a paper author name');
  });
});
