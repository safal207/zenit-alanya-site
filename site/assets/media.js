(()=>{'use strict';
const data=window.ZenitFilms;if(!data)return;
const words={
ru:{download:'Скачать MP4',allMessages:'Все обращения ↗',all:'Все истории',training:'Тренировки',team:'Обращения',messages:'Обращения к ребятам',messageNote:'Из официальных публикаций школы.',beforeTournament:'Перед Junior World Cup Antalya',anniversary:'К трёхлетию школы',tournament:'Турниры',saved:'Сохранённые',save:'Сохранить',unsave:'Сохранено',play:'Смотреть',close:'Закрыть',prev:'Предыдущее',next:'Следующее',share:'Поделиться',source:'Подробнее в Instagram ↗',loading:'Загружаем публикацию школы…',ready:'Нажмите ▶ в ролике, чтобы начать просмотр.',slow:'Видео загружается дольше обычного. Можно открыть оригинал ниже.',copied:'Ссылка на историю скопирована.',manual:'Скопируйте адрес страницы.',empty:'Здесь пока нет сохранённых историй.',heading:'Маленькие моменты. Большая команда.',lead:'Тренировки, первые открытия и турнирные истории «Зенит Аланья». Смотрите здесь. Возвращайтесь к любимому.',local:'Сохранённые истории хранятся только в этом браузере.',pause:'Пауза видео',resume:'Продолжить видео',home:'В клуб',cta:'Подобрать группу',note:'Концепция для обсуждения с клубом · не официальный сайт'},
tr:{download:'MP4 indir',allMessages:'Tüm mesajlar ↗',all:'Tüm hikâyeler',training:'Antrenman',team:'Mesajlar',messages:'Çocuklara mesajlar',messageNote:'Okulun resmi paylaşımlarından.',beforeTournament:'Junior World Cup Antalya öncesi',anniversary:'Okulun üçüncü yılı için',tournament:'Turnuvalar',saved:'Kaydedilenler',save:'Kaydet',unsave:'Kaydedildi',play:'İzle',close:'Kapat',prev:'Önceki',next:'Sonraki',share:'Paylaş',source:'Instagram’da daha fazlası ↗',loading:'Okulun paylaşımı yükleniyor…',ready:'İzlemek için videodaki ▶ düğmesine basın.',slow:'Video yavaş yükleniyor. Orijinal paylaşımı aşağıdan açabilirsiniz.',copied:'Hikâye bağlantısı kopyalandı.',manual:'Adres çubuğundan kopyalayın.',empty:'Henüz kaydedilmiş hikâye yok.',heading:'Küçük anlar. Büyük bir takım.',lead:'Zenit Alanya’dan antrenmanlar ve turnuva hikâyeleri. Burada izleyin.',local:'Kaydedilen hikâyeler yalnızca bu tarayıcıda saklanır.',pause:'Videoyu duraklat',resume:'Videoyu oynat',home:'Kulüp',cta:'Grup hakkında bilgi',note:'Kulüple görüşmek için bir konsept · resmi site değildir'},
en:{download:'Download MP4',allMessages:'All messages ↗',all:'All stories',training:'Training',team:'Messages',messages:'Messages to the team',messageNote:'From the school’s official posts.',beforeTournament:'Before Junior World Cup Antalya',anniversary:'For the school’s third anniversary',tournament:'Tournaments',saved:'Saved',save:'Save',unsave:'Saved',play:'Watch',close:'Close',prev:'Previous',next:'Next',share:'Share',source:'Explore on Instagram ↗',loading:'Loading the school’s post…',ready:'Press ▶ in the video to start watching.',slow:'The video is taking longer to load. Open the original below.',copied:'Story link copied.',manual:'Copy the page URL.',empty:'No saved stories yet.',heading:'Small moments. One big team.',lead:'Training, first discoveries and tournament stories from Zenit Alanya. Watch here.',local:'Saved stories stay in this browser only.',pause:'Pause video',resume:'Resume video',home:'The club',cta:'Find a group',note:'An independent concept for discussion · not the official website'}};
const $=s=>document.querySelector(s),key='zenit-saved-films-v1';let lang='ru',filter='all',current=null,timer,trigger,returnPath=null,saved=new Set();
function readSaved(){try{const a=JSON.parse(localStorage.getItem(key)||'[]');saved=new Set(Array.isArray(a)?a.filter(id=>data.films.some(f=>f.id===id)):[]);}catch{saved=new Set();}}
readSaved();const t=k=>words[lang][k],title=f=>f.title[lang];
const dialog=document.createElement('dialog');dialog.id='film-dialog';dialog.className='film-dialog';dialog.setAttribute('aria-labelledby','film-title');dialog.innerHTML='<div class="film-top"><span>ZENIT ALANYA · STORIES</span><button type="button" class="film-close" aria-label="Закрыть">×</button></div><div class="film-layout"><div class="film-stage"></div><div class="film-detail"><p class="film-date"></p><h2 id="film-title"></h2><p class="film-description"></p><p class="film-status" role="status"></p><div class="film-controls"><button type="button" data-film-action="prev"></button><button type="button" data-film-action="next"></button></div><div class="film-controls"><button type="button" data-film-action="save"></button><button type="button" data-film-action="share"></button></div><a class="film-download" download hidden></a><a class="film-original" target="_blank" rel="noopener"></a></div></div>';document.body.append(dialog);
const stage=dialog.querySelector('.film-stage'),status=dialog.querySelector('.film-status');
function storyURL(id){const u=new URL('stories.html',location.href);u.searchParams.set('film',id);u.searchParams.set('lang',lang);return u;}
function detail(){if(!current)return;$('#film-title').textContent=title(current);dialog.querySelector('.film-description').textContent=current.description[lang];dialog.querySelector('.film-date').textContent=new Date(current.date+'T12:00:00Z').toLocaleDateString(lang==='tr'?'tr-TR':lang==='ru'?'ru-RU':'en-GB');dialog.querySelector('.film-close').setAttribute('aria-label',t('close'));['prev','next','share'].forEach(k=>dialog.querySelector('[data-film-action="'+k+'"]').textContent=t(k));const save=dialog.querySelector('[data-film-action="save"]');save.textContent=t(saved.has(current.id)?'unsave':'save');save.setAttribute('aria-pressed',String(saved.has(current.id)));const source=dialog.querySelector('.film-original');source.href=current.original;source.textContent=t('source');const a=dialog.querySelector('.film-download');a.hidden=!current.file;a.href=current.file||'#';a.download=(current.file||'').split('/').pop();a.textContent=t('download');}
function stopStage(){stage.querySelector('video')?.pause();stage.replaceChildren();}
function showFilm(id,writeURL=true){const film=data.films.find(f=>f.id===id);if(!film)return;if(!dialog.open){document.querySelectorAll('video').forEach(v=>v.pause());trigger=document.activeElement;const back=new URL(location.href);back.searchParams.delete('film');returnPath=back.href;dialog.showModal();document.body.classList.add('film-open');}current=film;clearTimeout(timer);stopStage();detail();
if(film.file){const v=document.createElement('video');v.src=film.file;v.poster=film.poster;v.controls=true;v.playsInline=true;v.preload='none';v.tabIndex=0;v.setAttribute('aria-label',title(film));status.textContent=t('ready');v.addEventListener('error',()=>{status.textContent=t('slow');});stage.append(v);}else{status.textContent=t('loading');const frame=document.createElement('iframe');frame.title=title(film);frame.src=film.embed;frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.addEventListener('load',()=>{clearTimeout(timer);status.textContent=t('ready');});timer=setTimeout(()=>{status.textContent=t('slow');},15000);stage.append(frame);}
if(writeURL){const url=new URL(location.href);url.searchParams.set('film',id);history.replaceState(null,'',url);}dialog.querySelector('.film-close').focus({preventScroll:true});}
document.addEventListener('play',e=>{if(e.target.tagName==='VIDEO')document.querySelectorAll('video').forEach(v=>{if(v!==e.target)v.pause();});},true);
dialog.querySelector('.film-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{clearTimeout(timer);stopStage();current=null;document.body.classList.remove('film-open');if(returnPath)history.replaceState(null,'',returnPath);trigger?.focus({preventScroll:true});});
function step(n){if(current){const i=data.films.indexOf(current);showFilm(data.films[(i+n+data.films.length)%data.films.length].id);}}
function toggleSaved(id){saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem(key,JSON.stringify([...saved]));}catch{}renderCards();detail();}
dialog.addEventListener('click',async e=>{const a=e.target.closest('[data-film-action]')?.dataset.filmAction;if(!a||!current)return;if(a==='prev')step(-1);if(a==='next')step(1);if(a==='save')toggleSaved(current.id);if(a==='share'){const url=storyURL(current.id).href;try{if(navigator.share)await navigator.share({title:title(current),url});else{await navigator.clipboard.writeText(url);status.textContent=t('copied');}}catch(error){if(error.name!=='AbortError')status.textContent=t('manual');}}});
dialog.addEventListener('keydown',e=>{if(e.target.closest('video'))return;if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}});
window.addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('film');if(id)showFilm(id,false);else if(dialog.open)dialog.close();});document.querySelectorAll('[data-open-film]').forEach(el=>el.addEventListener('click',()=>showFilm(el.dataset.openFilm)));
function renderCards(){const grid=$('#film-grid');if(!grid)return;grid.replaceChildren();const films=data.films.filter(f=>filter==='all'||filter==='saved'&&saved.has(f.id)||f.category===filter);if(!films.length){const p=document.createElement('p');p.className='film-empty';p.textContent=t('empty');grid.append(p);}films.forEach((f,index)=>{const article=document.createElement('article');article.className='story-card';const watch=document.createElement('button');watch.type='button';watch.className='story-watch';watch.setAttribute('aria-label',t('play')+': '+title(f)+' · '+(f.poster?'':(f.speaker?.[lang]||(f.category==='team'?'ONE TEAM.':'GAME DAYS.'))+' · ')+t(f.category)+(f.duration?' · '+f.duration:''));if(f.poster){const img=document.createElement('img');img.src=f.poster;img.alt=title(f);img.width=800;img.height=450;img.loading=index===0?'eager':'lazy';if(index===0)img.fetchPriority='high';watch.append(img);}else{const mark=document.createElement('span');mark.className='story-type-art';mark.textContent=f.speaker?.[lang]||(f.category==='team'?'ONE TEAM.':'GAME DAYS.');watch.append(mark);}const play=document.createElement('span');play.className='story-play';play.textContent='▶';play.setAttribute('aria-hidden','true');watch.append(play);const category=document.createElement('span');category.className='story-category';category.textContent=t(f.category)+(f.duration?' · '+f.duration:'');watch.append(category);watch.addEventListener('click',()=>showFilm(f.id));const body=document.createElement('div');body.className='story-body';const h=document.createElement('h2');h.textContent=title(f);const p=document.createElement('p');p.textContent=f.description[lang];const save=document.createElement('button');save.type='button';save.className='story-save';save.dataset.saveFilm=f.id;save.setAttribute('aria-label',t(saved.has(f.id)?'unsave':'save')+': '+title(f));save.setAttribute('aria-pressed',String(saved.has(f.id)));save.textContent=saved.has(f.id)?'♥':'♡';save.addEventListener('click',()=>{toggleSaved(f.id);grid.querySelector('[data-save-film="'+f.id+'"]')?.focus();});body.append(h,p,save);article.append(watch,body);grid.append(article);});}
function language(next){if(!words[next])return;lang=next;document.querySelectorAll('[data-film-player]').forEach(el=>{el.title=title(data.films.find(f=>f.id===el.dataset.filmPlayer));el.setAttribute('aria-label',el.title);});document.querySelectorAll('[data-film-title]').forEach(el=>{const film=data.films.find(f=>f.id===el.dataset.filmTitle);if(film)el.textContent=title(film);});document.querySelectorAll('[data-film-text]').forEach(el=>el.textContent=t(el.dataset.filmText));document.querySelectorAll('[data-film-filter]').forEach(b=>{b.textContent=t(b.dataset.filmFilter);b.setAttribute('aria-pressed',String(filter===b.dataset.filmFilter));});document.querySelectorAll('[data-story-link]').forEach(a=>{const u=new URL(a.href);u.searchParams.set('lang',lang);a.href=u;});renderCards();detail();}
document.querySelectorAll('[data-film-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filmFilter;language(lang);}));document.querySelectorAll('[data-story-lang]').forEach(b=>b.addEventListener('click',()=>{document.documentElement.lang=b.dataset.storyLang;const url=new URL(location.href);url.searchParams.set('lang',b.dataset.storyLang);history.replaceState(null,'',url);document.querySelectorAll('[data-story-lang]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));language(b.dataset.storyLang);}));document.addEventListener('site:language',()=>language(document.documentElement.lang));window.addEventListener('storage',e=>{if(e.key===key){readSaved();renderCards();detail();}});
const incoming=new URLSearchParams(location.search);if(['training','team','tournament','saved'].includes(incoming.get('category')))filter=incoming.get('category');if($('#film-grid')&&words[incoming.get('lang')])document.documentElement.lang=incoming.get('lang');language(document.documentElement.lang);document.querySelectorAll('[data-story-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.storyLang===lang)));if(incoming.get('film'))showFilm(incoming.get('film'),false);
const hero=$('#hero-film');
if(hero&&data.hero.file){
 const toggle=$('#hero-video-toggle'),label=toggle?.querySelector('[data-hero-video-label]'),fallback=$('#hero-video-fallback');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=true,manualActivated=false,userPaused=false,autoplayBlocked=false;
 const localized={
  ru:{watch:'▶ Смотреть видео',pause:'Ⅱ Пауза',retry:'▶ Повторить',open:'Открыть MP4 ↗'},
  tr:{watch:'▶ Videoyu izle',pause:'Ⅱ Duraklat',retry:'▶ Tekrar dene',open:'MP4 dosyasını aç ↗'},
  en:{watch:'▶ Play video',pause:'Ⅱ Pause',retry:'▶ Retry video',open:'Open MP4 ↗'}
 };
 const updateControls=()=>{
  const t=localized[document.documentElement.lang]||localized.ru;
  const playing=!hero.hidden&&!hero.paused&&!hero.ended;
  if(label)label.textContent=playing?t.pause:(autoplayBlocked&&manualActivated?t.retry:t.watch);
  if(toggle){toggle.setAttribute('aria-pressed',String(playing));toggle.setAttribute('aria-label',playing?t.pause:t.watch);}
  if(fallback)fallback.textContent=t.open;
 };
 const failed=()=>{
  autoplayBlocked=true;hero.hidden=true;hero.pause();
  if(manualActivated&&fallback)fallback.hidden=false;
  updateControls();
 };
 const playVideo=(requested)=>{
  if(requested){manualActivated=true;userPaused=false;autoplayBlocked=false;hero.dataset.manualPlay='true';}
  if(autoplayBlocked&&!requested)return;
  hero.hidden=false;
  hero.muted=true;hero.loop=true;
  try{
   const attempt=hero.play();
   if(attempt&&typeof attempt.then==='function')attempt.then(()=>{
    if(fallback)fallback.hidden=true;
    updateControls();
   },failed);
   else updateControls();
  }catch{failed();}
 };
 const sync=()=>{
  const conserve=motion.matches||Boolean(navigator.connection?.saveData);
  if(!visible||document.hidden||dialog.open||userPaused||(conserve&&!manualActivated)){
   hero.pause();
   if(conserve&&!manualActivated)hero.hidden=true;
   updateControls();
   return;
  }
  if(!autoplayBlocked&&hero.paused)playVideo(false);
  updateControls();
 };
 if(toggle)toggle.addEventListener('click',()=>{
  if(!hero.hidden&&!hero.paused){
   userPaused=true;hero.pause();updateControls();return;
  }
  playVideo(true);
 });
 hero.addEventListener('playing',updateControls);
 hero.addEventListener('pause',updateControls);
 hero.addEventListener('error',failed);
 document.addEventListener('site:language',updateControls);
 motion.addEventListener('change',sync);
 navigator.connection?.addEventListener('change',sync);
 document.addEventListener('visibilitychange',sync);
 dialog.addEventListener('close',sync);
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(hero.closest('section'));
 sync();
}
})();
/* On-demand portrait message player. The home page renders only authentic stills;
   loading and playback of the actual MP4 occur after an explicit visitor click. */
