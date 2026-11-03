'use strict';
// Preserve stylesheet order while avoiding several blocking network round trips.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist/assets');
const groups={
  'home.bundle.css':['fonts.css','style.css','academy.css','films.css','funnel.css','minimal.css','journey.css','theme.css'],
  'stories.bundle.css':['fonts.css','films.css','theme.css'],
  'journey.bundle.css':['fonts.css','journey.css','theme.css']
};
for(const [name,files] of Object.entries(groups)){
  const text=files.map(file=>'/* '+file+' */\n'+fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n').trim()).join('\n')+'\n';
  const target=path.join(root,name);
  if(process.argv.includes('--check')){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==text)throw Error('Run node qa/build-css.cjs and commit '+name);}else fs.writeFileSync(target,text);
}
console.log('PASS generated CSS bundles');
