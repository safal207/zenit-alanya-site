const {test,expect}=require('./fixtures.cjs');
const fs=require('node:fs');
async function draft(page){await page.locator('[name=age]').fill('7');await page.locator('[name=experience]').selectOption('regular');await page.locator('#funnel-next').click();await page.locator('#funnel-create').click();await expect(page.locator('#message-dialog')).toBeVisible();}
async function theme(page,value){if(await page.locator('html').getAttribute('data-theme')!==value)await page.locator('[data-theme-toggle]').click();}
for(const route of ['','stories.html','journey.html','play/chess.html','play/football.html'])test('Route and assets: '+(route||'home'),async({page})=>{if(route==='play/football.html')await page.setViewportSize({width:640,height:360});const response=await page.goto(route||'./');expect(response.status()).toBe(200);await expect(page.locator('h1')).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang','ru');await page.locator('h1').screenshot({path:test.info().outputPath('page-heading.png')});});

for(const width of [320,390,1280])for(const colour of ['light','dark'])test(`Enquiry layout, keyboard and dismissal ${width} ${colour}`,async({page})=>{
  await page.setViewportSize({width,height:760});await page.goto('./');await theme(page,colour);await draft(page);
  const text=await page.locator('#draft-text').innerText();expect(text).toContain('Возраст: 7 лет.');expect(text).toContain('Опыт: Занимается регулярно.');expect(text).toContain('Удобный язык ребёнка: Русский.');expect(text).not.toMatch(/undefined|null/);
  const sizes=await page.locator('#draft-text').evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight,gap:document.querySelector('#copy-button').getBoundingClientRect().top-el.getBoundingClientRect().bottom,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client+1);expect(sizes.gap).toBeGreaterThanOrEqual(12);expect(sizes.overflow).toBeLessThanOrEqual(1);
  if(width===390&&colour==='dark')await page.screenshot({path:test.info().outputPath('enquiry-dark-mobile.png')});
  const modal=page.locator('#message-dialog');await page.keyboard.press('Shift+Tab');expect(await modal.evaluate(el=>el.contains(document.activeElement))).toBe(true);
  await modal.locator('[data-close]').click();await expect(modal).not.toBeVisible();await expect(page.locator('#funnel-create')).toBeFocused();await page.locator('#funnel-create').click();await expect.poll(()=>modal.evaluate(el=>el.scrollTop)).toBe(0);
  await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await expect(page.locator('#funnel-create')).toBeFocused();
});

test('Draft validation, editing and no injection',async({page})=>{
  await page.goto('./');await page.locator('#funnel-next').click();await expect(page.locator('#funnel-step-1')).toBeVisible();await expect(page.locator('#message-dialog')).not.toBeVisible();await draft(page);await page.keyboard.press('Escape');await page.locator('#funnel-back').click();await page.locator('[name=age]').fill('16');await page.locator('[name=experience]').selectOption('beginner');await page.locator('#funnel-next').click();await page.locator('.funnel-optional summary').click();
  await page.locator('[name=area]').fill('<img src=x onerror=alert(1)>');await page.locator('[name=language]').selectOption('tr');await page.locator('#funnel-create').click();await expect(page.locator('#draft-text')).toContainText('Возраст: 16 лет.');await expect(page.locator('#draft-text')).toContainText('Только начинает');await expect(page.locator('#draft-text')).toContainText('<img src=x onerror=alert(1)>');await expect(page.locator('#draft-text img')).toHaveCount(0);
});

test('Clipboard contains exactly the generated draft',async({page,context,browserName})=>{
  test.skip(browserName!=='chromium','Clipboard permission automation is Chromium-only; fallback is tested on every engine.');
  await context.grantPermissions(['clipboard-read','clipboard-write']);await page.goto('./');await draft(page);const expected=await page.locator('#draft-text').textContent();await page.locator('#copy-button').click();await expect(page.locator('#copy-status')).toContainText('Текст скопирован.');expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(expected);
});
test('Denied clipboard permission selects the complete draft for manual copy',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('Denied','NotAllowedError');}}});});await page.goto('./');await draft(page);await page.locator('#copy-button').click();await expect(page.locator('#copy-status')).not.toBeEmpty();expect(await page.evaluate(()=>window.getSelection().toString())).toBe(await page.locator('#draft-text').textContent());
});

