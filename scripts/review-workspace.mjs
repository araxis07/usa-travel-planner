import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { preview } from 'vite';
const output = 'artifacts/v3.2';
const screensOnly = process.argv.includes('--screens-only');
await fs.mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5177, strictPort: true } });
const browser = await chromium.launch();
const report = {
  environment:
    'Local production build. Cold Chromium cache, 4× CPU slowdown, 1.6 Mbps download / 750 Kbps upload, 150 ms latency. Lab measurements, not field Core Web Vitals or physical-phone results.',
  runs: screensOnly ? JSON.parse(await fs.readFile(`${output}/review.json`, 'utf8')).runs : [],
  screens: [],
};
try {
  for (let run = 0; run < (screensOnly ? 0 : 3); run++) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      deviceScaleFactor: 3,
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: 1600000 / 8,
      uploadThroughput: 750000 / 8,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.__lab = {
        lcp: 0,
        cls: 0,
        maxSession: 0,
        sessionValue: 0,
        sessionStart: 0,
        lastShift: 0,
      };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__lab.lcp = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        const m = window.__lab;
        for (const e of list.getEntries()) {
          if (e.hadRecentInput) continue;
          if (e.startTime - m.lastShift > 1000 || e.startTime - m.sessionStart > 5000) {
            m.sessionStart = e.startTime;
            m.sessionValue = 0;
          }
          m.sessionValue += e.value;
          m.lastShift = e.startTime;
          m.cls = Math.max(m.cls, m.sessionValue);
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('http://127.0.0.1:5177/en/', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    report.runs.push(
      await page.evaluate(() => ({
        lcpMs: window.__lab.lcp,
        cls: window.__lab.cls,
        fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        transferBytes: performance
          .getEntriesByType('resource')
          .reduce((n, e) => n + e.transferSize, 0),
        hero: document.querySelector('.hero img')?.currentSrc,
        overflow: document.documentElement.scrollWidth > innerWidth,
      })),
    );
    await context.close();
  }
  await fs.writeFile(`${output}/review.json`, JSON.stringify(report, null, 2));
  for (const [name, width, lang] of [
    ['desktop', 1440, 'en'],
    ['mobile', 390, 'th'],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() =>
      localStorage.setItem(
        'roam.trip.v1',
        JSON.stringify({
          name: 'Pacific holiday',
          startDate: '2026-10-01',
          travelers: 2,
          dailyBudget: 150,
          budgetMode: 'items',
          expenses: [
            {
              id: 'hotel',
              name: 'Hotel deposit',
              category: 'lodging',
              planned: 600.25,
              paid: 200.1,
            },
            {
              id: 'flights',
              name: 'Flights for two',
              category: 'flight',
              planned: 800.5,
              paid: 800.5,
            },
          ],
          stops: [
            {
              code: 'CA',
              days: 3,
              notes: '',
              activities: [
                {
                  id: 'a',
                  title: 'San Francisco',
                  placeId: 'CA-0',
                  day: 1,
                  period: 'morning',
                  minutes: 180,
                  notes: '',
                },
              ],
            },
          ],
        }),
      ),
    );
    await page.goto(`http://127.0.0.1:5177/${lang}/`);
    for (const code of ['CA', 'NY', 'AZ']) {
      await page.locator('.map-select select').selectOption(code);
      await page.locator('.landmark-scene').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/${name}-scene-${code}.png` });
    }
    await page.locator('.header-trip').click();
    await page.locator('.planner-tabs button').nth(2).click();
    await page.locator('.expense-row').first().waitFor();
    await page.screenshot({ path: `${output}/${name}-budget.png`, fullPage: true });
    await page.locator('.planner-tabs button').nth(1).click();
    await page.screenshot({ path: `${output}/${name}-planner.png`, fullPage: true });
    await page.locator('.planner-page-top > button').last().click();
    await page.locator('.workspace-backup summary').click();
    await page.screenshot({ path: `${output}/${name}-backup.png` });
    report.screens.push({
      name,
      lang,
      errors,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    });
    await page.close();
  }
  await fs.writeFile(`${output}/review.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
