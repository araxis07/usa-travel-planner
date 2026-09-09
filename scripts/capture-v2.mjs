import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('artifacts/v2', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1050 },
  reducedMotion: 'reduce',
});
for (const lang of ['en', 'th', 'zh', 'ja', 'ko']) {
  await page.goto('http://127.0.0.1:5173/?lang=' + lang);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `artifacts/v2/${lang}-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `artifacts/v2/${lang}-mobile.png` });
  await page.setViewportSize({ width: 1440, height: 1050 });
}
await page.locator('.destination-grid .card-image-button').first().click();
await page.screenshot({ path: 'artifacts/v2/gallery.png' });
await page.goto('http://127.0.0.1:5174/studio');
await page.getByRole('heading', { name: 'เรื่องราวของรัฐ' }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'artifacts/v2/studio-desktop.png' });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: 'artifacts/v2/studio-mobile.png', fullPage: true });
const c = JSON.parse(await fs.readFile('content/states.json', 'utf8'));
const codes = [
  'HI',
  'AL',
  'AR',
  'CT',
  'ID',
  'MI',
  'MS',
  'MO',
  'MT',
  'NH',
  'NC',
  'RI',
  'SC',
  'TN',
  'TX',
  'WV',
];
const selected = c.states
  .filter((s) => codes.includes(s.code))
  .flatMap((s) => s.photos.map((p) => ({ ...p, label: s.code + ' ' + s.places[p.placeIndex] })));
await page.setViewportSize({ width: 1100, height: 1400 });
const items = await Promise.all(
  selected.map(
    async (p) =>
      `<div><img src="data:image/jpeg;base64,${(await fs.readFile('public' + p.src)).toString('base64')}"><span>${p.label}</span></div>`,
  ),
);
await page.setContent(
  `<style>body{margin:0;display:grid;grid-template-columns:repeat(5,220px);font:12px Arial}img{width:216px;height:106px;object-fit:cover}span{display:block;height:32px}div{overflow:hidden}</style>${items.join('')}`,
);
await page.locator('img').evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
await page.screenshot({ path: 'artifacts/v2/photo-review.jpg', fullPage: true });
await browser.close();
console.log('Saved artifacts/v2 screenshots');
