import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { EMPTY_TRIP, STATES, type Trip } from '../data/travel';
import { validateTrip } from '../lib/storage';
import { validateLibrary } from '../lib/journeyLibrary';
import { dayTimeline } from '../lib/timeline';
import { ITINERARIES, itineraryTrip, starterTrip } from '../data/itineraries';
import { validateCollections } from '../lib/collections';
import { EXPERIENCE_COPY } from '../data/experience-copy';

test('all templates have complete valid days and five-language experience copy', () => {
  expect(ITINERARIES).toHaveLength(8);
  expect(
    starterTrip('CA-0', 4, 'en')
      .stops[0].activities!.filter((a) => a.day > 1)
      .some((a) => a.title === 'Transfer & settle in'),
  ).toBe(false);
  for (const route of ITINERARIES) {
    expect(route.codes.length).toBe(route.schedules.length);
    const trip = validateTrip(itineraryTrip(route, 'en'));
    trip.stops.forEach((s, i) => {
      expect(route.schedules[i]).toHaveLength(s.days);
      for (let day = 1; day <= s.days; day++) {
        const timeline = dayTimeline(s.activities!.filter((a) => a.day === day));
        expect(timeline.length).toBeGreaterThan(0);
        expect(timeline.some((a) => a.overlap)).toBe(false);
      }
    });
  }
  Object.values(EXPERIENCE_COPY).forEach((v) => {
    expect(v).toHaveLength(5);
    expect(v.every((s) => s.trim())).toBe(true);
  });
  STATES.forEach((s) => {
    expect(s.destinations.every((p) => p.planning?.months.length)).toBe(true);
  });
});

test('library and schedule validation reject corrupt data and retain new fields', () => {
  const trip: Trip = {
    ...EMPTY_TRIP,
    checklist: [{ id: 'documents', label: '', done: true }],
    stops: [
      {
        code: 'CA',
        days: 1,
        notes: '',
        activities: [
          {
            id: 'a',
            title: 'Morning',
            notes: '',
            day: 1,
            period: 'morning',
            minutes: 120,
            startTime: '09:00',
            bufferMinutes: 45,
          },
          {
            id: 'b',
            title: 'Too early',
            notes: '',
            day: 1,
            period: 'afternoon',
            minutes: 90,
            startTime: '10:00',
          },
        ],
      },
    ],
  };
  expect(validateTrip(trip)).toEqual(trip);
  expect(dayTimeline(trip.stops[0].activities!)[1].overlap).toBe(true);
  const saved = {
    version: 1,
    activeId: 'a',
    trips: [{ id: 'a', trip, archived: false, updatedAt: '2026-09-14T00:00:00Z' }],
  };
  expect(validateLibrary(saved).trips[0].trip).toEqual(trip);
  expect(() => validateLibrary({ ...saved, activeId: 'missing' })).toThrow();
  expect(() => validateLibrary({ ...saved, trips: [...saved.trips, ...saved.trips] })).toThrow();
  expect(() =>
    validateCollections({ groups: [{ id: 'bad/id', name: 'Bad', places: [] }] }),
  ).toThrow();
  for (const patch of [{ startTime: '25:00' }, { bufferMinutes: -1 }, { bufferMinutes: 400 }])
    expect(() =>
      validateTrip({
        ...trip,
        stops: [{ ...trip.stops[0], activities: [{ ...trip.stops[0].activities![0], ...patch }] }],
      }),
    ).toThrow();
});

