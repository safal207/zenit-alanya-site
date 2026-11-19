const {test,expect}=require('./fixtures.cjs');
const text={ru:'Главная',tr:'Ana sayfa',en:'Home'};
for(const width of [320,390,768,1280])for(const theme of ['light','dark'])test('Club dock '+width+' '+theme,async({page},info)=>{
 await page.setViewportSize({width,height:844});await page.goto('./');const nav=page.locator('[data-zenit-nav]');await expect(nav).toBeVisible();await expect(nav.locator('a')).toHaveCount(5);
 if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('[data-theme-toggle]').click();
 for(const lang of Object.keys(text)){await page.locator('[data-lang='+lang+']').click();await expect(nav.locator('[data-nav-key=home] .zenit-nav-label')).toHaveText(text[lang]);}
 await page.locator('[data-lang=ru]').click();
 const bounds=await page.evaluate(()=>{const r=document.querySelector('[data-zenit-nav]').getBoundingClientRect();return {left:r.left,right:r.right,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth};});
 expect(bounds.left).toBeGreaterThanOrEqual(-1);expect(bounds.right).toBeLessThanOrEqual(width+1);expect(bounds.scroll).toBeLessThanOrEqual(bounds.client+1);
 await nav.locator('[data-nav-key=game]').click();await expect(page).toHaveURL(/#game$/);await expect(nav.locator('[data-nav-key=game]')).toHaveAttribute('aria-current','location');
 if(width===390&&theme==='light')await nav.screenshot({path:info.outputPath('mobile-dock.png')});
 if(width===1280&&theme==='light')await nav.screenshot({path:info.outputPath('desktop-rail.png')});
});
