const {test,expect}=require('./fixtures.cjs');
const scheduleTexts={
  ru:{sat:'Суббота',chess:'Суббота · 14:00',senior:'Старшая группа · 12+',order:'Начинает сразу после детской и средней групп.'},
  tr:{sat:'Cumartesi',chess:'Cumartesi · 14:00',senior:'Büyük yaş grubu · 12+',order:'Çocuk ve orta yaş gruplarının ardından başlar.'},
  en:{sat:'Saturday',chess:'Saturday · 14:00',senior:'Older group · 12+',order:'Starts right after the younger and middle age groups finish.'}
};
for(const width of [320,390,768,1280])for(const theme of ['light','dark'])test('Schedule responsive and localized '+width+' '+theme,async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('./');
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('[data-theme-toggle]').click();
  await page.locator('#venue').scrollIntoViewIfNeeded();
  const cards=page.locator('.venue-program .venue-program-card');
  await expect(cards).toHaveCount(3);
  await expect(cards.last()).toHaveClass(/venue-program-card--senior/);
  await expect(page.locator('.venue-program-card--weekdays time')).toHaveText('18:00');
  await expect(page.locator('.venue-program-card--saturday .venue-program-time')).toHaveText('15:00–16:30');
  for(const [lang,labels]of Object.entries(scheduleTexts)){
    await page.locator('[data-lang='+lang+']').click();
    await expect(page.locator('html')).toHaveAttribute('lang',lang);
    await expect(page.locator('.venue-program-card--saturday [data-venue-locale]:visible')).toHaveText(labels.sat);
    await expect(page.locator('.venue-program-card--senior strong [data-venue-locale]:visible')).toHaveText(labels.senior);
    await expect(page.locator('.venue-program-card--senior .venue-program-tag [data-venue-locale]:visible')).toHaveText(labels.order);
    await expect(page.locator('.venue-chess-when [data-venue-locale]:visible')).toHaveText(labels.chess);
    const action=page.locator('.venue-chess a:visible');
    await expect(action).toHaveCount(1);
    await expect(action).toHaveAttribute('data-venue-locale',lang);
    await expect(action).toHaveAttribute('href',/^https:\/\/wa\.me\/905388899272\?text=/);
    const bounds=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.client+1);
  }
  if(width===390){
    await page.locator('[data-lang=ru]').click();
    await page.locator('#venue').screenshot({path:test.info().outputPath(`schedule-390-ru-${theme}.png`),style:'.header{visibility:hidden}'});
  }
});
