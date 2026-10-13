import { test, expect, chromium, webkit } from '@playwright/test';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { LANGUAGES } from '../../lib/i18n';
import { cityGuideTrip } from '../../lib/city-plan';
import { validateCityContent } from '../../lib/city-content';
import cityContent from '../../content/city-guides.json' with { type: 'json' };

for (const [engine, browserType] of [
  ['chromium', chromium],
  ['webkit', webkit],
] as const)
  test(`${engine} mobile offline navigation avoids home preloads and preserves editable trips in five languages`, async ({
    baseURL,
  }) => {
    test.setTimeout(90000);
    let unavailable = false;
    const server = createServer(async (req, res) => {
      if (unavailable) return req.socket.destroy();
      try {
        const upstream = await fetch(baseURL + req.url!, { signal: AbortSignal.timeout(15000) });
        res.writeHead(upstream.status, {
          'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
        });
        res.end(Buffer.from(await upstream.arrayBuffer()));
      } catch {
        res.writeHead(502).end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        reducedMotion: 'reduce',
      });
      const trip = cityGuideTrip(
        validateCityContent(cityContent).guides.find((g) => g.placeId === 'CA-0')!,
        3,
        'en',
      );
      trip.budgetMode = 'items';
      trip.expenses = [
        { id: 'hotel', name: 'Hotel deposit', category: 'lodging', planned: 600.25, paid: 200.1 },
      ];
      await page.addInitScript((trip) => {
        if (!localStorage.getItem('roam.trip.v1'))
          localStorage.setItem('roam.trip.v1', JSON.stringify(trip));
      }, trip);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(origin + '/en/?view=planner');
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload();
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      await page.locator('.planner-utility > summary').click();
      await page.getByRole('button', { name: 'Save for offline', exact: true }).click();
      await expect(page.getByText('Ready offline on this device.', { exact: false })).toBeVisible({
        timeout: 30000,
      });
      const requests: string[] = [];
      page.on('request', (request) => requests.push(request.url()));
      unavailable = true;
      for (const lang of LANGUAGES) {
        await page.goto(`${origin}/${lang}/?view=planner`);
        await expect(page.locator('.daily-planner')).toBeVisible();
        await expect(page.locator('link[as="image"]')).toHaveCount(0);
        if (lang === 'en') {
          await page.getByRole('button', { name: 'Edit activity', exact: true }).first().click();
          await page
            .getByRole('textbox', { name: /^Activity notes for/ })
            .first()
            .fill('Offline edit · แวะพัก');
          trip.stops[0].activities![0].notes = 'Offline edit · แวะพัก';
        }
        expect(
          await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!)),
        ).toEqual(trip);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
      expect(requests.some((url) => /hero(?:-mobile)?-\d+\.webp/.test(url))).toBe(false);
      expect(errors).toEqual([]);
      unavailable = false;
      await page.goto(origin + '/en/?view=planner');
      await expect(page.locator('.daily-planner')).toBeVisible();
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!))).toEqual(
        trip,
      );
    } finally {
      await browser.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
