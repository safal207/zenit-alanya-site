const {test,expect}=require('./fixtures.cjs');
const AxeBuilder=require('@axe-core/playwright').default;
async function scan(page,testInfo){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();await testInfo.attach('axe-results',{body:Buffer.from(JSON.stringify(result,null,2)),contentType:'application/json'});expect(result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);}
for(const route of ['','stories.html','journey.html','play/chess.html','play/football.html'])for(const theme of ['light','dark'])test(`Accessibility ${route||'home'} ${theme}`,async({page},testInfo)=>{await page.goto(route||'./');await expect(page.locator('h1')).toBeVisible();if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('[data-theme-toggle]').click();await scan(page,testInfo);});
for(const theme of ['light','dark'])test(`Accessibility of open enquiry ${theme}`,async({page},testInfo)=>{await page.setViewportSize({width:390,height:844});await page.goto('./');if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('[data-theme-toggle]').click();await page.locator('[name=age]').fill('7');await page.locator('[name=experience]').selectOption('regular');await page.locator('#funnel-next').click();await page.locator('#funnel-preview').click();await expect(page.locator('#message-dialog')).toBeVisible();await scan(page,testInfo);});
for(const width of [320,390,768,1280])for(const route of ['','stories.html','journey.html','play/chess.html'])test(`Responsive bounds ${width} ${route||'home'}`,async({page},testInfo)=>{await page.setViewportSize({width,height:844});await page.goto(route||'./');await expect(page.locator('h1')).toBeVisible();await page.evaluate(()=>document.fonts.ready);const bounds=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));await testInfo.attach('layout',{body:Buffer.from(JSON.stringify(bounds)),contentType:'application/json'});expect(bounds.scroll).toBeLessThanOrEqual(bounds.client+1);});


for(const theme of ['light','dark'])test('Accessibility of direct WhatsApp enquiry step '+theme,async({page},testInfo)=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('./');
 if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('[data-theme-toggle]').click();
 await page.locator('[name=age]').fill('7');
 await page.locator('[name=experience]').selectOption('regular');
 await page.locator('#funnel-next').click();
 await expect(page.locator('#funnel-create')).toBeVisible();
 await expect(page.locator('#message-dialog')).not.toBeVisible();
 await scan(page,testInfo);
});
