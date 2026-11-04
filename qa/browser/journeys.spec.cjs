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

test('Contact destinations match both public administrator numbers',async({page})=>{
  await page.goto('./');await draft(page);for(const [who,number]of [['anastasia','905369424842'],['anna','905388899272']]){const person=page.locator(`#message-dialog [data-contact-person=${who}]`);await expect(person.locator('.contact-action-call')).toHaveAttribute('href','tel:+'+number);await expect(person.locator('.contact-action-telegram')).toHaveAttribute('href','https://t.me/+'+number);await expect(person.locator('.contact-action-whatsapp')).toHaveAttribute('href','https://wa.me/'+number);}
});

test('RU/TR/EN, menu keyboard and saved theme across routes',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('./');for(const lang of ['en','tr','ru']){await page.locator(`[data-lang=${lang}]`).click();await expect(page.locator('html')).toHaveAttribute('lang',lang);await expect(page.locator(`[data-lang=${lang}]`)).toHaveAttribute('aria-pressed','true');expect(await page.locator('[data-journey-link]').first().getAttribute('href')).toContain('lang='+lang);}
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