test('All contact surfaces and localized call buttons lead only to Anna',async({page})=>{
  await page.goto('./');
  await expect(page.locator('[data-contact-person]')).toHaveCount(3);
  await expect(page.locator('[data-contact-person=anastasia], a[href*="905369424842"]')).toHaveCount(0);
  for(const scope of ['#contacts','#contact-panel','#message-dialog']){
    const people=page.locator(scope+' [data-contact-person]');
    await expect(people).toHaveCount(1);
    await expect(people).toHaveAttribute('data-contact-person','anna');
    await expect(people.locator('.contact-action-call')).toHaveAttribute('href','tel:+905388899272');
    await expect(people.locator('.contact-action-telegram')).toHaveAttribute('href','https://t.me/+905388899272');
    await expect(people.locator('.contact-action-whatsapp')).toHaveAttribute('href','https://wa.me/905388899272');
  }
  for(const [lang,label]of [['en','Call Anna ↗'],['tr','Anna’yı ara ↗'],['ru','Позвонить Анне ↗']]){
    await page.locator(`[data-lang=${lang}]`).click();
    await expect(page.locator('[data-i18n=callAdminNow]')).toHaveText(label);
    await expect(page.locator('[data-i18n=callAdminNow]')).toHaveAttribute('href','tel:+905388899272');
    await expect(page.locator('body')).not.toContainText(/Анастас|Anastasia|536 942/);
  }
  await draft(page);
  await expect(page.locator('#message-dialog [data-i18n=anna]')).toBeVisible();
});

