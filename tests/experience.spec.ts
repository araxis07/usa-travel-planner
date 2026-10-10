import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { EMPTY_TRIP, STATES, type Trip } from '../data/travel';
import { validateTrip } from '../lib/storage';
import { validateLibrary } from '../lib/journeyLibrary';
import { dayTimeline } from '../lib/timeline';
import { ITINERARIES, itineraryTrip, starterTrip } from '../data/itineraries';
import { validateCollections } from '../lib/collections';
import { EXPERIENCE_COPY, x } from '../data/experience-copy';
import { cityGuideTrip, findCityGuide } from '../components/CityGuide';

const CITY_PLAN_CASES = [
  ['NY-0', 'new-york/new-york-city'],
  ['CA-0', 'california/san-francisco'],
  ['NV-0', 'nevada/las-vegas'],
  ['MA-0', 'massachusetts/boston'],
  ['IL-0', 'illinois/chicago'],
  ['PA-0', 'pennsylvania/philadelphia'],
] as const;

test('all templates have complete valid days and five-language experience copy', () => {
  expect(ITINERARIES).toHaveLength(9);
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
  for (const lang of ['en', 'th', 'zh', 'ja', 'ko'] as const) {
    const rail = validateTrip(
      itineraryTrip(
        ITINERARIES.find((route) => route.id === 'northeast-rail')!,
        lang,
      ),
    );
    expect(rail.stops.map((stop) => [stop.code, stop.days])).toEqual([
      ['MA', 3],
      ['NY', 4],
      ['PA', 2],
    ]);
    expect(
      rail.stops
        .flatMap((stop) => stop.activities!)
        .every((activity) => activity.startTime === undefined),
    ).toBe(true);
    for (const [i, leg] of [
      [1, 'BOS → NYP'],
      [2, 'NYP → PHL'],
    ] as const) {
      const arrival = rail.stops[i].activities!.filter((activity) => activity.day === 1);
      expect(arrival.map((activity) => activity.placeId)).toEqual([
        undefined,
        undefined,
        undefined,
        undefined,
      ]);
      expect(arrival[0].title).toContain(leg);
      expect(arrival[0].minutes).toBe(360);
      expect(arrival[0].notes).toBe(
        EXPERIENCE_COPY.railTransferNote[['en', 'th', 'zh', 'ja', 'ko'].indexOf(lang)],
      );
      expect(arrival[1].title).not.toBe(arrival[2].title);
      expect(rail.stops[i].notes).toContain(
        EXPERIENCE_COPY.railScheduleNote[['en', 'th', 'zh', 'ja', 'ko'].indexOf(lang)],
      );
    }
  }
  Object.values(EXPERIENCE_COPY).forEach((v) => {
    expect(v).toHaveLength(5);
    expect(v.every((s) => s.trim())).toBe(true);
  });
  STATES.forEach((s) => {
    expect(s.destinations.every((p) => p.planning?.months.length)).toBe(true);
  });
});

test('six city plans validate 90 combinations and preserve visits, food and weather choices', () => {
  for (const [id] of CITY_PLAN_CASES) {
    const guide = findCityGuide(id)!;
    for (const [l, lang] of (['en', 'th', 'zh', 'ja', 'ko'] as const).entries()) {
      for (const days of [1, 2, 3]) {
        const trip = validateTrip(cityGuideTrip(guide, days, lang));
        expect(trip.stops).toHaveLength(1);
        expect(trip.stops[0].days).toBe(days);
        expect(trip.stops[0].code).toBe(id.slice(0, 2));
        expect(trip.expenses ?? []).toHaveLength(0);
        for (let day = 1; day <= days; day++) {
          const timeline = dayTimeline(trip.stops[0].activities!.filter((a) => a.day === day));
          expect(timeline).toHaveLength(4);
          expect(timeline.every((a) => a.estimated && !a.overlap)).toBe(true);
          expect(timeline[1].activity.title).toBe(guide.days[day - 1].title[l]);
          expect(timeline[1].activity.notes).toContain(guide.days[day - 1].alternative[l]);
          expect(timeline[2].activity.title).toBe(guide.food.stops[day - 1].title[l]);
          expect(timeline.every((a) => !a.activity.placeId)).toBe(true);
        }
      }
    }
    for (const days of [-1, 0, 4, 1.5, NaN, Infinity])
      expect(() => cityGuideTrip(guide, days, 'en')).toThrow();
    expect(() => cityGuideTrip({ ...guide, placeId: 'CA-1' }, 3, 'en')).toThrow();
  }
});

