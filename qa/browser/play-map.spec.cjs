const {test,expect} = require('./fixtures.cjs');

test('Play zone gives each level a real football and chess challenge', async ({page},info) => {
  await page.setViewportSize({width:320,height:760});
  await page.goto('./?lang=ru#game');
  const zone = page.locator('#game');
  const football = zone.locator('[data-football-quest]');
  const chess = zone.locator('[data-chess-quest]');
  for (const img of await zone.locator('img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate(el => el.complete && el.naturalWidth > 0)).toBeTruthy();
  }
  for (const [label, mode, lesson] of [
    ['Малышам','dribble','lesson=develop'],
    ['Детям','shoot','lesson=fork'],
    ['Старшим 12+','match','level=9']
  ]) {
    const level = zone.getByRole('button',{name:label,exact:true});
    await level.click();
    await expect(level).toHaveAttribute('aria-pressed','true');
    await expect(football).toHaveAttribute('href','play/football.html?mode='+mode);
    await expect(chess).toHaveAttribute('href','play/chess.html?'+lesson);
  }
  await page.reload();
  await expect(zone.getByRole('button',{name:'Старшим 12+'})).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.setViewportSize({width:1280,height:860});
  await zone.getByRole('button',{name:'Детям',exact:true}).click();
  await zone.screenshot({path:info.outputPath('play-zone.png'),style:'.header{visibility:hidden}'});
  await zone.getByRole('button',{name:'Старшим 12+',exact:true}).click();
  await page.locator('[data-lang=en]').click();
  await expect(zone.getByRole('heading',{name:'Play zone'})).toBeVisible();
  await expect(chess).toHaveText('Play the chess bot →');
  await chess.click();
  await expect(page.locator('#chess-level')).toHaveValue('9');
});

test('Chess opens the selected mentor lesson and account links to the play zone', async ({page}) => {
  await page.goto('play/chess.html?lesson=fork');
  await expect(page.locator('[data-chess-mode=learn]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#lesson-select')).toHaveValue('fork');
  await expect(page.locator('#coach-heading')).toHaveText('Две угрозы одним ходом.');
  await page.goto('player.html?lang=en');
  const shortcut = page.locator('.play-shortcut');
  await expect(shortcut).toContainText('Play zone');
  await expect(shortcut).toHaveAttribute('href',/\?lang=en#game$/);
});
