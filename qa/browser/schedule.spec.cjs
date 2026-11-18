const {test,expect}=require('./fixtures.cjs');
const scheduleTexts={ru:{sat:'Суббота · 15:00–16:30',senior:'Старшая группа · 12+'},tr:{sat:'Cumartesi · 15:00–16:30',senior:'Büyük yaş grubu · 12+'},en:{sat:'Saturday · 15:00–16:30',senior:'Older group · 12+'}};
for(const width of [320,390,768,1280])for(const theme of ['light','dark'])test('Schedule responsive and localized '+width+' '+theme,async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('./');
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('[data-theme-toggle]').click();
  await page.locator('#venue').scrollIntoViewIfNeeded();
  await expect(page.locator('.venue-program .venue-program-card')).toHaveCount(3);
  for(const [lang,labels]of Object.entries(scheduleTexts)){
    await page.locator('[data-lang='+lang+']').click();
    await expect(page.locator('html')).toHaveAttribute('lang',lang);
    await expect(page.locator('.venue-program-card--saturday [data-venue-locale='+lang+']').filter({hasText:labels.sat})).toBeVisible();
    await expect(page.locator('.venue-program-card--senior [data-venue-locale='+lang+']').filter({hasText:labels.senior})).toBeVisible();
    const bounds=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.client+1);
  }
  if(width===390&&theme==='light'){await page.locator('[data-lang=ru]').click();await page.locator('#venue').screenshot({path:test.info().outputPath('schedule-390-ru.png')});}
});
