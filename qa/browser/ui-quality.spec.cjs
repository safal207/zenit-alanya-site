const {test,expect}=require('./fixtures.cjs');

test('Gallery keeps theme and language across reloads and the return home',async({page})=>{
  await page.goto('club-life.html?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  if(await page.locator('html').getAttribute('data-theme')!=='dark')await page.locator('[data-theme-toggle]').click();
  await page.locator('[data-lang=tr]').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang','tr');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-label',/Açık temaya geç/);
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang','tr');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});

for(const route of ['','stories.html','journey.html','club-life.html','player.html','play/chess.html'])test('Keyboard bypass reaches content: '+(route||'home'),async({page})=>{
  await page.goto(route||'./');
  await page.keyboard.press('Tab');
  const skip=page.locator('[data-skip-link]');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

for(const route of ['','club-life.html','player.html'])test('Content reflows with doubled text: '+(route||'home'),async({page},info)=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(route||'./');
  await page.evaluate(async()=>{
    await document.fonts.ready;
    const samples=[...document.querySelectorAll('body *')].filter(el=>el instanceof HTMLElement&&el.getClientRects().length&&([...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())||el.matches('input,select,textarea'))).map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);
    for(const [el,size] of samples)el.style.fontSize=(size*2)+'px';
  });
  const bounds=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  await info.attach('doubled-text-bounds',{body:Buffer.from(JSON.stringify(bounds)),contentType:'application/json'});
  expect(bounds.scroll).toBeLessThanOrEqual(bounds.client+1);
});
