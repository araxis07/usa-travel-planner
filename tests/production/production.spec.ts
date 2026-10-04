import { test, expect } from '@playwright/test';
import { EMPTY_TRIP, STATES, type Trip } from '../../data/travel';
import { LANGUAGES } from '../../lib/i18n';
import catalog from '../../content/states.json' with { type: 'json' };
import cityContent from '../../content/city-guides.json' with { type: 'json' };
import preparation from '../../content/travel-preparation.json' with { type: 'json' };
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
    serviceWorkers: 'allow',
  });
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(`${baseURL}/en/`);
  await page.locator('.hero-search input').waitFor();
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const cached = await page.evaluate(async () => {
    const name = (await caches.keys()).find((key) => key.startsWith('roam-shell-'))!;
    return (await (await caches.open(name)).keys()).map((request) => request.url);
  });
  expect(
    cached.some((url) =>
      /\/(Atlas|LandmarkScene|atlas-geometry|photo-details|place-details|TripPlanner|leaflet-src)-/.test(
        url,
      ),
    ),
  ).toBe(false);
  expect(requests.some((url) => new URL(url).pathname === '/images/hero.jpg')).toBe(false);
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
  const used = await page.evaluate(async () => {
    const name = (await caches.keys()).find((key) => key.startsWith('roam-shell-'))!;
    return (await (await caches.open(name)).keys()).map((request) => request.url);
  });
  expect(used.some((url) => /\/place-details-/.test(url))).toBe(true);
  await context.close();
});

test('new worker installs keep previously saved offline trips and photos available', async ({
  page,
  context,
}) => {
  await page.goto('/favicon.svg');
  await page.evaluate(async (trip) => {
    localStorage.setItem('roam.trip.v1', JSON.stringify(trip));
    const photos = await caches.open('roam-trip-photos-v1');
    await photos.put('/images/states/ca-1.jpg', await fetch('/images/states/ca-1.jpg'));
    const previous = await caches.open('roam-shell-previous-build');
    await previous.put('/index.html', new Response('previous build'));
  }, sample);
  await page.goto('/en/?view=planner');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const name = names.find((key) => key.startsWith('roam-shell-'))!;
    return { names, paths: (await (await caches.open(name)).keys()).map((request) => request.url) };
  });
  expect(cached.names).not.toContain('roam-shell-previous-build');
  expect(cached.paths.some((url) => /\/TripPrint-/.test(url))).toBe(true);
  expect(cached.paths.some((url) => /\/place-details-/.test(url))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#planner-page')).toBeVisible();
  await page.getByRole('button', { name: 'Daily plan', exact: true }).click();
  await page.locator('.day-strip button').nth(1).click();
  await expect(page.locator('.day-activity h5')).toHaveText('Yosemite National Park');
  expect(
    await page.evaluate(async () =>
      (await fetch('/images/states/ca-1.jpg')).headers.get('content-type'),
    ),
  ).toContain('image/');
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
    await expect(page.locator('main img')).toHaveAttribute('srcset', /\/images\/responsive\//);
    expect(
      await page.locator('main img').evaluate((img: HTMLImageElement) => img.currentSrc),
    ).toContain('/images/responsive/');
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

test('city plans, airport sources and budget breakdowns are published in all languages without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 740 },
  });
  const page = await context.newPage();
  for (const [city, path] of [
    'new-york/new-york-city',
    'california/san-francisco',
    'nevada/las-vegas',
  ].entries()) {
    const guide = cityContent.guides[city];
    for (const [l, lang] of LANGUAGES.entries()) {
      await page.goto(`http://127.0.0.1:5198/${lang}/states/${path}/`);
      await expect(page.locator('#guide-city')).toContainText(guide.intro[l]);
      await expect(page.locator('#guide-airport')).toContainText(guide.airport.fare[l]);
      await expect(page.locator('#guide-airport a').first()).toHaveAttribute(
        'href',
        guide.airport.sources[0].url,
      );
      await expect(page.locator('#guide-airport time').first()).toHaveAttribute(
        'datetime',
        guide.checkedAt,
      );
      await page.locator('.city-budget summary').first().click();
      await expect(page.locator('.city-budget').first().locator('dl > div')).toHaveCount(7);
      await expect(page.locator('#guide-city-budget')).toContainText(
        cityContent.copy.assumptions[l],
      );
    }
  }
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
  await expect(page.locator('#guide-booking')).toContainText(
    preparation.parks[0].sections[1].text[0],
  );
  await page.locator('#guide-booking details').nth(2).locator('summary').click();
  await expect(page.locator('#guide-booking details').nth(2)).toContainText('Half Dome');
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
  await page.goto('/th/states/california/san-francisco/');
  await expect(page.locator('#guide-city')).toContainText(cityContent.guides[1].intro[1]);
  await expect(page.locator('#guide-airport')).toContainText(cityContent.guides[1].airport.fare[1]);
  await page.locator('.city-budget summary').first().click();
  await expect(page.locator('.city-budget-total dd').first()).toContainText('800.00');
  await page.goto('/th/');
  await page.locator('.guide-card').first().click();
  await expect(page.locator('.guide-detail section')).toHaveCount(9);
  await expect(page.locator('.guide-detail')).toContainText(
    preparation.firstTrip.sections[6].text[1],
  );
  await page.keyboard.press('Escape');
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

test('generated park and preparation guides remain usable without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 740 },
  });
  const page = await context.newPage();
  const paths = [
    'california/yosemite-national-park',
    'utah/zion-national-park',
    'arizona/grand-canyon-south-rim',
    'colorado/rocky-mountain-national-park',
    'wyoming/yellowstone-national-park',
  ];
  for (const [l, lang] of LANGUAGES.entries()) {
    for (const [p, guide] of preparation.parks.entries()) {
      await page.goto(`${baseURL}/${lang}/states/${paths[p]}/`);
      const booking = page.locator('#guide-booking');
      await expect(booking.getByRole('heading')).toHaveText(preparation.copy.bookingTitle[l]);
      await expect(booking).toContainText(guide.checkedAt);
      for (const [i, section] of guide.sections.entries()) {
        const detail = booking.locator('details').nth(i);
        if (i > 1) await detail.locator('summary').press('Enter');
        await expect(detail).toHaveAttribute('open', '');
        await expect(detail).toContainText(section.text[l]);
        for (const [s, source] of section.sources.entries())
          await expect(detail.locator('a').nth(s)).toHaveAttribute('href', source.url);
      }
      if (guide.notice) await expect(booking.locator('aside')).toContainText(guide.notice.text[l]);
    }
    await page.goto(`${baseURL}/${lang}/`);
    const guide = page.locator('#guide-first-trip');
    await guide.locator('summary').press('Enter');
    await expect(guide).toHaveAttribute('open', '');
    await expect(guide.locator('h2')).toHaveCount(9);
    for (const section of preparation.firstTrip.sections)
      await expect(guide).toContainText(section.text[l]);
    await expect(guide.locator('time').last()).toHaveText(preparation.firstTrip.reviewAfter);
  }
  await context.close();
});
