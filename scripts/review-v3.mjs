import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const catalog = JSON.parse(await readFile('content/states.json', 'utf8'));
const photos = catalog.states.flatMap((s) =>
  s.photos.map((p) => ({ ...p, id: `${s.code}-${p.placeIndex}` })),
);
await mkdir('artifacts/v3', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1160 } });
  for (let i = 0; i < photos.length; i += 24) {
    const images = photos.slice(i, i + 24);
    const html = `<html><body style="margin:12px;font:13px sans-serif;background:#eee"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${images.map((p) => `<figure style="margin:0"><img src="${pathToFileURL(resolve('public' + p.src))}" style="width:100%;height:156px;object-fit:contain;background:#ddd"/><figcaption>${p.id} · ${p.src.split('/').pop()}</figcaption></figure>`).join('')}</div></body></html>`;
    const file = resolve(`artifacts/v3/photos-${i / 24}.html`);
    await writeFile(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.locator('img').evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
    await page.screenshot({ path: `artifacts/v3/photos-${i / 24}.png`, fullPage: true });
  }
} finally {
  await browser.close();
}
console.log('Photo review sheets captured:', Math.ceil(photos.length / 24));
