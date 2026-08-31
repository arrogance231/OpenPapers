import { describe, expect, it } from 'vitest';
import type { GitHubRepository } from '../src/providers/github.js';
import type { ResearchWork } from '../src/models/research.js';
import { classifyRepositoryAttribution } from '../src/research/ecosystem-linking.js';

const repo: GitHubRepository = { id:1, fullName:'alice/distill', name:'distill', owner:'alice', htmlUrl:'https://github.com/alice/distill', topics:[], implementationStatus:'UNKNOWN', source:'github' };
const paper: ResearchWork = { paperId:'p1', title:'Knowledge Distillation', authors:[{name:'Alice Smith',normalizedName:'alice smith'}], year:2024, arxivId:'2006.05525', publicationStatus:'conference', bibtex:'', sourceProviders:['arxiv'], versions:[] };

describe('GitHub attribution classification', () => {
  it('requires explicit README language and paper reference for official status', () => {
    expect(classifyRepositoryAttribution(repo, paper, 'Official implementation of https://arxiv.org/abs/2006.05525').status).toBe('OFFICIAL');
    expect(classifyRepositoryAttribution(repo, paper, 'Official implementation of an unrelated method').status).toBe('UNKNOWN');
  });
  it('classifies author overlap and explicit community reproduction conservatively', () => {
    expect(classifyRepositoryAttribution(repo, paper, 'Training code for the method.').status).toBe('AUTHOR_MAINTAINED');
    expect(classifyRepositoryAttribution({...repo, owner:'bob'}, paper, 'Community reimplementation of the paper.').status).toBe('COMMUNITY_REPRODUCTION');
  });
  it('returns UNKNOWN for conflicting official and community claims', () => {
    const result = classifyRepositoryAttribution(repo, paper, 'Official implementation and community reimplementation of https://arxiv.org/abs/2006.05525');
    expect(result.status).toBe('UNKNOWN');
    expect(result.reason).toContain('conflicting');
  });
});
