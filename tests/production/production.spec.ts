import { test, expect } from '@playwright/test';
import { EMPTY_TRIP, STATES, type Trip } from '../../data/travel';
import { LANGUAGES } from '../../lib/i18n';
import catalog from '../../content/states.json' with { type: 'json' };
const sample: Trip = {
  ...EMPTY_TRIP,
  name: 'My five-language journey',
  budgetMode: 'items',
  expenses: [
    { id: 'hotel', name: 'Hotel deposit', category: 'lodging', planned: 600.25, paid: 200.1 },
  ],
  startDate: '2026-10-01',
  stops: [
    {
      code: 'CA',
      days: 2,
      notes: 'Keep the train tickets',
      activities: [
        {
          id: 'offline-1',
          day: 2,
          period: 'afternoon',
          placeId: 'CA-1',
          title: 'Yosemite National Park',
          minutes: 240,
          notes: 'Camera · กล้อง · 相机 · カメラ · 카메라',
        },
      ],
    },
  ],
};

test('mobile home defers guide details and atlas while credits and practical guidance remain available', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(`${baseURL}/en/`);
  await page.locator('.hero-search input').waitFor();
  await page.waitForLoadState('networkidle');
  expect(
    requests.some((url) =>
      /\/(Atlas|LandmarkScene|atlas-geometry|photo-details|place-details)-/.test(url),
    ),
  ).toBe(false);
  expect(
    await page.locator('.hero-image').evaluate((image: HTMLImageElement) => image.currentSrc),
  ).toContain('hero-mobile-800.webp');
  expect(
    await page
      .locator('.destination-grid .card-image-button img')
      .first()
      .evaluate((image: HTMLImageElement) => image.currentSrc),
  ).toContain('-640.webp');
  await page.locator('.destination-grid .card-image-button').first().click();
  await expect(page.locator('.destination-hero h1')).toHaveText('California');
  await expect(page.locator('.destination-page > .photo-credit a').first()).toHaveAttribute(
    'href',
    /^https:\/\//,
  );
  await page.locator('.destination-gallery-open').click();
  await expect(page.locator('.photo-lightbox .photo-caption')).not.toBeEmpty();
  await expect(page.locator('.lightbox-footer a').first()).toHaveAttribute('href', /^https:\/\//);
  expect(requests.some((url) => /\/photo-details-/.test(url))).toBe(true);
  await page.goto(`${baseURL}/en/states/california/san-francisco/`);
  const profile = catalog.states[0].destinations[0];
  for (const [i, lang] of LANGUAGES.entries()) {
    await page.getByLabel('Language / ภาษา').selectOption(lang);
    await expect(page.locator('.practical-grid')).toContainText(profile.access[i]);
    await expect(page.locator('.practical-grid')).toContainText(profile.stay[i]);
    await expect(page.locator('.practical-links a').first()).toHaveAttribute(
      'href',
      profile.officialUrl,
    );
  }
  expect(requests.some((url) => /\/place-details-/.test(url))).toBe(true);
  await context.close();
});

test('corrected Mississippi photographs bypass previously saved Florida images', async ({
  page,
}) => {
  await page.goto('/en/states/mississippi/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const cache = await caches.open('roam-trip-photos-v1');
    for (const old of ['/images/states/ms-3.jpg', '/images/places/ms-2-3.jpg']) {
      await cache.put(
        old,
        new Response('old-photo', { headers: { 'Content-Type': 'image/jpeg' } }),
      );
    }
  });
  await page.reload();
  await page.locator('.place-story h3 a').nth(2).click();
  const images = page.locator('.destination-hero img, .place-gallery-strip img');
  await page.locator('.place-gallery-strip').scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      images.evaluateAll((items) =>
        items.every((item) => (item as HTMLImageElement).naturalWidth > 0),
      ),
    )
    .toBe(true);
  await expect(images.first()).toHaveAttribute('src', '/images/states/ms-3-horn-island.jpg');
  await expect(images.last()).toHaveAttribute('src', '/images/places/ms-2-3-davis-bayou.jpg');
});

test('all language pages contain readable content without JavaScript and reciprocal SEO links', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const ca = STATES.find((s) => s.code === 'CA')!;
  for (const [i, lang] of LANGUAGES.entries()) {
    await page.goto(`${baseURL}/${lang}/states/california/yosemite-national-park/`);
    await expect(page.locator('h1')).toHaveText(ca.placeNames[1][i]);
    await expect(page.locator('main')).toContainText(ca.destinations[1].summary[i]);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://roam.example/${lang}/states/california/yosemite-national-park/`,
    );
    await expect(page.locator('link[hreflang]')).toHaveCount(6);
    const json = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    );
    expect(json.geo.latitude).toBe(ca.destinations[1].coordinates[0]);
  }
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  await page.goto(`${baseURL}/en/states/california/big-sur/`);
  await expect(page.locator('main aside')).toContainText('September 2');
  expect(sitemap.match(/<loc>/g)).toHaveLength(1005);
  await context.close();
});