for (const [id, path] of CITY_PLAN_CASES) {
  test(`${id} guide previews and creates 1–3 day trips in five languages, preserving existing work`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.addInitScript(() => {
      if (!localStorage.getItem('roam.trip.v1'))
        localStorage.setItem(
          'roam.trip.v1',
          JSON.stringify({
            name: 'Original city holiday',
            startDate: '',
            travelers: 2,
            dailyBudget: 100,
            budgetMode: 'items',
            expenses: [
              {
                id: 'deposit',
                name: 'Hotel deposit',
                category: 'lodging',
                planned: 500,
                paid: 100,
              },
            ],
            stops: [{ code: 'CA', days: 2, notes: 'Keep my booking', activities: [] }],
          }),
        );
    });
    for (const [l, lang] of (['en', 'th', 'zh', 'ja', 'ko'] as const).entries()) {
      for (const days of [1, 2, 3]) {
        await page.goto(`/${lang}/states/${path}/`);
        const preview = page.locator('.city-plan-preview');
        await expect(page.locator('.city-plan-entry')).toBeVisible();
        const previousWork = await page.evaluate(() => [
          localStorage.getItem('roam.trip.v1'),
          localStorage.getItem('roam.library.v1'),
        ]);
        await expect(preview).not.toHaveAttribute('open', '');
        await page
          .getByRole('button', { name: EXPERIENCE_COPY.cityPlanPreview[l], exact: true })
          .press('Enter');
        await expect(preview).toHaveAttribute('open', '');
        await expect(preview.locator(':scope > summary')).toBeFocused();
        const position = await preview.evaluate((element) => ({
          top: element.getBoundingClientRect().top,
          headerBottom: document.querySelector('.header')!.getBoundingClientRect().bottom,
          tocHeight: document.querySelector('.guide-toc')!.getBoundingClientRect().height,
        }));
        expect(position.top).toBeGreaterThanOrEqual(position.headerBottom + position.tocHeight);
        await preview
          .getByLabel(EXPERIENCE_COPY.cityPlanDays[l], { exact: true })
          .selectOption(String(days));
        await expect(preview.locator('.template-day')).toHaveCount(days);
        await expect(preview.locator('.template-day li')).toHaveCount(days * 4);
        await expect(preview).toContainText(findCityGuide(id)!.days[days - 1].title[l]);
        await expect(preview).toContainText(findCityGuide(id)!.food.stops[days - 1].title[l]);
        const timeline = dayTimeline(
          cityGuideTrip(findCityGuide(id)!, days, lang).stops[0].activities!.filter(
            (a) => a.day === days,
          ),
        );
        const activity = timeline.reduce((sum, row) => sum + row.activity.minutes, 0);
        const buffer = timeline.reduce((sum, row) => sum + row.buffer, 0);
        const day = preview.locator('.template-day').last();
        await expect(day.locator('.city-plan-total')).toHaveText(
          x(lang, 'cityPlanTotal', { minutes: activity + buffer }),
        );
        await expect(day.locator('.city-plan-day-heading')).toContainText(
          x(lang, 'cityPlanBreakdown', { activity, buffer }),
        );
        await expect(day.locator('.city-plan-alternative')).toBeVisible();
        await expect(day.locator('.city-plan-alternative')).toContainText(
          findCityGuide(id)!.days[days - 1].alternative[l],
        );
        await expect(day.locator('li').nth(1)).toContainText(
          findCityGuide(id)!.days[days - 1].text[l],
        );
        await expect(day.locator('li').nth(2)).toContainText(
          findCityGuide(id)!.food.stops[days - 1].text[l],
        );
        expect(
          await page.evaluate(() => [
            localStorage.getItem('roam.trip.v1'),
            localStorage.getItem('roam.library.v1'),
          ]),
        ).toEqual(previousWork);
        if (lang === 'en' && days === 3) {
          const audit = await new AxeBuilder({ page })
            .include('#guide-city')
            .include('.guide-overview')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze();
          expect(audit.violations).toEqual([]);
        }
        await preview
          .getByRole('button', { name: EXPERIENCE_COPY.usePlan[l], exact: true })
          .click();
        await expect(page.locator('.day-strip button')).toHaveCount(days);
        await expect(page.locator('.day-activity .estimated-time')).toHaveCount(4);
        const current = validateTrip(
          await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!)),
        );
        expect(current.stops[0].activities).toHaveLength(days * 4);
        expect(current.stops[0].code).toBe(id.slice(0, 2));
        expect(current.expenses ?? []).toHaveLength(0);
        const library = validateLibrary(
          await page.evaluate(() => JSON.parse(localStorage.getItem('roam.library.v1')!)),
        );
        const original = library.trips.find(
          (item) => item.trip.name === 'Original city holiday',
        )!.trip;
        expect(original.stops[0].notes).toBe('Keep my booking');
        expect(original.expenses).toEqual([
          { id: 'deposit', name: 'Hotel deposit', category: 'lodging', planned: 500, paid: 100 },
        ]);
        if (lang === 'en' && days === 3) {
          const transfer = page.locator('.day-activity').first();
          await transfer.getByRole('button', { name: 'Edit activity', exact: true }).click();
          await transfer.getByLabel('Starts at', { exact: true }).fill('10:00');
          await expect(transfer.locator('.estimated-time')).toHaveCount(0);
          await expect(page.locator('.day-activity .estimated-time')).toHaveCount(3);
          await page.emulateMedia({ media: 'print' });
          await expect(page.locator('.print-itinerary .estimated-time')).toHaveCount(11);
          await expect(page.locator('.print-itinerary')).toContainText(
            findCityGuide(id)!.days[2].alternative[0],
          );
          await page.emulateMedia({ media: 'screen' });
        }
        await page.reload();
        await expect(page.locator('.day-strip button')).toHaveCount(days);
        if (lang === 'en' && days === 3)
          await expect(page.locator('.day-activity .estimated-time')).toHaveCount(3);
      }
    }
  });
}

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

