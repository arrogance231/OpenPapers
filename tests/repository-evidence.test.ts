import { describe, expect, it } from 'vitest';
import type { GitHubRepository } from '../src/providers/github.js';
import type { ResearchWork } from '../src/models/research.js';
import { assessRepositoryLink, repositoryLinkEvidence } from '../src/research/ecosystem-linking.js';

const repository: GitHubRepository = { id:1, fullName:'alice/distill', name:'distill', owner:'alice', htmlUrl:'https://github.com/alice/distill', topics:[], implementationStatus:'UNKNOWN', source:'github' };
const paper: ResearchWork = { paperId:'p1', title:'Knowledge Distillation', authors:[{name:'Alice Smith',normalizedName:'alice smith'}], year:2024, arxivId:'2006.05525', publicationStatus:'conference', bibtex:'', sourceProviders:['arxiv'], versions:[] };
describe('GitHub repository evidence', () => {
  it('maps a README assessment into formal evidence with its locator', () => {
    const assessment = assessRepositoryLink(repository, paper, 'Intro\nOur implementation: https://arxiv.org/abs/2006.05525', {blobSha:'blob-1',commitSha:'commit-1',url:'https://github.com/alice/distill/blob/commit-1/README.md'});
    const evidence = repositoryLinkEvidence(repository, paper, assessment);
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({sourceId:'https://github.com/alice/distill', evidenceType:'SECONDARY_SOURCE', sourceQuality:'D', locator:{repositoryPath:'README.md',repositoryLineStart:2,repositoryLineEnd:2,commitSha:'commit-1'}});
  });
});