test('client navigation updates metadata and private planner is not indexed', async ({ page }) => {
  await page.goto('/en/states/california/san-francisco/');
  await page.getByLabel('Language / ภาษา').selectOption('ja');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    STATES[0].destinations[0].summary[3],
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://roam.example/ja/states/california/san-francisco/',
  );
  await page.locator('.header-trip').click();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test('saved itinerary and all selected state photos reopen offline; print covers every day in five languages', async ({
  page,
  context,
}, testInfo) => {
  await page.goto('/en/?view=planner');
  await page.evaluate(
    (value) => localStorage.setItem('roam.trip.v1', JSON.stringify(value)),
    sample,
  );
  await page.reload();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Activation can finish while the initial document is being replaced. Enter
  // the worker's scope on a fresh navigation before testing offline behavior.
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.getByRole('button', { name: 'Save for offline', exact: true }).click();
  await expect(page.getByText('Ready offline on this device.', { exact: false })).toBeVisible({
    timeout: 30000,
  });
  const cached = await page.evaluate(async () => {
    const all = await Promise.all(
      (await caches.keys()).map(async (key) =>
        (await (await caches.open(key)).keys()).map((r) => r.url),
      ),
    );
    return all.flat();
  });
  expect(cached.filter((u) => u.includes('/images/'))).toHaveLength(36);
  expect(
    cached.every((u) => u.startsWith(locationOrigin(testInfo.project.use.baseURL as string))),
  ).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#planner-page')).toBeVisible();
  for (const lang of LANGUAGES) {
    await page.getByLabel('Language / ภาษา').selectOption(lang);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.print-itinerary')).toBeVisible();
    await expect(page.locator('.print-day')).toHaveCount(2);
    await expect(page.locator('.print-budget')).toContainText('Hotel deposit');
    await expect(page.locator('.print-budget')).toContainText('400.15');
    await expect(page.locator('.print-itinerary')).toContainText(
      'Camera · กล้อง · 相机 · カメラ · 카메라',
    );
    const pdf = await page.pdf({
      path: testInfo.outputPath(`itinerary-${lang}.pdf`),
      format: 'A4',
      printBackground: true,
    });
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.byteLength).toBeGreaterThan(12000);
    await page.emulateMedia({ media: 'screen' });
  }
  await page.goto('/en/states/california/yosemite-national-park/');
  await expect(page.locator('h1')).toContainText('Yosemite');
  await expect(page.locator('.practical-grid')).toContainText(
    catalog.states[0].destinations[1].access[0],
  );
  const photos = STATES[0].photos.flatMap((p) => [
    p.src,
    ...[480, 640, 960].map((width) =>
      p.src
        .replace('/images/', '/images/responsive/')
        .replace(/\.(jpg|jpeg|png)$/, `-${width}.webp`),
    ),
  ]);
  expect(
    await page.evaluate(
      async (paths) =>
        Promise.all(
          paths.map(async (src) => {
            const image = new Image();
            image.src = src;
            await image.decode();
            return image.naturalWidth > 0;
          }),
        ),
      photos,
    ),
  ).toEqual(Array(36).fill(true));
  const invalid = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return new Promise((resolve) => {
      const c = new MessageChannel();
      c.port1.onmessage = (e) => {
        c.port1.close();
        resolve(e.data.ok);
      };
      reg.active!.postMessage(
        { type: 'SAVE_TRIP', photos: ['https://tile.openstreetmap.org/0/0/0.png'] },
        [c.port2],
      );
    });
  });
  expect(invalid).toBe(false);
  const capacity = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return Promise.all(
      [1800, 1801].map(
        (count) =>
          new Promise((resolve) => {
            const channel = new MessageChannel();
            channel.port1.onmessage = (event) => {
              channel.port1.close();
              resolve(event.data.ok);
            };
            reg.active!.postMessage(
              { type: 'SAVE_TRIP', photos: Array(count).fill('/images/states/ca-1.jpg') },
              [channel.port2],
            );
          }),
      ),
    );
  });
  expect(capacity).toEqual([true, false]);
});
function locationOrigin(url: string) {
  return new URL(url || 'http://127.0.0.1:5198').origin;
}
