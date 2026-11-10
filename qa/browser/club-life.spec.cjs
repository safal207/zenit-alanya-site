'use strict';
const {test,expect}=require('@playwright/test');
const path='club-life.html';

test('authentic gallery: three large local photos and thirteen intentional story cards',async({page})=>{
  await page.goto(path);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.story-card')).toHaveCount(13);
  await expect(page.locator('#results-count')).toContainText('6 из 13');
  await expect(page.locator('.story-cover')).toHaveCount(13);
  await expect(page.locator('.story-card:visible')).toHaveCount(6);
  await expect(page.locator('#show-more')).toBeVisible();
  await expect(page.locator('.photo-grid img')).toHaveCount(3);
  await expect(page.locator('#story-viewer')).not.toBeVisible();
  await expect(page.locator('#viewer-frame')).not.toHaveAttribute('src',/.+/);
  // No third-party Instagram iframe is loaded until a reader explicitly asks.
  await expect(page.locator('iframe[src*="instagram.com"]')).toHaveCount(0);
  for(const photo of await page.locator('.photo-grid img').all()){
    await photo.scrollIntoViewIfNeeded();
    await expect.poll(()=>photo.evaluate(img=>img.complete&&img.naturalWidth>0)).toBeTruthy();
  }
});

test('reader chooses video, can open its source and closes player without background playback',async({page})=>{
  await page.route('**/www.instagram.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<html><body>Original Instagram story</body></html>'}));
  await page.goto(path);
  await page.locator('[data-open="DcBg4iCK8BE"]').click();
  await expect(page.locator('#story-viewer')).toBeVisible();
  await expect(page.locator('#viewer-frame')).toHaveAttribute('src',/DcBg4iCK8BE\/embed\//);
  await expect(page.locator('#viewer-original')).toHaveAttribute('href','https://www.instagram.com/reel/DcBg4iCK8BE/');
  await page.locator('#viewer-close').click();
  await expect(page.locator('#story-viewer')).not.toBeVisible();
  await expect(page.locator('#viewer-frame')).not.toHaveAttribute('src',/.+/);
});

test('topics and Russian Turkish English copy remain functional',async({page})=>{
  await page.goto(path);
  await page.locator('[data-filter="keepers"]').click();
  await expect(page.locator('.story-card:visible')).toHaveCount(4);
  await page.locator('[data-filter="all"]').click();
  await expect(page.locator('.story-card:visible')).toHaveCount(6);
  await page.locator('#show-more').click();
  await expect(page.locator('.story-card:visible')).toHaveCount(13);
  await expect(page.locator('.archive-more')).toBeHidden();
  await page.locator('[data-lang="tr"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang','tr');
  await expect(page.locator('.section-heading h2').first()).toContainText('küçük');
  await page.locator('[data-lang="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page.locator('h1')).toContainText('A real team');
  await page.locator('[data-lang="ru"]').click();
  await expect(page.locator('h1')).toContainText('Настоящая команда');
});

test('age and experience only prepare a WhatsApp draft; no hidden submission',async({page})=>{
  await page.goto(path);
  const link=page.locator('#whatsapp');
  await expect(link).toHaveAttribute('target','_blank');
  await expect(link).toHaveAttribute('href',/^https:\/\/wa\.me\/905388899272\?text=/);
  await page.locator('input[name="age"][value="7–9"]').check();
  await page.locator('input[name="experience"][value="first"]').check();
  const href=await link.getAttribute('href');
  expect(decodeURIComponent(href)).toContain('7–9');
  expect(decodeURIComponent(href)).toContain('Начинает');
  await expect(page.locator('#contact-form input[type="text"]')).toHaveCount(0);
});

test('mobile viewports have no sideways scrolling or blocked controls',async({page},testInfo)=>{
  for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:820});
    await page.goto(path);
    await page.locator('img.hero-image').waitFor({state:'visible'});
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
    await expect(page.locator('[data-filter="all"]')).toBeVisible();
    await expect(page.locator('.mobile-action')).toHaveCount(0);
    await expect(page.locator('.story-card').first()).toBeVisible();
    if(width===390){
      await page.screenshot({path:testInfo.outputPath('gallery-390.png'),fullPage:false});
      await page.locator('#stories').scrollIntoViewIfNeeded();
      await page.screenshot({path:testInfo.outputPath('archive-390.png'),fullPage:false});
    }
  }
});

test('expired Instagram image has safe real-club photo fallback',async({page})=>{
  await page.goto(path);
  const image=page.locator('.story-card').first().locator('.story-cover');
  await expect(image).toHaveAttribute('data-fallback','assets/club-training-young.jpg');
  await image.evaluate(el=>el.dispatchEvent(new Event('error')));
  await expect(image).toHaveAttribute('src','assets/club-training-young.jpg');
  await expect.poll(()=>image.evaluate(el=>el.complete&&el.naturalWidth>0)).toBeTruthy();
});
