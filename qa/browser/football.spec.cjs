const {test,expect}=require('./fixtures.cjs');
const AxeBuilder=require('@axe-core/playwright').default;
test('3D renderer starts, clock advances, pause and exercise switch',async({page},testInfo)=>{
  test.setTimeout(120000);await page.setViewportSize({width:640,height:360});await page.goto('play/football.html?mode=match');await expect(page.locator('#start-match')).toBeEnabled({timeout:60000});await page.locator('#start-match').click();await expect(page.locator('#arena-overlay')).toBeHidden();await expect.poll(()=>page.locator('#match-clock').innerText(),{timeout:45000}).not.toBe('02:00');
  await page.locator('#pause-button').click();await expect(page.locator('#pause-button')).toHaveText('▶');const clock=await page.locator('#match-clock').innerText();await page.waitForTimeout(1200);await expect(page.locator('#match-clock')).toHaveText(clock);await page.locator('#pause-button').click();await expect(page.locator('#pause-button')).toHaveText('Ⅱ');
  await page.locator('[data-mode=shoot]').click();await expect(page.locator('#start-match')).toBeEnabled();await page.locator('#start-match').click();await expect(page.locator('#shot-power-control')).toBeVisible();await page.locator('#shoot-ball').click();await expect(page.locator('#arena-message')).toContainText('Удар');await page.screenshot({path:testInfo.outputPath('football-rendered.png')});
});
test('Missing WebGL presents an actionable fallback',async({page})=>{await page.addInitScript(()=>{const real=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl|experimental-webgl/.test(type)?null:real.call(this,type,...args);};});await page.goto('play/football.html');await expect(page.locator('#arena-loading')).toContainText(/WebGL|3D|поддерж|браузер/i,{timeout:30000});await expect(page.locator('.arena-return')).toBeVisible();await expect(page.locator('#start-match')).toHaveAttribute('data-failed','true');await expect(page.locator('#start-match')).toContainText('ПОВТОРИТЬ');});

test('Active arena labels remain readable and clear of controls in both themes',async({page},testInfo)=>{
  test.setTimeout(180000);
  await page.setViewportSize({width:640,height:360});
  await page.goto('play/football.html?mode=shoot');
  await expect(page.locator('#start-match')).toBeEnabled({timeout:60000});
  await page.locator('#start-match').click();
  await page.locator('#pause-button').click();
  await expect(page.locator('#arena-overlay')).toBeHidden();
  for(const theme of ['light','dark']){
    if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('[data-theme-toggle]').click();
    for(const viewport of [{width:320,height:568},{width:390,height:844},{width:640,height:360}]){
      await page.setViewportSize(viewport);
      const layout=await page.evaluate(()=>{
        const footer=document.querySelector('.arena-footer'),note=footer.querySelector('.arena-disclaimer'),link=footer.querySelector('a');
        const box=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
        const style=getComputedStyle(note);
        return {footer:box(footer),note:box(note),link:box(link),joystick:box(document.querySelector('#joystick')),actions:box(document.querySelector('.action-buttons')),font:parseFloat(style.fontSize),background:getComputedStyle(footer).backgroundColor,viewport:{width:innerWidth,height:innerHeight},scroll:document.documentElement.scrollWidth};
      });
      await testInfo.attach(`arena-layout-${theme}-${viewport.width}`,{body:Buffer.from(JSON.stringify(layout)),contentType:'application/json'});
      expect(layout.font).toBeGreaterThanOrEqual(11);
      expect(layout.background).toBe('rgb(7, 52, 75)');
      expect(layout.footer.left).toBeGreaterThanOrEqual(0);
      expect(layout.footer.right).toBeLessThanOrEqual(viewport.width);
      expect(layout.footer.bottom).toBeLessThanOrEqual(viewport.height);
      expect(layout.scroll).toBeLessThanOrEqual(viewport.width);
      expect(layout.note.right+4).toBeLessThanOrEqual(layout.link.left);
      expect(layout.footer.top).toBeGreaterThanOrEqual(Math.max(layout.joystick.bottom,layout.actions.bottom)+8);
    }
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    await testInfo.attach(`arena-axe-${theme}`,{body:Buffer.from(JSON.stringify(axe,null,2)),contentType:'application/json'});
    expect(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
    await page.screenshot({path:testInfo.outputPath(`football-readable-${theme}.png`)});
  }
});
