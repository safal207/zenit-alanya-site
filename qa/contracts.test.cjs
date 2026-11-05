const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const C=require('../dist/assets/calendar-core.js');
const I=require('../dist/assets/inquiry-core.js');
const P=require('../dist/assets/player-path.js');
test('Player pathway: empty and damaged plans remain empty without granting a stage',()=>{
  for(const value of [null, [], 'academy', {stage:'__proto__',target:'unknown',review:'2026-02-30',actions:['approved']}]){
    assert.equal(P.hasContent(value),false);
    assert.equal(P.normalize(value).stage,'');
  }
});
test('Player pathway: a private plan round-trips its goal, destination, reflection and unique preparation steps',()=>{
  const value={stage:'trial',target:'benfica',review:'2026-12-12',practice:'  Пас под давлением  ',reflection:'Спросить тренера',actions:['coach','video','video']};
  const saved=P.normalize(value);
  assert.equal(saved.practice,'Пас под давлением');assert.deepEqual(saved.actions,['video','coach']);
  assert.deepEqual(P.normalize(JSON.parse(JSON.stringify(saved))),saved);assert.equal(P.hasContent(saved),true);
});
test('Player pathway: dates, payload size and unsupported authority claims are bounded',()=>{
  assert.equal(P.normalize({review:'2024-02-29'}).review,'2024-02-29');
  for(const review of ['2026-02-29','2026-04-31','x',{},null])assert.equal(P.normalize({review}).review,'');
  const value=P.normalize({practice:'x'.repeat(1000),reflection:'y'.repeat(1000),coach_approved:true,stage:'adult'});
  assert.equal(value.practice.length,240);assert.equal(value.reflection.length,240);assert.equal('coach_approved' in value,false);
});
test('Player pathway: all displayed labels and seven stages have RU, TR and EN content',()=>{
  const html=fs.readFileSync('dist/player.html','utf8');
  const keys=[...html.matchAll(/data-path-(?:copy|placeholder)="([^"]+)"/g)].map(m=>m[1]);
  for(const lang of ['ru','tr','en']){
    for(const key of keys)assert.equal(typeof P.locales[lang][key],'string',lang+': '+key);
    assert.equal(P.locales[lang].steps.length,7);
    assert.ok(P.locales[lang].steps.every(s=>s.length===4&&s.every(v=>typeof v==='string'&&v.length)));
  }
});
const inquiryBase={age:'7',experience:'beginner',area:'',language:'ru',topic:'training'};
test('Enquiry: missing, fractional, non-finite and out-of-range ages cannot advance',()=>{
  for(const age of ['',null,'0','19','7.5','Infinity','NaN','1e1','seven'])assert.equal(I.normalize({...inquiryBase,age}).error,'age');
  for(const age of ['1','7','18'])assert.equal(I.normalize({...inquiryBase,age}).age,Number(age));
});
test('Enquiry: experience must be chosen and uncontrolled categories cannot become text keys',()=>{
  for(const experience of ['',null,'unknown','__proto__'])assert.equal(I.normalize({...inquiryBase,experience}).error,'experience');
  const value=I.normalize({...inquiryBase,goal:'__proto__',topic:'unknown',language:'unknown',area:' A '.repeat(100)});
  assert.equal(value.goal,null);assert.equal(value.topic,'training');assert.equal(value.language,'ru');assert.equal(value.area.length,80);
});
test('Enquiry: all three locales produce complete drafts for each parent route and topic',()=>{
  const source=fs.readFileSync('dist/assets/app.js','utf8');
  const translations=vm.runInNewContext(source.slice(0,source.indexOf('let lang='))+';copy');
  for(const t of Object.values(translations))for(const goal of ['new','start','grow'])for(const topic of ['training','kit','trip']){
    const result=I.buildMessage({...inquiryBase,goal,topic,area:'Oba',experience:goal==='grow'?'regular':'beginner'},t);
    assert.ok(result.text.includes(t['goalMessage_'+goal]));assert.ok(result.text.includes(t.questions[topic]));
    assert.ok(result.text.includes('Oba'));assert.ok(!result.text.includes('undefined'));
  }
});
test('Enquiry: editing a draft uses current values without mutating answers',()=>{
  const source=fs.readFileSync('dist/assets/app.js','utf8');
  const t=vm.runInNewContext(source.slice(0,source.indexOf('let lang='))+';copy.en');
  const input={...inquiryBase},before=JSON.stringify(input);
  const first=I.buildMessage(input,t).text;input.age='12';input.experience='regular';
  const second=I.buildMessage(input,t).text;
  assert.ok(first.includes('7'));assert.ok(second.includes('12'));assert.ok(second.includes(t.regular));
  assert.equal(JSON.stringify(inquiryBase),before);assert.ok(!second.includes(t.beginner));
  assert.equal(I.buildMessage({...input,age:'0'},t).error,'age');
  assert.equal(I.effectiveGoal('start','regular'),null);assert.equal(I.effectiveGoal('grow','beginner'),null);
  assert.equal(I.effectiveGoal('new','regular'),'new');
});
test('Coach cards keep the named person, original portrait and source together',()=>{
  const crypto=require('node:crypto'),html=fs.readFileSync('dist/index.html','utf8');
  const checks=[
    ['Таисия Кирилловна Зиновьева','coach-zinovyeva.jpg','DLFBqE2qP-5','75ce02ef1e0236e596324c3bf085a7a2bdc2e8937de1735d87da12dc4793323b'],
    ['Андрей Архипенко','coach-arkhipenko.jpg','DDNlByTMCPB','28e6a44004620eb538528c4969e44d3c0ac1670fedf7edfda1761da87fb3122e']
  ];
  const cards=[...html.matchAll(/<article class="coach-card">([\s\S]*?)<\/article>/g)].map(x=>x[1]);
  assert.equal(cards.length,2);
  for(const [name,file,source,sha] of checks){
    const card=cards.find(s=>s.includes(name));assert.ok(card,name);
    assert.ok(card.includes('<img src="assets/'+file+'"')&&card.includes(source),name+' original portrait and source');
    assert.ok(!card.includes('-ai.webp'),name+' coach portrait must be the original');
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync('dist/assets/'+file)).digest('hex'),sha);
  }
  assert.match(html,/<figure class="young-play">[\s\S]*?young-play-ai\.webp[\s\S]*?Иллюстрация, созданная ИИ[\s\S]*?<\/figure>/);
  for(const scene of ['older-play-ai.webp','goalkeeper-training-ai.webp','before-training-ai.webp']){const figure=[...html.matchAll(/<figure class="young-play gallery-secondary">([\s\S]*?)<\/figure>/g)].find(x=>x[1].includes(scene));assert.ok(figure&&figure[1].includes('Иллюстрация, созданная ИИ'),scene+' is visibly disclosed as AI');}
});
const F=require('../dist/assets/football-core.js'),M=require('../dist/assets/club-media.js');
test('Football: screen-up follows camera toward the pitch',()=>{const v=F.inputVector(0,1,{x:23,z:-27},{x:0,z:0});assert.ok(v.x<0&&v.z>0);assert.ok(Math.abs(Math.hypot(v.x,v.z)-1)<1e-9);});
test('Football: diagonal movement never gives a speed advantage',()=>{const cam={x:0,z:-10},target={x:0,z:0};assert.equal(Math.hypot(...Object.values(F.inputVector(1,0,cam,target))),1);assert.ok(Math.abs(Math.hypot(...Object.values(F.inputVector(1,1,cam,target)))-1)<1e-9);});
test('Football: analog movement preserves gentle joystick input',()=>{const v=F.inputVector(.25,0,{x:0,z:-10},{x:0,z:0});assert.equal(v.x,.25);assert.equal(Math.abs(v.z),0);assert.deepEqual(F.inputVector(.01,.01,{x:0,z:-10},{x:0,z:0}),{x:0,z:0});});
test('Football: opponent shoots only in the attacking half',()=>{assert.equal(F.canShoot(20,-1,2),false);assert.equal(F.canShoot(-20,-1,2),true);assert.equal(F.canShoot(20,1,2),true);assert.equal(F.canShoot(20,1,.5),false);});
test('Football: blocked passing lane changes recipient ranking',()=>{const origin={x:0,z:0},near={x:0,z:10},wide={x:9,z:10},rivals=[{x:0,z:5}];assert.ok(F.passScore(origin,near,[],1)<F.passScore(origin,wide,[],1));assert.ok(F.passScore(origin,near,rivals,1)>F.passScore(origin,wide,rivals,1));});
test('Media: every story has an official matching source and all languages',()=>{assert.equal(new Set(M.films.map(f=>f.id)).size,5);for(const f of M.films){assert.equal(new URL(f.embed).hostname,'www.instagram.com');assert.ok(new URL(f.original).pathname.startsWith('/zenitalanya/'));assert.equal(new URL(f.embed).pathname.split('/')[2],new URL(f.original).pathname.split('/')[3]);for(const lang of ['ru','tr','en'])assert.ok(f.title[lang]&&f.description[lang]);if(f.poster)assert.ok(fs.existsSync('dist/'+f.poster));}});
test('Media: supplied background keeps provenance distinct from official training stories',()=>{
  const crypto=require('node:crypto'),provenance=JSON.parse(fs.readFileSync('docs/hero-background.json','utf8'));
  assert.equal(M.hero.filmId,null);assert.equal(M.hero.status,'user_supplied_background');
  assert.equal('dist/'+M.hero.file,provenance.deployed_file);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(provenance.deployed_file)).digest('hex'),provenance.source_sha256);
  assert.ok(fs.existsSync('dist/'+M.hero.poster));
  assert.equal(M.films.find(f=>f.id==='sand').file,undefined);
});
const base={id:'qa-1',date:'2026-10-30',time:'18:30',title:'Тренировка',duration:60,place:'Обa',confirmed:false};
const labels={planPrefix:'[Личный план] ',eventNote:'Запись родителя, а не бронирование.'};
test('Calendar: rejects impossible dates, supports leap day',()=>{assert.equal(C.validDate('2026-02-29'),false);assert.equal(C.validDate('2024-02-29'),true);for(const date of ['2026-99-10','2026-04-31','1999-12-31','2101-01-01','x'])assert.equal(C.validDate(date),false);});
test('Calendar: rejects impossible clock times',()=>{for(const time of ['24:00','18:60','-1:30','7:00'])assert.equal(C.validTime(time),false);assert.ok(C.validTime('00:00'));assert.ok(C.validTime('23:59'));});
test('Calendar: corrupt storage records cannot reach the renderer',()=>{assert.deepEqual(C.sanitizeEvents([null,{}, {...base,date:'2026-99-99'},{...base,time:'99:99'},base]),[base]);assert.deepEqual(C.sanitizeEvents({}),[]);});
test('Calendar: duration and text constraints apply to persisted records',()=>{for(const e of [{...base,duration:Infinity},{...base,duration:-1},{...base,title:' '},{...base,place:123}])assert.equal(C.normalizeEvent(e),null);});
test('Calendar: repeated save is idempotent',()=>{const first=C.addEvent([],base);assert.equal(first.status,'added');const second=C.addEvent(first.events,{...base,id:'qa-2'});assert.equal(second.status,'duplicate');assert.equal(second.events.length,1);});
test('Calendar: a genuinely different session is retained',()=>{const result=C.addEvent([base],{...base,id:'qa-2',time:'19:30'});assert.equal(result.status,'added');assert.equal(result.events.length,2);});
test('Calendar: the 101st record is rejected before storage, without data loss',()=>{const hundred=Array.from({length:100},(_,i)=>({...base,id:'id-'+i,title:'Session '+i}));const result=C.addEvent(hundred,{...base,id:'next'});assert.equal(result.status,'full');assert.equal(result.events.length,100);assert.equal(C.sanitizeEvents(result.events).length,100);});
test('Calendar: Istanbul 18:30 is 15:30 UTC',()=>assert.equal(C.toUTC('2026-10-30','18:30').toISOString(),'2026-10-30T15:30:00.000Z'));
test('Calendar: midnight rolls back to the previous UTC day',()=>assert.equal(C.toUTC('2026-11-01','00:15').toISOString(),'2026-10-31T21:15:00.000Z'));
test('ICS: UTC time, CRLF, tentative state and end time',()=>{const s=C.icsContent(base,labels,new Date('2026-10-28T12:00:00Z'));assert.match(s,/DTSTART:20261030T153000Z\r\n/);assert.match(s,/DTEND:20261030T163000Z\r\n/);assert.match(s,/STATUS:TENTATIVE/);assert.ok(!s.replaceAll('\r\n','').includes('\n'));});
test('ICS: user-confirmed flag is explicit',()=>assert.match(C.icsContent({...base,confirmed:true},labels),/STATUS:CONFIRMED/));
test('ICS: UTF-8 lines fit the 75 octet limit and unfold losslessly',()=>{const s='SUMMARY:'+('Тренировка ⚽ '.repeat(20));const folded=C.fold(s);for(const line of folded.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);assert.equal(folded.replaceAll('\r\n ',''),s);});
test('ICS: injected newline cannot add calendar properties',()=>{const out=C.icsContent({...base,title:'Матч\nATTENDEE:bad@example.test;A,B'},labels).replaceAll('\r\n ','');assert.ok(!out.includes('\r\nATTENDEE:'));assert.ok(out.includes('Матч\\nATTENDEE:bad@example.test\\;A\\,B'));});
test('Google Calendar: encoded template only, correct timezone and duration',()=>{const u=new URL(C.calendarURL({...base,title:'A & B / дети',duration:90},labels));assert.equal(u.origin,'https://calendar.google.com');assert.equal(u.searchParams.get('stz'),'Europe/Istanbul');assert.equal(u.searchParams.get('dates'),'20261030T153000Z/20261030T170000Z');assert.equal(u.searchParams.get('text'),'[Личный план] A & B / дети');});
test('Translations: every rendered key has RU, TR and EN content',()=>{const html=fs.readFileSync('dist/index.html','utf8');for(const [file,name,attrs]of [['app.js','copy',['data-i18n','data-placeholder']],['academy.js','labels',['data-ac','data-ac-placeholder']]]){const source=fs.readFileSync('dist/assets/'+file,'utf8');const start=source.indexOf('const '+name+'='),end=source.indexOf(name==='copy'?'let lang=':'const $=');const values=vm.runInNewContext(source.slice(start,end)+';'+name);const keys=new Set(attrs.flatMap(a=>[...html.matchAll(new RegExp(a+'="([^"]+)"','g'))].map(m=>m[1])));for(const lang of ['ru','tr','en'])for(const key of keys)assert.equal(typeof values[lang][key],'string',lang+': '+key);}});
let Chess;
test('Chess: actual chess.js legality, move history and undo',async()=>{({Chess}=await import('../dist/assets/vendor/chess/chess.js'));const g=new Chess();assert.throws(()=>g.move({from:'e2',to:'e5'}));g.move('e4');g.move('e5');assert.equal(g.history().length,2);g.undo();assert.equal(g.turn(),'b');});
test('Chess: en passant works',async()=>{const {Chess}=await import('../dist/assets/vendor/chess/chess.js');const g=new Chess();for(const m of ['e4','a6','e5','d5'])g.move(m);const m=g.move('exd6');assert.ok(m.flags.includes('e'));assert.equal(g.get('d5'),undefined);});
test('Chess: promotion supports a knight, not only a queen',async()=>{const {Chess}=await import('../dist/assets/vendor/chess/chess.js');const g=new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');g.move({from:'a7',to:'a8',promotion:'n'});assert.equal(g.get('a8').type,'n');});
test('Chess: actual lesson positions and every published solution are legal',async()=>{const {Chess}=await import('../dist/assets/vendor/chess/chess.js');const s=fs.readFileSync('dist/assets/chess-app.js','utf8'),start=s.indexOf('lessons=')+8,end=s.indexOf('\n};',start)+2;const lessons=vm.runInNewContext('('+s.slice(start,end)+')');for(const [name,lesson]of Object.entries(lessons))for(const u of lesson.solutions){const g=new Chess(lesson.fen);g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});if(name==='mate')assert.ok(g.isCheckmate());if(name==='fork')assert.ok(g.isCheck());if(name==='capture')assert.equal(g.get('e4').type,'r');if(name==='castle')assert.equal(g.get(u.slice(2,4)).type,'k');}});
