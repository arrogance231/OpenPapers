const endpoint=process.env.MCP_ENDPOINT??'http://127.0.0.1:8787/mcp';
let nextId=1;
async function call(method,params){
  const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','accept':'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:nextId++,method,params})});
  const text=await response.text();
  const line=text.split('\n').find(item=>item.startsWith('data: '));
  if(!line) throw new Error(`MCP ${method} returned no event data`);
  const payload=JSON.parse(line.slice(6));
  if(payload.error) throw new Error(`MCP ${method}: ${payload.error.message}`);
  return payload.result;
}
function fail(message){console.error(`ADVERSARIAL_SMOKE_FAILED: ${message}`);process.exitCode=1;}
const initialized=await call('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'openpapers-adversarial-smoke',version:'1.0'}});
if(!initialized?.protocolVersion) fail('initialize did not return protocolVersion');
const inventory=await call('tools/list',{});
const tools=inventory?.tools??[];
if(tools.length<30) fail(`unexpected tool inventory size: ${tools.length}`);
const search=await call('tools/call',{name:'search_papers',arguments:{query:'Attention Is All You Need',limit:10}});
const searchData=search?.structuredContent;
const results=searchData?.data??[];
const evidence=searchData?.evidence??[];
const transparency=searchData?.transparency;
if(!Array.isArray(results)||!Array.isArray(evidence)||!transparency) fail('search response missing data/evidence/transparency');
const canonical=results.find(paper=>paper.arxivId==='1706.03762');
if(canonical){
  const lookup=await call('tools/call',{name:'get_paper',arguments:{paper_id:canonical.paperId}});
  if(lookup?.isError) fail('get_paper rejected canonical search result');
  const lookupData=lookup?.structuredContent;
  const lookupEvidence=lookupData?.evidence?.[0];
  if(lookupData?.data?.paperId!==canonical.paperId||lookupEvidence?.sourceId!==canonical.paperId) fail('lookup provenance does not resolve to returned paper');
} else {
  const identifierSearch=await call('tools/call',{name:'search_papers',arguments:{query:'1706.03762',limit:50}});
  if(!(identifierSearch?.structuredContent?.data??[]).some(paper=>paper.arxivId==='1706.03762')) fail('canonical arXiv record absent from title and identifier searches');
}
const summary={tools:tools.length,search_results:results.length,evidence_records:evidence.length,canonical_found_in_title_search:Boolean(canonical),provider_failures:(transparency?.providerFailures??[]).map(String),sources_searched:transparency?.sourcesSearched??[]};
console.log(JSON.stringify(summary));