test('RU/TR/EN, menu keyboard and saved theme across routes',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('./');for(const lang of ['en','tr','ru']){await page.locator(`[data-lang=${lang}]`).click();await expect(page.locator('html')).toHaveAttribute('lang',lang);await expect(page.locator(`[data-lang=${lang}]`)).toHaveAttribute('aria-pressed','true');expect(await page.locator('[data-journey-link]').first().getAttribute('href')).toContain('lang='+lang);expect(await page.locator('.header-account').getAttribute('href')).toContain('lang='+lang);}
  await page.locator('.menu-toggle').click();await expect(page.locator('#mobile-nav')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#mobile-nav')).not.toBeVisible();await expect(page.locator('.menu-toggle')).toBeFocused();await theme(page,'dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.goto('journey.html');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});

test('Journal six chapters, keyboard tabs, comic and deep link',async({page})=>{
  await page.goto('journey.html');await expect(page.locator('#chapter-prev')).toBeDisabled();for(const [i,age]of [5,7,9,11,13,15].entries()){await page.locator(`#age-${age}`).click();await expect(page.locator('#chapter-number')).toHaveText(`0${i+1} / 06`);await expect(page.locator('#player-story')).not.toBeEmpty();}
  await expect(page.locator('#chapter-next')).toBeDisabled();await page.locator('#age-15').press('Home');await expect(page.locator('#age-5')).toBeFocused();await page.locator('#age-5').press('ArrowRight');await expect(page.locator('#chapter-number')).toHaveText('02 / 06');await page.locator('[data-journal-view=comic]').click();await expect(page.locator('#comic-view')).toBeVisible();await expect(page.locator('.comic-card')).toHaveCount(6);await page.locator('[data-journal-lang=en]').click();await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.locator('#comic-view')).toBeVisible();await expect(page.locator('#chapter-number')).toHaveText('02 / 06');
});

test('Calendar save, duplicate guard, persistence, ICS and deletion',async({page})=>{
  await page.goto('./#schedule');const f=page.locator('#plan-form');await expect(f).toBeVisible();const date=await f.locator('[name=date]').inputValue();await f.locator('[name=time]').fill('18:30');await f.locator('[name=title]').fill('QA local session');await f.locator('[name=place]').fill('QA pitch');await f.locator('[name=duration]').selectOption('60');await f.locator('button[type=submit]').click();await page.locator('[data-calendar-view=list]').click();await expect(page.locator('#calendar-list .event-card')).toHaveCount(1);
  await f.locator('button[type=submit]').click();await expect(page.locator('#calendar-status')).toContainText('уже есть');await expect(page.locator('#calendar-list .event-card')).toHaveCount(1);await page.reload();await page.locator('[data-calendar-view=list]').click();await expect(page.locator('#calendar-list .event-card')).toHaveCount(1);
  const card=page.locator('#calendar-list .event-card'),link=card.locator('a[href^="https://calendar.google.com"]');const url=new URL(await link.getAttribute('href'));expect(url.searchParams.get('stz')).toBe('Europe/Istanbul');expect(url.searchParams.get('dates').slice(0,8)).toBe(date.replaceAll('-',''));expect(url.searchParams.get('dates')).toContain('T153000Z');
  const downloadPromise=page.waitForEvent('download');await card.locator('[data-ics]').click();const download=await downloadPromise;const content=fs.readFileSync(await download.path(),'utf8');expect(content).toContain('STATUS:TENTATIVE');expect(content).toContain('T153000Z');await card.locator('.event-delete').click();await expect(page.locator('#calendar-list .event-card')).toHaveCount(0);await page.reload();await page.locator('[data-calendar-view=list]').click();await expect(page.locator('#calendar-list .event-card')).toHaveCount(0);
});

test('Checklist persists and resets in its isolated browser context',async({page})=>{await page.goto('./#checklist');await expect(page.locator('#bag-list input')).toHaveCount(6);await page.locator('#bag-list input').nth(0).check();await page.locator('#bag-list input').nth(3).check();await expect(page.locator('#bag-count')).toHaveText('2 / 6');await page.reload();await expect(page.locator('#bag-list input').nth(3)).toBeChecked();await page.locator('#reset-bag').click();await expect(page.locator('#bag-count')).toHaveText('0 / 6');});

test('Stories filters, saving, local message and download',async({page})=>{await page.goto('stories.html?category=team');await expect(page.locator('.story-card')).toHaveCount(2);await page.locator('[data-save-film=message]').click();await page.locator('[data-film-filter=saved]').click();await expect(page.locator('.story-card')).toHaveCount(1);await page.locator('.story-watch').click();await expect(page.locator('#film-dialog')).toBeVisible();await expect(page.locator('.film-stage video')).toHaveAttribute('src','assets/media/erokhin-message.mp4');await expect(page.locator('.film-download')).toHaveAttribute('download','erokhin-message.mp4');await page.keyboard.press('Escape');await expect(page.locator('#film-dialog')).not.toBeVisible();await expect(page.locator('.story-watch')).toBeFocused();await page.goto('stories.html?category=saved');await expect(page.locator('.story-card')).toHaveCount(1);});

test('Decorative background and reduced-motion fallback',async({page})=>{await page.goto('./');const v=page.locator('#hero-film');await expect(v).toHaveAttribute('autoplay','');await expect(v).toHaveAttribute('loop','');expect(await v.evaluate(el=>({muted:el.muted,controls:el.controls}))).toEqual({muted:true,controls:false});await page.emulateMedia({reducedMotion:'reduce'});await expect(v).toBeHidden();await expect(page.locator('.hero-backdrop img')).toBeVisible();});

test('Hero video: denied playback leaves manual control and direct MP4 fallback',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{
  const original=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){if(this.id==='hero-film')return Promise.reject(new DOMException('Blocked by browser','NotAllowedError'));return original.call(this);};
 });
 await page.goto('./');
 const video=page.locator('#hero-film');
 await expect(video).toBeHidden();
 await expect(page.locator('#hero-video-toggle')).toBeVisible();
 await page.locator('#hero-video-toggle').click();
 await expect(page.locator('#hero-video-fallback')).toBeVisible();
 await expect(page.locator('#hero-video-fallback')).toHaveAttribute('href','assets/media/zenit.mp4');
});
test('Hero share: invitation includes the published site and contact phone',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__sharedInvitation=text;}}});
 });
 await page.goto('./');
 await page.locator('[data-hero-share]').click();
 await expect(page.locator('[data-share-feedback]')).toContainText('скопированы');
 const text=await page.evaluate(()=>window.__sharedInvitation);
 expect(text).toContain('Зенит Аланья');expect(text).toContain('+90 538 889 92 72');
 expect(text).toContain('zenit-alanya-site/');
});

