import { describe, expect, it } from 'vitest';
import { extractTrainingParameters } from '../src/extraction/parameters.js';
import type { ParsedDocument } from '../src/ingestion/document.js';

describe('explicit training parameter extraction', () => {
  it('extracts labeled values with provenance', () => {
    const document: ParsedDocument = {format:'html',url:'https://example.com/paper',sections:[{level:1,heading:'Training Details',text:'We use AdamW with learning rate 2e-5, batch size 32, and train for 3 epochs.',page:8,pageId:'p8'}],references:[],warnings:[]};
    expect(extractTrainingParameters(document)).toEqual(expect.arrayContaining([
      expect.objectContaining({name:'learning_rate',value:'2e-5',locator:{section:'Training Details',page:8,pageId:'p8'}}),
      expect.objectContaining({name:'batch_size',value:'32'}),
      expect.objectContaining({name:'epochs',value:'3'}),
      expect.objectContaining({name:'optimizer',value:'AdamW'}),
    ]));
  });
  it('does not extract unlabeled guesses', () => {
    const document: ParsedDocument = {format:'html',url:'https://example.com/paper',sections:[{level:1,heading:'Results',text:'The model achieved 91% accuracy after training.'}],references:[],warnings:[]};
    expect(extractTrainingParameters(document)).toEqual([]);
  });
});
