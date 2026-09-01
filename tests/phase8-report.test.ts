import { describe, expect, it, vi } from 'vitest';
import { ResearchService } from '../src/research/service.js';

describe('Phase 8 research reports', () => {
  it('builds a mode-labeled report with separate facts and recommendations', async () => {
    const paper = {paperId:'p1',title:'Method Paper',authors:[{name:'A',normalizedName:'a'}],year:2024,publicationStatus:'conference' as const,bibtex:'',sourceProviders:['fixture'],versions:[]};
    const service = new ResearchService(undefined,{search:vi.fn().mockResolvedValue([paper])} as any,{search:vi.fn().mockResolvedValue([])} as any,{search:vi.fn().mockResolvedValue([])} as any,{search:vi.fn().mockResolvedValue([])} as any);
    const report = await service.buildResearchReport('distillation','implementation',5);
    expect(report.data.mode).toBe('implementation');
    expect(report.data.facts[0]).toContain('Method Paper');
    expect(report.data.recommendations[0]).toContain('implementation');
    expect(report.data.timeline).toEqual([{paperId:'p1',year:2024,title:'Method Paper'}]);
  });
});
