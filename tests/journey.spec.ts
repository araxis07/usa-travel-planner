import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { EMPTY_TRIP, STATES, type Trip, type TripActivity } from '../data/travel';
import { validateTrip } from '../lib/storage';
import { slug } from '../lib/destinations';
import { translate, type Language } from '../lib/i18n';
const coordinates = STATES.flatMap((s) =>
  s.destinations.map((p) => ({ id: p.id, coordinates: p.coordinates, source: p.locationSource })),
);

const activity: TripActivity = {
  id: 'activity-1',
  day: 1,
  period: 'morning',
  placeId: 'CA-0',
  title: 'San Francisco',
  minutes: 120,
  notes: 'Bring camera',
};
const trip: Trip = {
  ...EMPTY_TRIP,
  name: 'A California week',
  startDate: '2026-10-01',
  stops: [
    {
      code: 'CA',
      days: 2,
      notes: 'Train tickets',
      activities: [
        activity,
        {
          ...activity,
          id: 'activity-2',
          placeId: 'CA-2',
          title: 'Big Sur',
          notes: '',
          minutes: 180,
        },
      ],
    },
  ],
};
async function seed(page: Page) {
  await page.goto('/?lang=en');
  await page.evaluate((value) => localStorage.setItem('roam.trip.v1', JSON.stringify(value)), trip);
  await page.reload();
  await page.locator('.header-trip').click();
  await page.getByRole('button', { name: 'Daily plan', exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  // Public OSM tiles must never be crawled by automated browser tests.
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z8WAAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  );
  await page.route('https://routing.openstreetmap.de/**', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable in tests' }),
  );
});
test('all 150 places have traceable map coordinates and unique shareable slugs', () => {
  expect(coordinates).toHaveLength(150);
  expect(new Set(coordinates.map((p) => p.id)).size).toBe(150);
  expect(new Set(STATES.map((s) => slug(s.name))).size).toBe(50);
  for (const s of STATES) {
    expect(new Set(s.places.map(slug)).size).toBe(3);
    s.places.forEach((_, index) => {
      const p = coordinates.find((p) => p.id === `${s.code}-${index}`)!;
      expect(p.coordinates).toHaveLength(2);
      expect(p.coordinates![0]).toBeGreaterThan(18);
      expect(p.coordinates![0]).toBeLessThan(72);
      expect(p.coordinates![1]).toBeGreaterThan(-180);
      expect(p.coordinates![1]).toBeLessThan(-60);
      expect(p.source).toMatch(
        /^https:\/\/(en\.wikipedia\.org|www\.wikidata\.org|www\.nps\.gov|californiacoastaltrail\.org)\//,
      );
    });
  }
});
test('trip validation preserves old backups and rejects corrupt daily schedules', () => {
  expect(validateTrip(trip)).toEqual(trip);
  const legacy = { ...EMPTY_TRIP, stops: [{ code: 'CA', days: 3, notes: 'Keep this' }] };
  expect(validateTrip(legacy)).toEqual(legacy);
  for (const fields of [
    { day: 3 },
    { day: 0 },
    { minutes: 0 },
    { minutes: Infinity },
    { period: 'midnight' },
    { placeId: 'XX-0' },
    { placeId: 'CA-3' },
    { id: '<script>' },
    { title: '' },
    { notes: 'a'.repeat(501) },
  ]) {
    expect(() =>
      validateTrip({
        ...trip,
        stops: [{ ...trip.stops[0], activities: [{ ...activity, ...fields }] }],
      }),
    ).toThrow();
  }
  expect(() =>
    validateTrip({ ...trip, stops: [{ ...trip.stops[0], activities: [activity, activity] }] }),
  ).toThrow();
  expect(() =>
    validateTrip({
      ...trip,
      stops: [trip.stops[0], { code: 'NY', days: 2, notes: '', activities: [activity] }],
    }),
  ).toThrow();
});
test('full state and place pages support links, reloads, sharing fallback and browser history', async ({
  page,
}) => {
  await page.goto('/?lang=en');
  await page.getByRole('link', { name: 'Open full guide California', exact: true }).click();
  await expect(page).toHaveURL(/states\/california/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('California');
  await page.locator('.place-story h3 a').nth(1).click();
  await expect(page).toHaveURL(/yosemite-national-park/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Yosemite National Park');
  await page.reload();
  await expect(page).toHaveTitle('Yosemite National Park — Roam America');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Denied')) },
      configurable: true,
    });
  });
  await page.getByRole('button', { name: 'Share this guide' }).click();
  await expect(page.getByLabel('Copy this link')).toHaveValue(/yosemite-national-park/);
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('California');
  await page.goBack();
  await expect(page.locator('#destinations')).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('California');
  await page.locator('.header .brand').click();
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page).not.toHaveURL(/state=/);
});
test('fullscreen gallery handles keyboard, zoom, swipe and nested-dialog focus', async ({
  page,
  isMobile,
}) => {
  await page.goto('/?lang=en');
  await page.getByRole('button', { name: 'Explore California', exact: true }).click();
  const quick = page.getByRole('dialog', { name: 'California', exact: true });
  await quick.getByRole('button', { name: 'View fullscreen' }).click();
  const gallery = page.getByRole('dialog', { name: 'Fullscreen gallery' });
  const first = await gallery.locator('img').getAttribute('src');
  await page.keyboard.press('ArrowRight');
  await expect(gallery.locator('img')).not.toHaveAttribute('src', first!);
  await gallery.getByRole('button', { name: 'Zoom photo' }).click();
  await expect(gallery.locator('.lightbox-stage')).toHaveClass(/is-zoomed/);
  await gallery.getByRole('button', { name: 'Zoom photo' }).click();
  if (isMobile) {
    const before = await gallery.locator('img').getAttribute('src');
    await gallery.locator('.lightbox-stage').evaluate((element) => {
      element.dispatchEvent(
        new TouchEvent('touchstart', {
          bubbles: true,
          touches: [new Touch({ identifier: 1, target: element, clientX: 280, clientY: 250 })],
        }),
      );
      element.dispatchEvent(
        new TouchEvent('touchend', {
          bubbles: true,
          changedTouches: [
            new Touch({ identifier: 1, target: element, clientX: 100, clientY: 260 }),
          ],
        }),
      );
    });
    await expect(gallery.locator('img')).not.toHaveAttribute('src', before!);
  }
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
  await expect(quick).toBeVisible();
  await expect(quick.getByRole('button', { name: 'View fullscreen' })).toBeFocused();
  await quick.getByRole('link', { name: 'Open full guide' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('California');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});
test('a destination adds to daily planning and custom activities survive export, import and reload', async ({
  page,
}) => {
  await page.goto('/?lang=en&state=california&place=san-francisco');
  await page.locator('.place-story').getByRole('button', { name: 'Add to daily plan' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add activity', exact: true }).click();
  const dialog = page.locator('#planner-page');
  await expect(dialog.getByRole('button', { name: 'Daily plan', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(dialog.locator('.day-activity h5')).toHaveText('San Francisco');
  await page.locator('.add-activity-toggle').click();
  await page.getByLabel('Choose a place or custom activity').selectOption('custom');
  await page.getByLabel('Activity name', { exact: true }).fill('Picnic with friends');
  await page.locator('.add-activity').getByLabel('Time of day').selectOption('afternoon');
  await page
    .locator('.add-activity')
    .getByRole('button', { name: 'Add activity', exact: true })
    .click();
  await page
    .locator('.day-activity')
    .filter({ hasText: 'Picnic with friends' })
    .getByRole('button', { name: 'Edit activity', exact: true })
    .click();
  const rename = page.getByLabel('Rename activity Picnic with friends');
  await rename.fill('');
  await expect(rename).toHaveValue('');
  await rename.press('Tab');
  await expect(rename).toHaveValue('Picnic with friends');
  await page
    .getByLabel('Activity notes for Picnic with friends')
    .fill('Bring sandwiches & a blanket');
  await page.getByLabel('Day for Picnic with friends', { exact: true }).selectOption('2');
  await page.locator('.day-strip button').nth(1).click();
  await expect(page.locator('.day-activity h5')).toHaveText('Picnic with friends');
  const backupPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup', exact: true }).click();
  const backup = await backupPromise;
  const data = JSON.parse(readFileSync((await backup.path())!, 'utf8'));
  expect(data.version).toBe(2);
  expect(data.trip.stops[0].activities[1]).toMatchObject({
    title: 'Picnic with friends',
    day: 2,
    period: 'afternoon',
    notes: 'Bring sandwiches & a blanket',
  });
  const textPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my itinerary' }).click();
  const textFile = await textPromise;
  expect(readFileSync((await textFile.path())!, 'utf8')).toContain(
    'Day 2 · Afternoon · Picnic with friends',
  );
  await page.getByLabel('Import trip file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.getByRole('button', { name: 'Replace with this trip' }).click();
  await page.reload();
  await page.locator('.header-trip').click();
  await page.getByRole('button', { name: 'Daily plan', exact: true }).click();
  await page.locator('.day-strip button').nth(1).click();
  await expect(page.getByLabel('Activity notes for Picnic with friends')).toHaveValue(
    'Bring sandwiches & a blanket',
  );
});
test('activities reorder, move between time slots and protect occupied days from truncation', async ({
  page,
  isMobile,
}) => {
  await seed(page);
  await page.getByRole('button', { name: 'Move activity down San Francisco' }).click();
  await expect(page.locator('.day-activity h5').first()).toHaveText('Big Sur');
  if (!isMobile) {
    // Start the native drag before scrolling to a time slot below the viewport.
    const handle = page.locator('.activity-drag').first();
    const target = page.getByRole('region', { name: 'Evening', exact: true });
    await handle.hover();
    const box = (await handle.boundingBox())!;
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 15, box.y + box.height / 2, { steps: 5 });
    await target.scrollIntoViewIfNeeded();
    await target.hover();
    await target.hover();
    await page.mouse.up();
    await expect(
      page.getByRole('region', { name: 'Evening', exact: true }).locator('h5'),
    ).toHaveText('Big Sur');
  } else {
    await page
      .locator('.day-activity')
      .filter({ hasText: 'Big Sur' })
      .getByRole('button', { name: 'Edit activity', exact: true })
      .click();
    await page.getByLabel('Time slot for Big Sur').selectOption('evening');
  }
  const editBigSur = page
    .locator('.day-activity')
    .filter({ hasText: 'Big Sur' })
    .getByRole('button', { name: 'Edit activity', exact: true });
  if (await editBigSur.count()) await editBigSur.click();
  await page.getByLabel('Day for Big Sur', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Trip overview', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fewer days in California' })).toBeDisabled();
  await expect(
    page.getByText(
      'To shorten a state stay, first move or remove activities on its last day in the daily plan.',
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Daily plan', exact: true }).click();
  await page.locator('.day-strip button').nth(1).click();
  await expect(page.getByRole('region', { name: 'Evening', exact: true }).locator('h5')).toHaveText(
    'Big Sur',
  );
});
test('route requests are explicit, show real response values, fail safely and clear after edits', async ({
  page,
}) => {
  let requests = 0;
  await page.route('https://routing.openstreetmap.de/**', (route) => {
    requests++;
    return requests === 1
      ? route.fulfill({ status: 503, body: 'offline' })
      : route.fulfill({
          json: {
            code: 'Ok',
            routes: [
              {
                distance: 280000,
                duration: 12600,
                geometry: {
                  coordinates: [
                    [-122.41638889, 37.7775],
                    [-121.8, 36.27],
                  ],
                },
              },
            ],
          },
        });
  });
  await seed(page);
  expect(requests).toBe(0);
  const mapSwitch = page
    .locator('.mobile-workspace-switch')
    .getByRole('button', { name: 'Map', exact: true });
  if (await mapSwitch.isVisible()) await mapSwitch.click();
  await page.getByRole('button', { name: 'Calculate driving route' }).click();
  await expect(page.getByRole('alert')).toContainText('No driving route');
  await page.getByRole('button', { name: 'Calculate driving route' }).click();
  await expect(page.locator('.route-result')).toContainText('280 km · 210 minutes driving');
  await expect(page.locator('.route-result')).toContainText('510 minutes');
  await expect(page.locator('.route-pin')).toHaveCount(2);
  const listSwitch = page
    .locator('.mobile-workspace-switch')
    .getByRole('button', { name: 'List', exact: true });
  if (await listSwitch.isVisible()) await listSwitch.click();
  await page
    .locator('.day-activity')
    .filter({ hasText: 'Big Sur' })
    .getByRole('button', { name: 'Edit activity', exact: true })
    .click();
  await page.getByLabel('Day for Big Sur', { exact: true }).selectOption('2');
  if (await mapSwitch.isVisible()) await mapSwitch.click();
  await expect(page.locator('.route-result')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Calculate driving route' })).toBeDisabled();
  expect(requests).toBe(2);
});
test('five-language full guides and daily plans remain readable and accessible', async ({
  page,
}) => {
  for (const lang of ['en', 'th', 'zh', 'ja', 'ko'] as Language[]) {
    await page.goto(`/?lang=${lang}&state=california&place=yosemite-national-park`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      STATES[0].placeNames[1][['en', 'th', 'zh', 'ja', 'ko'].indexOf(lang)],
    );
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page
      .locator('.place-story')
      .getByRole('button', { name: translate('Add to daily plan', 'เพิ่มในแผนรายวัน', lang) })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: translate('Add activity', 'เพิ่มกิจกรรม', lang), exact: true })
      .click();
    await page.setViewportSize({ width: 320, height: 950 });
    const daily = page.locator('.daily-planner');
    await expect(daily.locator('h5').first()).toContainText(
      STATES[0].placeNames[1][['en', 'th', 'zh', 'ja', 'ko'].indexOf(lang)],
    );
    expect(await daily.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  }
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ target: n.target, message: n.failureSummary })),
    })),
  ).toEqual([]);
  await page.locator('.planner-page-top > .text-link').click();
  const guide = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    guide.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ target: n.target, message: n.failureSummary })),
    })),
  ).toEqual([]);
});
test('mobile bottom navigation reaches the map, saved places and daily trip', async ({
  page,
  isMobile,
}) => {
  await page.goto('/?lang=en&state=california');
  const nav = page.getByRole('navigation', { name: 'Quick navigation' });
  if (!isMobile) {
    await expect(nav).toBeHidden();
    return;
  }
  await nav.getByRole('button', { name: 'Map', exact: true }).click();
  await expect(page).not.toHaveURL(/state=/);
  await expect(nav.getByRole('button', { name: 'Map', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await nav.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Saved places' })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await nav.getByRole('button', { name: 'My trip', exact: true }).click();
  await expect(page.locator('#planner-page')).toBeVisible();
});
