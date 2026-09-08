import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const folder = process.env.CAPTURE_DIR || 'artifacts';
await mkdir(folder, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1080 },
  reducedMotion: 'reduce',
  locale: 'en-US',
});
await page.goto('http://127.0.0.1:5173/');
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${folder}/desktop-top.png` });
for (const section of ['destinations', 'map', 'road-trips', 'guides']) {
  await page.locator(`#${section}`).scrollIntoViewIfNeeded();
  await page.locator(`#${section}`).screenshot({ path: `${folder}/${section}.png` });
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: `${folder}/desktop-full.png`, fullPage: true });
await page.locator('.route-card').first().click();
await page.getByRole('button', { name: 'Make this my adventure' }).click();
await page.screenshot({ path: `${folder}/planner-desktop.png` });
await page.getByRole('button', { name: 'Close', exact: true }).click();
await page.evaluate(() => {
  localStorage.clear();
});
await page.reload();
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: `${folder}/mobile-top.png` });
await page.getByRole('button', { name: 'เปลี่ยนเป็นภาษาไทย' }).click();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${folder}/mobile-thai.png` });
await page.screenshot({ path: `${folder}/mobile-thai-full.png`, fullPage: true });
await page.locator('.header-trip').click();
await page.screenshot({ path: `${folder}/planner-mobile-thai.png` });
await browser.close();
console.log(`Screenshots saved to ${folder}/`);