test('Unavailable storage does not break enquiry or calendar controls',async({page})=>{await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('Denied','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('Denied','SecurityError');};});await page.goto('./');await draft(page);await page.keyboard.press('Escape');await page.goto('./#checklist');await page.locator('#bag-list input').first().check();await expect(page.locator('#bag-count')).toHaveText('1 / 6');});

test('Chess engine replies, undo and all lesson solutions',async({page})=>{test.setTimeout(60000);await page.goto('play/chess.html');await expect(page.locator('#engine-state')).toContainText('готов',{timeout:30000});await page.locator('#chess-level').selectOption('0');await page.locator('[data-square=e2]').click();await page.locator('[data-square=e4]').click();await expect(page.locator('#board-status')).toContainText('Твой ход',{timeout:15000});await expect(page.locator('#move-list li')).toHaveCount(1);await page.locator('#undo-move').click();await expect(page.locator('#move-list li')).toHaveCount(0);const hint=page.locator('#hint-move');await hint.click();await expect(page.locator('.square.hint')).toHaveCount(0);await hint.click();await expect(page.locator('.square.hint')).toHaveCount(1,{timeout:15000});await hint.click();await expect(page.locator('.square.hint')).toHaveCount(2);await expect(page.locator('#move-list li')).toHaveCount(0);await page.locator('[data-chess-mode=learn]').click();for(const [lesson,from,to]of [['develop','g1','f3'],['defend','e1','d1'],['mate','g6','g7'],['fork','f5','e7'],['capture','e2','e4'],['castle','e1','g1']]){await page.locator('#lesson-select').selectOption(lesson);await page.locator(`[data-square=${from}]`).click();await page.locator(`[data-square=${to}]`).click();await expect(page.locator('#coach-heading')).toContainText('Верно!');}});

test('Chess beginner replies without Stockfish and mentor reveals a lesson in stages', async ({ page }) => {
  await page.route('**/stockfish-19-lite-single.js', route => route.abort());
  await page.goto('play/chess.html');
  const level = page.locator('#chess-level');
  await expect(level.locator('option')).toHaveCount(6);
  await level.selectOption('starter');
  await expect(page.locator('#opponent-name')).toHaveText('Новичок');
  await page.locator('[data-square=e2]').click();
  await page.locator('[data-square=e4]').click();
  await expect(page.locator('#move-list li')).toContainText('·');
  await expect(page.locator('#board-status')).toContainText('Твой ход');
  await level.selectOption('20');
  await expect(page.locator('#opponent-name')).toHaveText('Эксперт');

  await page.locator('[data-chess-mode=learn]').click();
  await page.locator('#lesson-select').selectOption('mate');
  const hint = page.locator('#hint-move');
  await hint.click();
  await expect(page.locator('.square.hint')).toHaveCount(0);
  await expect(page.locator('#coach-message')).toContainText('Поищи поле для шаха');
  await hint.click();
  await expect(page.locator('.square.hint')).toHaveCount(1);
  await expect(page.locator('[data-square=g6]')).toHaveClass(/\bhint\b/);
  await hint.click();
  await expect(page.locator('.square.hint')).toHaveCount(2);
  await expect(page.locator('[data-square=g7]')).toHaveClass(/\bhint\b/);
  await page.locator('[data-square=g6]').click();
  await page.locator('[data-square=g7]').click();
  await expect(page.locator('#lesson-progress')).toHaveText('Пройдено 1 из 6');
  await page.locator('#next-lesson').click();
  await expect(page.locator('#lesson-select')).toHaveValue('develop');
  await page.reload();
  await expect(level).toHaveValue('20');
  await page.locator('[data-chess-mode=learn]').click();
  await expect(page.locator('#lesson-progress')).toHaveText('Пройдено 1 из 6');
});

test('Player account is standalone and restores the photo and plan after sign-in on a second device', async ({page, browser}) => {
  const id = '88b9eeb4-60ef-4758-ad5c-614c18f60ca4';
  const saved = {id, nickname:'', strength:'', goal:'', route:'', photo_jpeg:null, journey_plan:{}};
  let registered = false;
  let refreshed = false;
  const mock = context => context.route('https://tqhewqpzpfviwhicsnzm.supabase.co/**', route => {
    const req = route.request();
    const url = new URL(req.url());
    const headers = {'access-control-allow-origin':'*', 'access-control-allow-headers':'apikey, authorization, content-type, prefer', 'access-control-allow-methods':'GET, PATCH, POST, OPTIONS'};
    const json = (status, data) => route.fulfill({status, headers, json:data});
    if (req.method() === 'OPTIONS') return route.fulfill({status:204, headers});
    if (url.pathname.endsWith('/player-account')) {
      const data = req.postDataJSON();
      if (data.action === 'register') {
        if (data.invite !== 'A'.repeat(22)) return json(409, {code:'registration_unavailable'});
        registered = true;
      }
      if (!registered || data.login !== 'player_qa' || data.password !== 'match-day-qa-pass') return json(401, {code:'invalid_login'});
      return json(200, {access_token:'qa-token', refresh_token:'qa-refresh'});
    }
    if (url.pathname.endsWith('/logout')) return route.fulfill({status:204, headers});
    if (url.pathname.endsWith('/token')) {
      refreshed = true;
      return json(200, {access_token:'qa-new-token', refresh_token:'qa-next-refresh'});
    }
    if (!url.pathname.endsWith('/zenit_player_profiles')) return json(404, {});
    if (req.method() === 'PATCH') {
      if (url.searchParams.get('id') !== 'eq.' + id) return json(400, {});
      if (req.headers().authorization !== 'Bearer qa-new-token') return json(401, {});
      Object.assign(saved, req.postDataJSON());
      return json(200, [{id}]);
    }
    return json(200, [saved]);
  });
  const credentials = async target => {
    await target.getByLabel('Логин', {exact:true}).fill('player_qa');
    await target.getByLabel('Пароль', {exact:true}).fill('match-day-qa-pass');
  };
  await page.setViewportSize({width:390, height:844});
  await mock(page.context());
  await page.goto('./');
  await expect(page.locator('[data-player-link]')).toHaveCount(2);
  await expect(page.locator('.header-account')).toBeVisible();
  await page.evaluate(() => localStorage.setItem('zenit-alanya-player-v1', JSON.stringify({strength:'Черновик с устройства'})));
  await page.locator('.header-account').click();
  const playerUrl = page.url();
  await expect(page.getByLabel('Как меня зовут')).toBeHidden();
  await page.locator('[data-path-step=international]').click();
  await page.locator('#path-pick').click();
  await page.getByRole('button', {name:'У меня есть код клуба'}).click();
  await credentials(page);
  await page.getByLabel('Одноразовый код клуба').fill('B'.repeat(22));
  await page.getByRole('button', {name:'Создать аккаунт'}).click();
  await expect(page.locator('#account-status')).toContainText('Код недействителен');
  await page.getByLabel('Одноразовый код клуба').fill('A'.repeat(22));
  await page.getByRole('button', {name:'Создать аккаунт'}).click();
  await expect(page.locator('[name=journey_stage]')).toHaveValue('international');
  await page.getByRole('button', {name:'Перенести черновик с устройства'}).click();
  await expect(page.getByLabel('У меня уже получается')).toHaveValue('Черновик с устройства');
  await expect(page.locator('#plan-status')).toHaveText('Черновик перенесён в аккаунт.');
  await page.getByLabel('Как меня зовут').fill('Игрок QA');
  await page.getByLabel('У меня уже получается').fill('Вижу партнёра');
  await page.getByLabel('Что попробую на тренировке').fill('Подниму голову перед пасом');
  await page.getByRole('radio', {name:/Попробовать больше матчей/}).check();
  await page.locator('[data-path-step=trial]').click();
  await page.locator('#path-pick').click();
  await expect(page.locator('[name=journey_stage]')).toHaveValue('trial');
  await page.getByLabel('Выезд или академия, о которых хочу узнать').selectOption('benfica');
  await page.getByLabel('Когда пересмотрим план').fill('2026-12-12');
  await page.getByLabel('Над чем работаю до встречи').fill('Разобрать приём мяча');
  await page.getByLabel('Обсудил готовность с тренером').check();
  await page.locator('.path-reflection summary').click();
  await page.getByLabel('Что получилось и что попробую дальше').fill('Поднял голову перед пасом');
  await page.getByRole('button', {name:'Сохранить мой план'}).click();
  await expect(page.locator('#plan-status')).toHaveText('Твой план сохранён.');
  expect(refreshed).toBe(true);
  await page.locator('#photo-input').setInputFiles({
    name:'player.png', mimeType:'image/png',
    buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64')
  });
  await expect(page.getByRole('img', {name:'Фото игрока'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('radio', {name:/Попробовать больше матчей/})).toBeChecked();

  const other = await browser.newContext();
  try {
    await mock(other);
    const device = await other.newPage();
    await device.goto(playerUrl);
    await expect(device.getByLabel('Как меня зовут')).toBeHidden();
    await credentials(device);
    await device.getByRole('button', {name:'Войти', exact:true}).click();
    const photo = device.getByRole('img', {name:'Фото игрока'});
    await expect(photo).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
    await expect(device.getByLabel('Что попробую на тренировке')).toHaveValue('Подниму голову перед пасом');
    await expect(device.locator('[name=journey_stage]')).toHaveValue('trial');
    await expect(device.locator('[name=journey_target]')).toHaveValue('benfica');
    await expect(device.locator('[name=journey_review]')).toHaveValue('2026-12-12');
    await expect(device.locator('[name=journey_practice]')).toHaveValue('Разобрать приём мяча');
    await expect(device.getByLabel('Обсудил готовность с тренером')).toBeChecked();
    await expect(device.locator('[name=journey_reflection]')).toHaveValue('Поднял голову перед пасом');
    await device.getByRole('button', {name:'Удалить фото'}).click();
    await expect(photo).toHaveCount(0);
    await expect(device.getByLabel('У меня уже получается')).toHaveValue('Вижу партнёра');
    await device.getByRole('button', {name:'Выйти'}).click();
    await expect(device.getByLabel('Как меня зовут')).toBeHidden();
    await device.reload();
    await expect(device.getByRole('button', {name:'Войти', exact:true})).toBeVisible();
  } finally { await other.close(); }
});

for(const lang of ['ru','tr','en'])test('Player pathway is readable, standalone and honest about past events: '+lang,async({page})=>{
  await page.setViewportSize({width:320,height:800});await page.goto('player.html?lang='+lang);
  await expect(page.locator('[data-path-step]')).toHaveCount(7);
  for(const step of ['international','trial','academy','adult']){
    await page.locator('[data-path-step='+step+']').click();
    await expect(page.locator('[data-path-step='+step+']')).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#path-step-title')).not.toBeEmpty();
  }
  await page.locator('#path-pick').click();await expect(page.locator('#account-status')).not.toBeEmpty();
  await expect(page.locator('#player-form')).toBeHidden();
  await page.locator('.path-opportunities details').nth(0).locator('summary').click();
  await expect(page.locator('[data-path-copy=jwcaBadge]')).toContainText('2026');
  await page.locator('.path-opportunities details').nth(1).locator('summary').click();
  await expect(page.locator('[data-path-copy=partnerNote]')).not.toBeEmpty();
  expect(await page.locator('html').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
  await page.locator('[data-theme-toggle]').click();
  await expect(page.locator('#path-title')).toBeVisible();
});

test('Mobile film previews use real posters and load full video only after explicit tap',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('./');
 const previews=page.locator('[data-open-message]');
 await expect(previews).toHaveCount(2);
 await expect(page.locator('.message-card')).toHaveCount(2);
 const video=page.locator('#message-player-video');
 await expect(video).not.toHaveAttribute('src',/\S/);
 for(const id of ['message','adamov']){
  await expect(page.locator('[data-open-message='+id+'] img')).toBeVisible();
  const bbox=await page.locator('[data-open-message='+id+']').boundingBox();
  expect(bbox.height).toBeLessThan(350);
  await expect(page.locator('[data-open-message='+id+']')).toHaveAttribute('aria-haspopup','dialog');
 }
 const account=await page.locator('.header-account').boundingBox();
 expect(account.height).toBeLessThanOrEqual(52);
 expect((await page.locator('.header').boundingBox()).height).toBeLessThanOrEqual(80);
 await previews.first().focus();
 await page.keyboard.press('Enter');
 await expect(page.locator('#message-player-dialog')).toBeVisible();
 await expect(video).toHaveAttribute('src','assets/media/erokhin-message.mp4');
 await expect(page.locator('#message-player-download')).toHaveAttribute('download','zenit-alanya-erokhin.mp4');
 await expect(page.locator('#message-player-source')).toHaveAttribute('href','https://www.instagram.com/zenitalanya/reel/Dejjp92OaRJ/');
 await page.keyboard.press('Escape');
 await expect(page.locator('#message-player-dialog')).not.toBeVisible();
 await expect(video).not.toHaveAttribute('src',/\S/);
 await expect(previews.first()).toBeFocused();
 await page.locator('.languages button[data-lang=en]').click();
 await previews.nth(1).click();
 await expect(page.locator('#message-player-dialog')).toBeVisible();
 await expect(video).toHaveAttribute('src','assets/media/adamov-message.mp4');
 await expect(page.locator('#message-player-title')).not.toContainText('Поздравление');
 await page.locator('[data-message-close]').click();
 await expect(video).not.toHaveAttribute('src',/\S/);
 expect(await page.locator('html').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
});
