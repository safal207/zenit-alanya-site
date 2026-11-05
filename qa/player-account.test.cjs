const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
test('Account CORS stays scoped to the two deployed sites and reflects each request independently',async()=>{
  let handler;
  const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/player-account/index.ts','utf8'));
  vm.runInNewContext(source,{Deno:{env:{get:()=>''},serve:value=>{handler=value;}},Request,Response,Set,TextEncoder,TextDecoder,crypto,
    fetch:()=>{throw Error('These validation requests must not access account data');}});
  const origins=['https://safal207.github.io','https://zenit-alanya-club-concept.safalex.chatgpt.site'];
  const responses=await Promise.all(origins.map(origin=>handler(new Request('https://example.invalid',{method:'OPTIONS',headers:{Origin:origin}}))));
  responses.forEach((response,i)=>{assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origins[i]);assert.equal(response.headers.get('Vary'),'Origin');});
  for(const origin of ['https://unrelated.example','https://zenit-alanya-club-concept.safalex.chatgpt.site.attacker.example']){
    const response=await handler(new Request('https://example.invalid',{method:'OPTIONS',headers:{Origin:origin}}));
    assert.equal(response.status,403);assert.equal(response.headers.has('Access-Control-Allow-Origin'),false);
  }
  const bad=await handler(new Request('https://example.invalid',{method:'POST',headers:{Origin:origins[1],'Content-Type':'application/json'},body:'{}'}));
  assert.equal(bad.status,400);assert.equal((await bad.json()).code,'invalid_input');
});
