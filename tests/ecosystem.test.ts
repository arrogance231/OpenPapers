import { describe, expect, it } from 'vitest';
import { mapGitHubRepository } from '../src/providers/github.js';
import { mapHubItem } from '../src/providers/huggingface.js';

describe('ecosystem provider mapping', () => {
  it('maps GitHub repository metadata with unknown implementation status', () => { const x=mapGitHubRepository({id:1,full_name:'org/repo',name:'repo',owner:{login:'org'},html_url:'https://github.com/org/repo',topics:['distillation'],stargazers_count:4}); expect(x?.fullName).toBe('org/repo'); expect(x?.implementationStatus).toBe('UNKNOWN'); expect(x?.topics).toEqual(['distillation']); });
  it('maps Hugging Face model and preserves revision metadata', () => { const x=mapHubItem({id:'org/model',sha:'abc123',lastModified:'2025-01-01',tags:['llama'],pipeline_tag:'text-generation'},'model'); expect(x).toMatchObject({id:'org/model',kind:'model',sha:'abc123',url:'https://huggingface.co/org/model',pipelineTag:'text-generation'}); });
});