test('multiple trips preserve edits, checklist, duplicates and archives across reload', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('roam.trip.v1'))
      localStorage.setItem(
        'roam.trip.v1',
        JSON.stringify({
          name: 'Original holiday',
          startDate: '',
          travelers: 2,
          dailyBudget: 150,
          stops: [{ code: 'CA', days: 2, notes: 'Keep this note' }],
        }),
      );
  });
  await page.goto('/en/?view=planner');
  await page.locator('.trip-checklist summary').click();
  await page
    .getByRole('checkbox', {
      name: 'Check passport and entry documents with the official authorities',
    })
    .check();
  await page.getByRole('button', { name: 'My trip library', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'My trip library' });
  await dialog.getByRole('button', { name: 'New trip', exact: true }).click();
  await page.getByRole('button', { name: 'Trip overview', exact: true }).click();
  await page.getByLabel('Trip name', { exact: true }).fill('Second holiday');
  await page.getByRole('button', { name: 'My trip library', exact: true }).click();
  await dialog
    .locator('.library-card')
    .filter({ hasText: 'Original holiday' })
    .getByRole('button', { name: 'Open', exact: true })
    .click();
  await page.getByRole('button', { name: 'Trip overview', exact: true }).click();
  await expect(page.getByLabel('Notes for California')).toHaveValue('Keep this note');
  await page.locator('.trip-checklist summary').click();
  await expect(
    page.getByRole('checkbox', {
      name: 'Check passport and entry documents with the official authorities',
    }),
  ).toBeChecked();
  await page.reload();
  await page.getByRole('button', { name: 'My trip library', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'My trip library' });
  await expect(dialog.locator('.library-card')).toHaveCount(2);
  await dialog
    .locator('.library-card')
    .filter({ hasText: 'Second holiday' })
    .getByRole('button', { name: 'Archive', exact: true })
    .click();
  await dialog.getByRole('button', { name: 'Archived trips', exact: true }).click();
  await expect(dialog.locator('.library-card')).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Restore', exact: true }).click();
  await dialog.getByRole('button', { name: 'Upcoming trips', exact: true }).click();
  await dialog
    .locator('.library-card')
    .filter({ hasText: 'Original holiday' })
    .getByRole('button', { name: 'Duplicate', exact: true })
    .click();
  await page.getByRole('button', { name: 'My trip library', exact: true }).click();
  await expect(dialog.locator('.library-card')).toHaveCount(3);
});

test('wizard explains car-free matches and creates a daily trip without losing the current one', async ({
  page,
}) => {
  await page.goto('/en/');
  await page.locator('.discovery-view-bar').getByRole('button', { name: 'Help me choose' }).click();
  const dialog = page.getByRole('dialog', { name: 'Help me choose' });
  await dialog.getByLabel('Trip length').fill('4');
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByLabel('Without a car', { exact: true }).check();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(dialog.locator('.wizard-results article')).toHaveCount(3);
  await expect(dialog.locator('.wizard-results article').first()).toContainText(
    'Transit-friendly base',
  );
  await dialog.getByRole('button', { name: 'Create a trip from this' }).first().click();
  await expect(page.locator('.day-strip button')).toHaveCount(4);
  await expect(page.locator('.day-activity')).toHaveCount(3);
  const library = await page.evaluate(() => JSON.parse(localStorage.getItem('roam.library.v1')!));
  expect(library.trips).toHaveLength(2);
});

test('place discovery filters, saves collections and opens a guide with its table of contents', async ({
  page,
  isMobile,
}) => {
  await page.goto('/en/');
  await page.locator('.discovery-view-bar').getByRole('button', { name: 'Places · 150' }).click();
  await page.getByLabel('Search destinations', { exact: true }).fill('San Francisco');
  await page.locator('.place-filter-row').getByLabel('Getting around').selectOption('transit');
  await expect(page.locator('.discovery-place')).toHaveCount(1);
  await page.getByRole('button', { name: 'Save place San Francisco', exact: true }).click();
  await page.locator('.discovery-place h3 button').click();
  await expect(page.locator('.guide-toc')).toBeVisible();
  await page.locator('.guide-toc').getByRole('link', { name: 'Before you go' }).click();
  await expect(page.locator('#guide-practical')).toBeInViewport();
  await expect(page.locator('.place-planning-facts')).toContainText('Transit-friendly base');
  await page.locator(isMobile ? '.bottom-nav button:nth-child(3)' : '.header-saved').click();
  await expect(page.locator('.collection-places')).toContainText('San Francisco');
  await page.locator('.collection-places').getByRole('checkbox', { name: 'Visited' }).check();
  await page.reload();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('roam.collections.v1')!).visited),
  ).toEqual(['CA-0']);
});

