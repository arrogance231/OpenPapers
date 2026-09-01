import type { Evidence, ResearchWork } from '../models/research.js';

export interface ResearchPack {
  format:'openpapers.research-pack.v1';
  collection:{id:string;name:string};
  papers:ResearchWork[];
  evidence:Array<{paperId:string;evidence:Evidence}>;
}
