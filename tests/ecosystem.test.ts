import { describe, expect, it } from 'vitest';
import { decodeGitHubContent, GitHubProvider, mapGitHubRepository } from '../src/providers/github.js';
import { HuggingFaceProvider, mapHubItem } from '../src/providers/huggingface.js';

describe('ecosystem provider mapping', () => {
  it('maps GitHub repository metadata with unknown implementation status', () => {
    const x = mapGitHubRepository({ id: 1, full_name: 'org/repo', name: 'repo', owner: { login: 'org' }, html_url: 'https://github.com/org/repo', topics: ['distillation'], stargazers_count: 4 });
    expect(x?.fullName).toBe('org/repo');
    expect(x?.implementationStatus).toBe('UNKNOWN');
    expect(x?.topics).toEqual(['distillation']);
  });
  it('decodes static GitHub content without executing it', () => {
    const content = Buffer.from('learning_rate: 0.00002\n').toString('base64');
    expect(decodeGitHubContent({ path: 'config.yaml', sha: 'blob', content, encoding: 'base64', repository: 'org/repo', source: 'github' })).toBe('learning_rate: 0.00002\n');
  });
  it('maps Hugging Face model and preserves revision metadata', () => {
    const x = mapHubItem({ id: 'org/model', sha: 'abc123', lastModified: '2025-01-01', tags: ['llama'], pipeline_tag: 'text-generation' }, 'model');
    expect(x).toMatchObject({ id: 'org/model', kind: 'model', sha: 'abc123', url: 'https://huggingface.co/org/model', pipelineTag: 'text-generation' });
  });
  it('rejects malformed successful GitHub and Hugging Face envelopes', async () => {
    await expect(new GitHubProvider(async () => new Response('{}')).searchRepositories('repo')).rejects.toThrow(/invalid GitHub response/);
    await expect(new HuggingFaceProvider(async () => new Response('{}')).searchModels('model')).rejects.toThrow(/invalid Hugging Face response/);
  });
});