test('compact activity editors persist clock times, buffers and overlap warnings', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'roam.trip.v1',
      JSON.stringify({
        name: 'Timeline',
        startDate: '',
        travelers: 2,
        dailyBudget: 100,
        stops: [
          {
            code: 'CA',
            days: 2,
            notes: '',
            activities: [
              {
                id: 'a',
                title: 'San Francisco',
                placeId: 'CA-0',
                notes: '',
                day: 1,
                period: 'morning',
                minutes: 120,
              },
              {
                id: 'b',
                title: 'Big Sur',
                placeId: 'CA-2',
                notes: '',
                day: 1,
                period: 'afternoon',
                minutes: 120,
              },
            ],
          },
        ],
      }),
    ),
  );
  await page.goto('/en/?view=planner');
  const activity = page.locator('.day-activity').first();
  await expect(activity.locator('.activity-editor')).toBeHidden();
  await activity.getByRole('button', { name: 'Edit activity', exact: true }).click();
  await activity.getByLabel('Starts at', { exact: true }).fill('13:00');
  await activity.getByLabel('Transfer / rest buffer (minutes)').fill('60');
  const second = page.locator('.day-activity').nth(1);
  await second.getByRole('button', { name: 'Edit activity', exact: true }).click();
  await second.getByLabel('Starts at', { exact: true }).fill('14:00');
  await expect(
    page.getByText('Activities overlap or run past midnight. Adjust times or move an activity.'),
  ).toBeVisible();
  await expect(
    page.getByText(
      'These places are far apart. Check the transfer before keeping them on the same day.',
    ),
  ).toBeVisible();
  expect(
    (await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!))).stops[0]
      .activities[0],
  ).toMatchObject({ startTime: '13:00', bufferMinutes: 60 });
});

test('collection backup previews replacement, restores places and rejects unrelated JSON', async ({
  page,
  isMobile,
}) => {
  await page.goto('/en/');
  await page.locator(isMobile ? '.bottom-nav button:nth-child(3)' : '.header-saved').click();
  const section = page.locator('.place-collections');
  const input = section.locator('input[type=file]');
  await input.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, trip: {} })),
  });
  await expect(section.getByRole('alert')).toContainText('valid Roam collections');
  const backup = {
    version: 1,
    groups: [
      { id: 'someday', name: '', places: ['CA-0'] },
      { id: 'cities', name: 'City wishlist', places: ['NY-0'] },
    ],
    visited: ['CA-0'],
  };
  await input.setInputFiles({
    name: 'collections.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(section.locator('.collection-places article')).toHaveCount(0);
  await section.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(section.locator('.collection-places')).toContainText('San Francisco');
  await expect(section.getByRole('checkbox', { name: 'Visited' })).toBeChecked();
  await section.locator('.collection-toolbar select').selectOption('cities');
  await expect(section.locator('.collection-places')).toContainText('New York City');
  const download = page.waitForEvent('download');
  await section.getByRole('button', { name: 'Export backup', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('roam-collections.json');
  await page.reload();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('roam.collections.v1')!).groups),
  ).toEqual(backup.groups);
});

test('atlas zoom, reset, 3D illustration and new surfaces remain accessible', async ({ page }) => {
  await page.goto('/en/');
  await page.locator('#map').scrollIntoViewIfNeeded();
  const map = page.locator('.usa-map'),
    initial = await map.getAttribute('viewBox');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(map).not.toHaveAttribute('viewBox', initial!);
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect(map).toHaveAttribute('viewBox', initial!);
  await expect(page.locator('.landmark-scene')).toBeVisible();
  await page.locator('.discovery-view-bar').getByRole('button', { name: 'Help me choose' }).click();
  await expect(page.locator('.wizard-panel')).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .include('.wizard-panel')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
