import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import fs from 'node:fs/promises';

const server = await createServer({
  cacheDir: 'node_modules/.vite-journey-review',
  server: { host: '127.0.0.1', port: 5299, strictPort: true },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Visual reviews never crawl public map tiles or routing services.
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
  await page.route('https://routing.openstreetmap.de/**', (route) => route.abort());
  await fs.mkdir('artifacts/journey', { recursive: true });
  await page.goto('http://127.0.0.1:5299/?lang=th&state=california');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.destination-hero img').evaluate((img) => img.decode());
  await page.screenshot({ path: 'artifacts/journey/state-desktop.png' });
  await page.locator('.place-story').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/journey/state-content-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'artifacts/journey/state-mobile.png' });
  await page.locator('.gallery-open').click();
  await page.screenshot({ path: 'artifacts/journey/gallery-mobile.png' });
  await page.keyboard.press('Escape');
  await page.evaluate(() =>
    localStorage.setItem(
      'roam.trip.v1',
      JSON.stringify({
        name: 'Autumn on the coast',
        startDate: '2026-10-01',
        travelers: 2,
        dailyBudget: 150,
        stops: [
          {
            code: 'CA',
            days: 4,
            notes: 'A slow trip along the coast',
            activities: [
              {
                id: 'review-1',
                placeId: 'CA-0',
                title: 'San Francisco',
                day: 1,
                period: 'morning',
                minutes: 120,
                notes: 'Coffee and a walk by the waterfront',
              },
              {
                id: 'review-2',
                placeId: 'CA-2',
                title: 'Big Sur',
                day: 1,
                period: 'afternoon',
                minutes: 180,
                notes: 'Leave time for the viewpoints',
              },
              {
                id: 'review-3',
                title: 'Dinner with friends',
                day: 1,
                period: 'evening',
                minutes: 90,
                notes: 'Book a table for 7 pm',
              },
            ],
          },
        ],
      }),
    ),
  );
  await page.reload();
  await page.locator('.header-trip').click();
  await page.locator('.planner-tabs button').nth(1).click();
  await page.locator('.daily-planner').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/journey/planner-mobile.png' });
  await page.locator('.day-periods').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/journey/activities-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator('.daily-planner').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/journey/planner-desktop.png' });
  console.log(JSON.stringify({ screenshots: 'artifacts/journey', runtimeErrors: errors }));
  if (errors.length) throw new Error('Browser runtime errors');
} finally {
  await browser?.close();
  await server.close();
}
