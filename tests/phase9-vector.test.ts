import { describe, expect, it } from 'vitest';
import { InMemoryVectorRetriever } from '../src/retrieval/vector.js';

describe('vector retrieval interface',()=>{
  it('indexes and deterministically ranks lexical vectors',async()=>{
    const retriever=new InMemoryVectorRetriever();
    await retriever.index([{id:'a',text:'knowledge distillation student teacher',metadata:{paperId:'paper-a'}},{id:'b',text:'image segmentation benchmark',metadata:{paperId:'paper-b'}}]);
    expect(await retriever.search('teacher distillation',5)).toEqual([{id:'a',score:0.7071067811865475,metadata:{paperId:'paper-a'}}]);
  });
  it('replaces records by id and bounds results',async()=>{
    const retriever=new InMemoryVectorRetriever(); await retriever.index([{id:'a',text:'old text'}]); await retriever.index([{id:'a',text:'new retrieval text'},{id:'b',text:'new retrieval text'}]);
    expect((await retriever.search('new',1)).map(item=>item.id)).toEqual(['a']);
  });
});
