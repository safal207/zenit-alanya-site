'use strict';
// Ship the initial feed in HTML so late JavaScript cannot move the first screen.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {films}=require(path.join(root,'dist/assets/club-media.js'));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const categories={training:'Тренировки',team:'Обращения',tournament:'Турниры'};
const cards=films.map((film,index)=>{
  const title=escape(film.title.ru),category=escape(categories[film.category]+(film.duration?' · '+film.duration:''));
  const mark=escape(film.speaker?.ru||(film.category==='team'?'ONE TEAM.':'GAME DAYS.'));
  const label='Смотреть: '+title+' · '+(film.poster?'':mark+' · ')+category;
  const poster=film.poster?`<img src="${escape(film.poster)}" alt="${title}" width="800" height="450" loading="${index===0?'eager':'lazy'}"${index===0?' fetchpriority="high"':''}>`:`<span class="story-type-art">${mark}</span>`;
  return `<article class="story-card"><button type="button" class="story-watch" aria-label="${label}">${poster}<span class="story-play" aria-hidden="true">▶</span><span class="story-category">${category}</span></button><div class="story-body"><h2>${title}</h2><p>${escape(film.description.ru)}</p><button type="button" class="story-save" data-save-film="${film.id}" aria-label="Сохранить: ${title}" aria-pressed="false">♡</button></div></article>`;
}).join('');
const file=path.join(root,'dist/stories.html'),old=fs.readFileSync(file,'utf8');
const expression=/<div class="film-grid" id="film-grid">(?:<!-- initial-feed:start -->[\s\S]*?<!-- initial-feed:end -->)?<\/div>/;
if(!expression.test(old))throw Error('Initial feed marker missing');
const next=old.replace(expression,'<div class="film-grid" id="film-grid"><!-- initial-feed:start -->'+cards+'<!-- initial-feed:end --></div>');
if(process.argv.includes('--check')){if(old!==next)throw Error('Run node qa/build-stories.cjs and commit the generated initial feed');console.log('PASS generated story feed');}else fs.writeFileSync(file,next);