;(()=>{'use strict';
 const dialog=document.querySelector('#message-player-dialog');
 if(!dialog||typeof dialog.showModal!=='function')return;
 const video=document.querySelector('#message-player-video');
 const title=document.querySelector('#message-player-title');
 const close=document.querySelector('[data-message-close]');
 const status=document.querySelector('#message-player-status');
 const download=document.querySelector('#message-player-download');
 const source=document.querySelector('#message-player-source');
 const translations={
  ru:{loading:'Загружаем видео…',ready:'Нажмите ▶, чтобы запустить видео',error:'Видео недоступно. Откройте файл или оригинал ниже.',close:'Закрыть видео'},
  tr:{loading:'Video yükleniyor…',ready:'Başlatmak için ▶ düğmesine basın',error:'Video açılamadı. MP4 dosyasını veya orijinal gönderiyi açın.',close:'Videoyu kapat'},
  en:{loading:'Loading video…',ready:'Press ▶ to play the video',error:'Video unavailable. Open the MP4 file or original post below.',close:'Close video'}
 };
 let opener=null,reason='loading';
 const strings=()=>translations[document.documentElement.lang]||translations.ru;
 const showStatus=key=>{reason=key;status.textContent=strings()[key];status.hidden=false};
 const clearStatus=()=>{status.hidden=true};
 document.querySelectorAll('a[data-open-message]').forEach(anchor=>{
  anchor.addEventListener('click',event=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
   event.preventDefault();
   const card=anchor.closest('.message-card');
   if(!card)return;
   opener=anchor;
   title.textContent=card.querySelector('.message-card-header h4')?.textContent||'ZENIT ALANYA';
   const original=card.querySelector('.message-source');
   const file=card.querySelector('.message-download');
   if(original)source.href=original.href;
   if(file){download.href=file.href;download.download=file.download;}
   video.poster=anchor.querySelector('img')?.getAttribute('src')||'';
   video.setAttribute('aria-label',title.textContent);
   video.src=anchor.getAttribute('href');
   video.preload='metadata';
   showStatus('loading');
   const hero=document.querySelector('#hero-film');
   if(hero&&!hero.paused)hero.pause();
   dialog.showModal();
   try{
    const started=video.play();
    if(started&&typeof started.catch==='function')started.catch(()=>{if(dialog.open&&video.paused)showStatus('ready')});
   }catch{showStatus('ready')}
  });
 });
 video.addEventListener('waiting',()=>{if(dialog.open)showStatus('loading')});
 video.addEventListener('playing',clearStatus);
 video.addEventListener('canplay',clearStatus);
 video.addEventListener('error',()=>{if(dialog.open)showStatus('error')});
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
 });
 dialog.addEventListener('close',()=>{
  video.pause();
  video.removeAttribute('src');
  video.removeAttribute('poster');
  video.load();
  video.preload='none';
  clearStatus();
  if(opener?.isConnected)opener.focus();
  opener=null;
 });
 document.addEventListener('site:language',()=>{
  close.setAttribute('aria-label',strings().close);
  if(!status.hidden)status.textContent=strings()[reason];
 });
 close.setAttribute('aria-label',strings().close);
})();
