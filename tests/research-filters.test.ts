import { describe, expect, it } from 'vitest';
import { ResearchService } from '../src/research/service.js';
import type { ResearchWork } from '../src/models/research.js';

const work=(title:string,year:number,author:string,venue:string,topics:string[]):ResearchWork=>({paperId:title,title,year,authors:[{name:author,normalizedName:author.toLowerCase()}],venue,topics,publicationStatus:'unknown',bibtex:'',sourceProviders:['fixture'],versions:[]});
describe('research filters',()=>{ it('filters by year, author, venue, and topic',async()=>{ const db={upsertWork:()=>{},search:()=>[],getWork:()=>undefined} as any; const fake={search:async()=>[work('Keep',2024,'Ada Lovelace','ML Journal',['distillation']),work('Drop',2020,'Bob Jones','Other',['vision'])]} as any; const service=new ResearchService(db,fake,fake,fake,fake); const result=await service.search('paper',10,{yearFrom:2023,yearTo:2025,author:'ada',venue:'ml journal',topic:'distill'}); expect(result.data.map(x=>x.title)).toEqual(['Keep']); }); });
