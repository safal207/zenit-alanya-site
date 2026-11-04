#!/usr/bin/env node
// Portable release gate: no registry install, browser emulation or deployment credentials.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');process.chdir(root);
const output=path.join(root,'qa/results');fs.mkdirSync(output,{recursive:true});
const source=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name).split(path.sep).join('/')]).sort();}
function manifest(){return walk('dist').filter(f=>!path.basename(f).startsWith('__qa')).map(f=>({path:f,bytes:fs.statSync(f).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')}));}
const initial=manifest(),stages=[];
function run(name,argv,timeout=45000){const started=Date.now(),r=cp.spawnSync(argv[0],argv.slice(1),{encoding:'utf8',timeout,maxBuffer:8*1024*1024});const log=(r.stdout||'')+(r.stderr||'')+(r.error?'\n'+r.error.message:'');fs.writeFileSync(path.join(output,name+'.log'),log);const item={name,status:r.status===0?'PASS':'FAIL',duration_ms:Date.now()-started,exit_code:r.status,log:'qa/results/'+name+'.log'};stages.push(item);console.log(item.status+' '+name);return item.status==='PASS';}
const authored=walk('dist/assets').filter(f=>f.endsWith('.js')&&!f.includes('/vendor/'));
run('syntax',[process.execPath,'-e',`const cp=require('node:child_process'),fs=require('node:fs');for(const f of ${JSON.stringify(authored)}){const args=f.includes('/chess-')?['--input-type=module','--check']:['--check'];const r=cp.spawnSync(process.execPath,args,{input:fs.readFileSync(f),encoding:'utf8'});if(r.status){console.error(f,r.stderr);process.exit(1)}}cp.execFileSync(process.execPath,['qa/build-stories.cjs','--check'],{stdio:'inherit'});cp.execFileSync(process.execPath,['qa/build-css.cjs','--check'],{stdio:'inherit'});cp.execFileSync(process.execPath,['qa/build-theme-head.cjs','--check'],{stdio:'inherit'});console.log('Syntax checked: '+${authored.length});`]);
run('contracts',[process.execPath,'--test','--test-reporter=tap','qa/contracts.test.cjs']);
run('stockfish',[process.execPath,'qa/stockfish-smoke.cjs']);
// Babylon's official UMD loader resolves this package name in Node. Runtime uses local script tags.
const alias=path.join(root,'node_modules/babylonjs');fs.mkdirSync(alias,{recursive:true});fs.writeFileSync(path.join(alias,'package.json'),JSON.stringify({name:'babylonjs',version:'9.32.1',main:'../../dist/assets/vendor/babylon.js'}));
run('football',[process.execPath,'qa/football-engine.cjs']);
run('static-security-budgets',[process.env.PYTHON||(process.platform==='win32'?'python':'python3'),'qa/static-check.py']);
const final=manifest();const immutable=JSON.stringify(initial)===JSON.stringify(final);stages.push({name:'artifact-integrity',status:immutable?'PASS':'FAIL'});
const passed=stages.every(s=>s.status==='PASS');
const report={schema_version:1,generated_at:new Date().toISOString(),timezone:'Europe/Istanbul',source_base_commit:source,artifact_digest:crypto.createHash('sha256').update(JSON.stringify(final)).digest('hex'),status:passed?'PASS':'FAIL',stages,manifest:final,manual_gates:['Browser form/keyboard/mobile/media checks are recorded separately in docs/audit/browser-evidence.json.','Chromium software rendering is checked separately in browser CI; real Android/iOS and hardware FPS still require devices.','Run this gate before the native Sites source packaging and private deployment.'],remote_ci_status:process.env.GITHUB_ACTIONS==='true'?'GitHub Actions: '+process.env.GITHUB_SERVER_URL+'/'+process.env.GITHUB_REPOSITORY+'/actions/runs/'+process.env.GITHUB_RUN_ID:'Local core suite; consult the exact GitHub Actions run for browser and performance results.'};
fs.writeFileSync(path.join(output,'latest.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(output,'junit.xml'),'<?xml version="1.0"?><testsuite name="Zenit release pipeline" tests="'+stages.length+'" failures="'+stages.filter(s=>s.status==='FAIL').length+'">'+stages.map(s=>'<testcase name="'+s.name+'">'+(s.status==='FAIL'?'<failure message="See stage log"/>':'')+'</testcase>').join('')+'</testsuite>');
console.log(report.status+' release gate · '+report.artifact_digest.slice(0,16));process.exitCode=passed?0:1;
