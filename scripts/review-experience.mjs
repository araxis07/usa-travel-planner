import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { preview } from 'vite';

const production = process.argv.includes('--production');
const server = production
  ? await preview({ preview: { host: '127.0.0.1', port: 5177, strictPort: true } })
  : null;
const origin = production ? 'http://127.0.0.1:5177' : 'http://127.0.0.1:5175';
const output = 'artifacts/v3.1';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = {
  production,
  environment:
    'Local Chromium, no CPU/network throttling; lab observations, not field Core Web Vitals.',
  views: [],
};
async function screenshot(page, name, fullPage = false) {
  await page.locator('img:visible').evaluateAll(async (images) => {
    await Promise.all(
      images
        .filter((img) => {
          const r = img.getBoundingClientRect();
          return r.top < innerHeight && r.bottom > 0;
        })
        .map((img) => img.decode().catch(() => {})),
    );
  });
  await page.screenshot({ path: `${output}/${name}.png`, fullPage });
}
try {
  for (const [name, viewport, lang] of [
    ['desktop', { width: 1440, height: 1000 }, 'en'],
    ['mobile', { width: 390, height: 844 }, 'th'],
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      window.__lab = { lcp: 0, cls: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__lab.lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) window.__lab.cls += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(`${origin}/${lang}/`);
    await page.locator('.hero h1').waitFor();
    await screenshot(page, `${name}-hero`);
    const lab = await page.evaluate(() => ({
      ...window.__lab,
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    for (const image of await page.locator('img[loading=lazy]').all())
      await image.scrollIntoViewIfNeeded();
    await page.evaluate(() => scrollTo(0, 0));
    await screenshot(page, `${name}-home`, true);
    await page.locator('#map').scrollIntoViewIfNeeded();
    await screenshot(page, `${name}-atlas`);
    await page.locator('.discovery-view-bar button').last().click();
    await page.locator('.wizard-panel').waitFor();
    await screenshot(page, `${name}-wizard`);
    await page.locator('.wizard-panel').getByRole('button').last().click();
    await page.locator('.wizard-panel').getByRole('button').last().click();
    await page.locator('.wizard-results article').first().getByRole('button').first().click();
    await page.locator('.day-activity').first().waitFor();
    await screenshot(page, `${name}-planner`, true);
    await page.locator('.planner-page-top > button').last().click();
    await page.locator('.library-panel').waitFor();
    await screenshot(page, `${name}-library`);
    await page.goto(`${origin}/${lang}/states/california/san-francisco/`);
    await page.locator('.destination-hero h1').waitFor();
    await screenshot(page, `${name}-destination`);
    const broken = await page
      .locator('.destination-page img')
      .evaluateAll((images) =>
        images.filter((i) => i.complete && !i.naturalWidth).map((i) => i.src),
      );
    report.views.push({ name, lang, viewport, ...lab, errors, broken });
    await page.close();
  }
  for (const lang of ['en', 'th', 'zh', 'ja', 'ko']) {
    const page = await browser.newPage({
      viewport: { width: 320, height: 760 },
      reducedMotion: 'reduce',
    });
    await page.goto(`${origin}/${lang}/`);
    await page.locator('.hero h1').waitFor();
    report.views.push({
      name: 'narrow',
      lang,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    });
    await page.close();
  }
  await fs.writeFile(`${output}/review.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.views.some((v) => v.overflow || v.errors?.length || v.broken?.length))
    throw Error('Visual review found an error; inspect review.json');
} finally {
  await browser.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
}
