import { performance } from 'node:perf_hooks';

const endpoint=process.env.MCP_ENDPOINT??'http://127.0.0.1:8787/mcp';
const repetitions=Math.max(1,Math.min(100,Number(process.env.MCP_BENCHMARK_RUNS??10)));
async function call(method,params,id){const start=performance.now(); const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','accept':'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id,method,params})}); await response.text(); return {status:response.status,ms:performance.now()-start};}
function summarize(name,values){const times=values.map(value=>value.ms).sort((a,b)=>a-b); const at=(p)=>times[Math.min(times.length-1,Math.max(0,Math.ceil(times.length*p)-1))]; return {name,requests:values.length,statuses:[...new Set(values.map(value=>value.status))],min_ms:Number(times[0].toFixed(2)),median_ms:Number(at(.5).toFixed(2)),p95_ms:Number(at(.95).toFixed(2)),max_ms:Number(times.at(-1).toFixed(2))};}
const operations=[['initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'openpapers-benchmark',version:'1.0'}}],['tools/list',{}],['tools/call',{name:'list_collections',arguments:{}}]];
for(const [method,params] of operations){const values=[]; for(let i=0;i<repetitions;i++) values.push(await call(method,params,i+1)); console.log(JSON.stringify(summarize(method,values)));}
