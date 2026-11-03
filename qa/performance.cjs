'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createServer}=require('./serve.cjs');
(async()=>{
  const lighthouse=(await import('lighthouse')).default,chromeLauncher=await import('chrome-launcher');
  const output=path.resolve(__dirname,'results/lighthouse');fs.mkdirSync(output,{recursive:true});
  const profile=process.env.PERF_PROFILE||'mobile';if(!['mobile','desktop'].includes(profile))throw Error('Unknown profile');
  const server=createServer();await new Promise(r=>server.listen(4174,'127.0.0.1',r));
  const chrome=await chromeLauncher.launch({chromePath:process.env.CHROME_PATH,chromeFlags:['--headless','--no-sandbox','--disable-dev-shm-usage']});
  const rows=[];
  try{for(const route of ['','stories.html','journey.html']){
    const runs=[];for(let run=0;run<3;run++){
      const flags={port:chrome.port,output:['html','json'],logLevel:'error',onlyCategories:['performance','accessibility','best-practices'],formFactor:profile,screenEmulation:profile==='mobile'?{mobile:true,width:390,height:844,deviceScaleFactor:1,disabled:false}:{mobile:false,width:1350,height:940,deviceScaleFactor:1,disabled:false},throttlingMethod:'simulate',throttling:profile==='mobile'?{rttMs:150,throughputKbps:1638.4,cpuSlowdownMultiplier:4}:{rttMs:40,throughputKbps:10240,cpuSlowdownMultiplier:1}};
      const result=await lighthouse('http://127.0.0.1:4174/zenit-alanya-site/'+route,flags);if(result.lhr.runtimeError)throw Error(JSON.stringify(result.lhr.runtimeError));
      const name=profile+'-'+(route.replace('.html','')||'home')+'-'+run;fs.writeFileSync(path.join(output,name+'.html'),result.report[0]);fs.writeFileSync(path.join(output,name+'.json'),result.report[1]);
      const a=result.lhr.audits;if(run===0)console.log(JSON.stringify({route,diagnostics:Object.fromEntries(Object.entries(a).filter(([key,value])=>value.score!==null&&value.score<1&&['render-blocking-insight','font-display-insight','lcp-breakdown-insight','lcp-discovery-insight','cls-culprits-insight','network-dependency-tree-insight','layout-shifts','largest-contentful-paint-element','render-blocking-resources','uses-text-compression'].includes(key)).map(([key,value])=>[key,{title:value.title,displayValue:value.displayValue,details:value.details}]))}));runs.push({performance:result.lhr.categories.performance.score,accessibility:result.lhr.categories.accessibility.score,bestPractices:result.lhr.categories['best-practices'].score,lcp:a['largest-contentful-paint'].numericValue,cls:a['cumulative-layout-shift'].numericValue,tbt:a['total-blocking-time'].numericValue});
    }
    const median=key=>runs.map(x=>x[key]).sort((a,b)=>a-b)[1];const row={route:route||'/',profile,runs,median:Object.fromEntries(Object.keys(runs[0]).map(k=>[k,median(k)]))};
    const m=row.median;row.pass=m.performance>=(profile==='mobile'?.8:.9)&&m.lcp<=(profile==='mobile'?4000:2500)&&m.cls<=.1&&m.tbt<=300&&m.accessibility>=.95&&m.bestPractices>=.9;rows.push(row);console.log(JSON.stringify(row));
  }}finally{await chrome.kill();await new Promise(r=>server.close(r));}
  fs.writeFileSync(path.join(output,'summary-'+profile+'.json'),JSON.stringify({profile,status:rows.every(r=>r.pass)?'PASS':'FAIL',rows,note:'Three-run medians on a CI machine with simulated throttling; not field Core Web Vitals or physical-device measurements.'},null,2));if(rows.some(r=>!r.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
