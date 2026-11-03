'use strict';
// Bounded source checks. This is not a penetration test or a secrets-management service.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
const files=walk(dist),issues=[];
for(const file of files){
  const rel=path.relative(dist,file).replaceAll('\\','/');
  if(/(^|\/)(\.env|\.git|\.openai|package-lock\.json)(\/|$)/.test(rel))issues.push({file:rel,rule:'private-file-in-artifact'});
  if(!/\.(html|js|css|json)$/.test(file)||rel.includes('/vendor/'))continue;
  const s=fs.readFileSync(file,'utf8');
  for(const [rule,re]of [['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],['unsafe-http',/(?:src|href)=["']http:\/\//i],['dynamic-code',/\b(?:eval|new Function)\s*\(/]])if(re.test(s))issues.push({file:rel,rule});
}
const workflows=walk(path.join(root,'.github/workflows')).filter(p=>/\.ya?ml$/.test(p));
for(const file of workflows){const s=fs.readFileSync(file,'utf8');for(const m of s.matchAll(/uses:\s*([^\s#]+)/g))if(!m[1].startsWith('./')&&!/^[^@]+@[a-f0-9]{40}$/.test(m[1]))issues.push({file:path.relative(root,file),rule:'action-not-commit-pinned',action:m[1]});if(/pull_request_target\s*:/.test(s))issues.push({file:path.relative(root,file),rule:'untrusted-PR-privileged-trigger'});}
const report={status:issues.length?'FAIL':'PASS',checkedFiles:files.length,issues,scope:'Static authored-source and workflow checks; npm audit checks installed dependency advisories separately.'};fs.mkdirSync(path.join(root,'qa/results'),{recursive:true});fs.writeFileSync(path.join(root,'qa/results/security.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));assert.equal(issues.length,0,'Security checks failed');