test('rail guide creates nine editable days while preserving the original trip and expenses', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('roam.trip.v1'))
      localStorage.setItem(
        'roam.trip.v1',
        JSON.stringify({
          name: 'Original rail holiday',
          startDate: '',
          travelers: 2,
          dailyBudget: 100,
          budgetMode: 'items',
          expenses: [
            { id: 'deposit', name: 'Hotel deposit', category: 'lodging', planned: 500, paid: 100 },
          ],
          stops: [{ code: 'CA', days: 2, notes: 'Keep my booking', activities: [] }],
        }),
      );
  });
  for (const [l, lang] of (['en', 'th', 'zh', 'ja', 'ko'] as const).entries()) {
    await page.goto('/' + lang + '/');
    await page
      .locator('.guide-topics')
      .getByRole('button', { name: EXPERIENCE_COPY.guideTransport[l], exact: true })
      .click();
    await page.locator('.guide-card').last().press('Enter');
    await page.getByRole('button', { name: EXPERIENCE_COPY.previewRail[l], exact: true }).click();
    const preview = page.getByRole('dialog');
    await expect(preview.locator('.template-day')).toHaveCount(9);
    const dayLabels = await preview.locator('.template-day > strong').allTextContents();
    expect(dayLabels.map((text) => Number(text.match(/\d+/)![0]))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    await expect(preview).toContainText(EXPERIENCE_COPY.railScheduleNote[l]);
    await expect(preview.locator('.template-day').nth(3)).toContainText('BOS → NYP');
    await expect(preview.locator('.template-day').nth(7)).toContainText('NYP → PHL');
    await preview.getByRole('button', { name: EXPERIENCE_COPY.usePlan[l], exact: true }).click();
    await expect(page.locator('#planner-page')).toBeVisible();
    await expect(page.locator('.day-strip button')).toHaveCount(3);
    await page.locator('.day-planner-heading select').selectOption('NY');
    await expect(page.locator('.day-strip button')).toHaveCount(4);
    await expect(page.locator('.day-strip button span').first()).toContainText('4');
    if (lang === 'en') {
      const transfer = page.locator('.day-activity').first();
      await transfer.getByRole('button', { name: 'Edit activity', exact: true }).click();
      await transfer.getByLabel('Starts at', { exact: true }).fill('10:00');
      await transfer.getByRole('spinbutton', { name: /^Duration for/ }).fill('180');
    }
    await page.locator('.day-planner-heading select').selectOption('PA');
    await expect(page.locator('.day-strip button')).toHaveCount(2);
    await expect(page.locator('.day-strip button span').first()).toContainText('8');
    const current = validateTrip(
      await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!)),
    );
    expect(current.stops.map((stop) => [stop.code, stop.days])).toEqual([
      ['MA', 3],
      ['NY', 4],
      ['PA', 2],
    ]);
    expect(current.expenses ?? []).toHaveLength(0);
    const library = validateLibrary(
      await page.evaluate(() => JSON.parse(localStorage.getItem('roam.library.v1')!)),
    );
    const original = library.trips.find((item) => item.trip.name === 'Original rail holiday')!.trip;
    expect(original.stops[0].notes).toBe('Keep my booking');
    expect(original.expenses).toEqual([
      { id: 'deposit', name: 'Hotel deposit', category: 'lodging', planned: 500, paid: 100 },
    ]);
    await page.reload();
    await expect(page.locator('.day-strip button')).toHaveCount(3);
    if (lang === 'en') {
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!));
      expect(saved.stops[1].activities[0]).toMatchObject({ startTime: '10:00', minutes: 180 });
    }
  }
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
  await expect(page.locator('.guide-overview')).toContainText('Transit-friendly base');
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
