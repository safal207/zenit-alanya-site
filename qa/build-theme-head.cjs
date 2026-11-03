'use strict';
// Paint the preference without a blocking network request; defer all controls.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const init="(()=>{let t;try{t=localStorage.getItem('zenit-theme-v1')}catch{}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t})();";
for(const name of ['index.html','stories.html','journey.html','play/chess.html','play/football.html']){
 const file=path.join(root,name),old=fs.readFileSync(file,'utf8');
 const expression=/(?:<!-- theme-init:start -->[\s\S]*?<!-- theme-init:end -->)?<script src="((?:\.\.\/)?assets\/theme.js)"(?: defer)?><\/script>/;
 if(!expression.test(old))throw Error('Theme script missing from '+name);
 const next=old.replace(expression,(_,src)=>'<!-- theme-init:start --><script>'+init+'</script><!-- theme-init:end --><script src="'+src+'" defer></script>');
 if(process.argv.includes('--check')){if(next!==old)throw Error('Run node qa/build-theme-head.cjs and commit '+name);}else fs.writeFileSync(file,next);
}
console.log('PASS generated non-blocking theme bootstrap');
