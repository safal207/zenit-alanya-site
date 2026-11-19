const {test,expect}=require('./fixtures.cjs');
test('Block figures load into playable football match',async({page},info)=>{
 test.setTimeout(120000);await page.setViewportSize({width:640,height:360});await page.goto('play/football.html?mode=shoot');
 await expect(page.locator('#start-match')).toBeEnabled({timeout:65000});await expect(page.locator('body')).toHaveAttribute('data-player-style','block-football');
 await page.locator('#start-match').click();await expect(page.locator('#arena-overlay')).toBeHidden();
 await page.locator('#shoot-ball').click();await expect(page.locator('#arena-message')).toContainText('Удар');await page.screenshot({path:info.outputPath('block-football.png')});
});
