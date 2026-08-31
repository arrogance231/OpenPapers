import { describe, expect, it } from 'vitest';
import type { GitHubRepository } from '../src/providers/github.js';
import type { ResearchWork } from '../src/models/research.js';
import { assessRepositoryLink } from '../src/research/ecosystem-linking.js';

const repository: GitHubRepository = { id:1, fullName:'alice/distill', name:'distill', owner:'alice', htmlUrl:'https://github.com/alice/distill', topics:[], implementationStatus:'UNKNOWN', source:'github' };
const paper: ResearchWork = { paperId:'p1', title:'Knowledge Distillation', authors:[{name:'Alice Smith',normalizedName:'alice smith'}], year:2024, arxivId:'2006.05525', publicationStatus:'conference', bibtex:'', sourceProviders:['arxiv'], versions:[] };
describe('GitHub repository linkage assessment', () => {
  it('reports strong paper-reference evidence without calling it official', () => {
    const result = assessRepositoryLink(repository, paper, 'Our implementation: https://arxiv.org/abs/2006.05525');
    expect(result.level).toBe('PAPER_REFERENCED');
    expect(result.reasons).toContain('README references the paper identifier');
    expect(result.implementationStatus).toBe('UNKNOWN');
  });
  it('reports author overlap as a weaker independent signal', () => {
    const result = assessRepositoryLink(repository, paper, 'Training code for the method.');
    expect(result.level).toBe('AUTHOR_OVERLAP');
    expect(result.reasons).toContain('Repository owner overlaps a paper author name');
  });
});
