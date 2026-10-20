import { readFileSync } from 'node:fs';
import { w } from '../data/workspace-copy';
import { test, expect } from '@playwright/test';
import { EMPTY_TRIP, STATES, local, type Trip } from '../data/travel';
import { x } from '../data/experience-copy';
import { LANGUAGES, LOCALES, translate } from '../lib/i18n';

const trip: Trip = {
  ...EMPTY_TRIP,
  name: 'My coast & city trip',
  stops: [
    {
      code: 'CA',
      days: 2,
      notes: '',
      activities: [
        {
          id: 'a',
          title: 'First visit',
          day: 1,
          period: 'morning',
          startTime: '09:00',
          minutes: 90,
          notes: '',
        },
        {
          id: 'b',
          title: 'Second visit',
          day: 1,
          period: 'morning',
          startTime: '09:30',
          minutes: 60,
          notes: '',
        },
      ],
    },
    { code: 'NY', days: 1, notes: '' },
  ],
  checklist: [{ id: 'custom', label: 'Check my reservation', done: false }],
};

test('plan reminders open the correct day and checklist without changing saved data in five languages', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.addInitScript(
    (trip) => localStorage.setItem('roam.trip.v1', JSON.stringify(trip)),
    trip,
  );
  await page.goto('/en/?view=planner');
  const review = page.locator('.trip-readiness');
  await review.locator('summary').click();
  for (const lang of LANGUAGES) {
    await page.getByLabel('Language / ภาษา', { exact: true }).selectOption(lang);
    await expect(review).toContainText(x(lang, 'openDays', { count: 2 }));
    await expect(review).toContainText(x(lang, 'reviewDays', { count: 1 }));
    await review.locator('li button').last().click();
    await expect(page.locator('.day-navigation select')).toHaveValue('NY');
    await expect(page.locator('.day-strip [aria-pressed="true"]')).toContainText('3');
    await expect(page.locator('.day-strip [aria-pressed="true"]')).toBeFocused();
    await review.locator('li button').first().click();
    await expect(page.locator('.day-navigation select')).toHaveValue('CA');
    await expect(page.locator('.day-strip [aria-pressed="true"]')).toContainText('1');
    await review.getByRole('button', { name: x(lang, 'checklistRemaining', { count: 1 }) }).click();
    await expect(page.locator('.trip-checklist')).toHaveAttribute('open', '');
    await expect(page.locator('.trip-checklist summary')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!))).toEqual(
    trip,
  );
  await page.getByLabel('Check my reservation', { exact: true }).check();
  await expect(review).toContainText(x('ko', 'checklistRemaining', { count: 0 }));
  await review.getByRole('button').last().click();
  await expect(page.locator('.offline-status')).toHaveAttribute('open', '');
  await expect(page.locator('.offline-status summary')).toBeFocused();
});

test('home shows the saved trip and resets every visible discovery filter', async ({ page }) => {
  await page.addInitScript((trip) => {
    localStorage.setItem('roam.trip.v1', JSON.stringify(trip));
    localStorage.setItem('roam.place-filter.v1', JSON.stringify('transit'));
  }, trip);
  await page.goto('/en/');
  await expect(page.locator('.hero-resume')).toContainText(trip.name);
  await page.locator('.discovery-view-bar button').filter({ hasText: 'Places' }).click();
  await expect(page.locator('.active-filters')).toContainText(x('en', 'transit'));
  await page.locator('.place-filter-row select').nth(1).selectOption('indoors');
  await page.locator('.active-filters button').click();
  await expect(page.locator('.place-filter-row select').first()).toHaveValue('any');
  await expect(page.locator('.place-filter-row select').nth(1)).toHaveValue('any');
  await expect(page.locator('.active-filters')).toHaveCount(0);
  await page.locator('.hero-resume').click();
  await expect(page.locator('.planner-content')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!))).toEqual(
    trip,
  );
});

test('plan reminders recalculate after time edits, deletion and undo', async ({ page }) => {
  await page.addInitScript(
    (trip) => localStorage.setItem('roam.trip.v1', JSON.stringify(trip)),
    trip,
  );
  await page.goto('/en/?view=planner');
  const review = page.locator('.trip-readiness');
  await review.locator('summary').click();
  await expect(review).toContainText(x('en', 'reviewDays', { count: 1 }));
  const second = page.locator('.day-activity').nth(1);
  await second.getByRole('button', { name: 'Edit activity', exact: true }).click();
  await second.getByLabel('Starts at', { exact: true }).fill('11:00');
  await expect(review).toContainText(x('en', 'reviewDays', { count: 0 }));
  await second.getByLabel('Starts at', { exact: true }).fill('09:30');
  await expect(review).toContainText(x('en', 'reviewDays', { count: 1 }));
  await second.getByRole('button', { name: 'Remove activity Second visit' }).click();
  await expect(review).toContainText(x('en', 'reviewDays', { count: 0 }));
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(review).toContainText(x('en', 'reviewDays', { count: 1 }));
});

test('saved notices deduplicate places, navigate days and update after removal and undo in five languages', async ({
  page,
}) => {
  test.setTimeout(60000);
  const visit = {
    day: 1,
    period: 'morning' as const,
    minutes: 60,
    notes: 'Keep my personal note',
  };
  const saved: Trip = {
    ...EMPTY_TRIP,
    name: 'Notices review',
    stops: [
      {
        code: 'CA',
        days: 2,
        notes: 'Keep my state note',
        activities: [
          { ...visit, id: 'coast-a', title: 'First coast visit', placeId: 'CA-2' },
          { ...visit, id: 'coast-b', title: 'Second coast visit', placeId: 'CA-2' },
          { ...visit, id: 'coast-c', title: 'Next day coast visit', placeId: 'CA-2', day: 2 },
        ],
      },
      {
        code: 'UT',
        days: 1,
        notes: '',
        activities: [{ ...visit, id: 'zion', title: 'Park visit', placeId: 'UT-0' }],
      },
      {
        code: 'AZ',
        days: 1,
        notes: '',
        activities: [{ ...visit, id: 'custom', title: 'Grand Canyon South Rim' }],
      },
    ],
    budgetMode: 'items',
    expenses: [{ id: 'hotel', name: 'Hotel', category: 'lodging', planned: 300, paid: 100 }],
  };
  await page.addInitScript(
    (value) => localStorage.setItem('roam.trip.v1', JSON.stringify(value)),
    saved,
  );
  let routeRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('routing.openstreetmap.de')) routeRequests++;
  });
  await page.goto('/en/?view=planner');
  const review = page.locator('.trip-readiness');
  await review.locator('summary').click();
  const notices = review.locator('.readiness-notices');
  const items = notices.locator('li');
  for (const lang of LANGUAGES) {
    await page.getByLabel('Language / ภาษา', { exact: true }).selectOption(lang);
    await expect(review.locator('summary')).toContainText(x(lang, 'noticePlaces', { count: 2 }));
    await expect(notices).toContainText(x(lang, 'placeNoticesNote'));
    await expect(items).toHaveCount(2);
    await expect(items.first().getByRole('button')).toHaveCount(2);
    const coastNotice = STATES.find((state) => state.code === 'CA')!.destinations[2].advisory!;
    await expect(items.first().locator('time')).toHaveAttribute('datetime', coastNotice.checkedAt);
    await expect(items.first().getByRole('link')).toHaveAttribute('href', coastNotice.source);
    await expect(items.first().getByRole('link')).toHaveAttribute('rel', 'noreferrer');
    const dayLink = items.last().getByRole('button');
    await dayLink.focus();
    await dayLink.press('Enter');
    await expect(page.locator('.day-navigation select')).toHaveValue('UT');
    await expect(page.locator('.day-strip [aria-pressed="true"]')).toContainText('3');
    await expect(page.locator('.day-strip [aria-pressed="true"]')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!))).toEqual(
    saved,
  );
  await page.getByLabel('Language / ภาษา', { exact: true }).selectOption('en');
  await items.first().getByRole('button').last().click();
  await page.getByRole('button', { name: /^Remove activity/ }).click();
  await expect(items.first().getByRole('button')).toHaveCount(1);
  await expect(items).toHaveCount(2);
  await items.first().getByRole('button').click();
  await page
    .getByRole('button', { name: /^Remove activity/ })
    .first()
    .click();
  await expect(items).toHaveCount(2);
  await page.getByRole('button', { name: /^Remove activity/ }).click();
  await expect(items).toHaveCount(1);
  await items.first().getByRole('button').click();
  await page.getByRole('button', { name: /^Remove activity/ }).click();
  await expect(items).toHaveCount(0);
  await expect(notices).toContainText(x('en', 'noPlaceNotices'));
  await expect(review.locator('summary')).toContainText(x('en', 'noticePlaces', { count: 0 }));
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(items).toHaveCount(1);
  await expect(review.locator('summary')).toContainText(x('en', 'noticePlaces', { count: 1 }));
  expect(routeRequests).toBe(0);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!));
  expect(after.expenses).toEqual(saved.expenses);
  expect(after.stops[0].notes).toBe(saved.stops[0].notes);
  expect(after.stops[2].activities).toEqual(saved.stops[2].activities);
});

test('text and print retain trip-wide days, times, dated notices, checklists and item balances in five languages', async ({
  page,
}) => {
  test.setTimeout(60000);
  const activity = { day: 1, period: 'morning' as const, minutes: 60, notes: '' };
  const saved: Trip = {
    ...EMPTY_TRIP,
    stops: [
      {
        code: 'CA',
        days: 2,
        notes: 'Keep this note',
        activities: [
          {
            ...activity,
            id: 'first',
            title: 'Coast',
            placeId: 'CA-2',
            startTime: '10:00',
            bufferMinutes: 15,
          },
          { ...activity, id: 'repeat', title: 'Coast again', placeId: 'CA-2', minutes: 30 },
          { ...activity, id: 'tomorrow', title: 'Coast tomorrow', placeId: 'CA-2', day: 2 },
        ],
      },
      {
        code: 'UT',
        days: 1,
        notes: '',
        activities: [{ ...activity, id: 'park', title: 'Zion', placeId: 'UT-0' }],
      },
    ],
    checklist: [{ id: 'custom', label: 'Bring my camera', done: true }],
    budgetMode: 'items',
    expenses: [
      { id: 'hotel', name: 'Hotel deposit', category: 'lodging', planned: 600.25, paid: 200.1 },
      { id: 'food', name: 'Lunch', category: 'food', planned: 20, paid: 25 },
    ],
  };
  await page.addInitScript((value) => {
    if (!localStorage.getItem('roam.trip.v1'))
      localStorage.setItem('roam.trip.v1', JSON.stringify(value));
  }, saved);
  await page.goto('/en/?view=planner');
  const printed = page.locator('.print-itinerary');
  for (const lang of LANGUAGES) {
    await page.getByLabel('Language / ภาษา', { exact: true }).selectOption(lang);
    const download = page.waitForEvent('download');
    await page.locator('.export-main:visible').click();
    const text = readFileSync((await (await download).path())!, 'utf8');
    expect(text).toContain('10:00–11:00');
    expect(text).toContain('11:15–11:45');
    expect(text.split('09:00–10:00')).toHaveLength(3);
    expect(text.split(x(lang, 'estimatedTime'))).toHaveLength(4);
    expect(text).toContain('☑ Bring my camera');
    expect(text).toContain('Keep this note');
    expect(text).toContain(
      `${w(lang, 'unpaid')}: ${new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'USD' }).format(400.15)}`,
    );
    await page.emulateMedia({ media: 'print' });
    await expect(printed.locator('.print-day')).toHaveCount(3);
    await expect(printed.locator('.print-day').nth(1)).toContainText('09:00–10:00');
    await expect(printed.locator('.print-day').last()).toContainText(
      `${translate('Day', 'วันที่', lang)} 3`,
    );
    expect(text).toContain(`${translate('Day', 'วันที่', lang)} 3 ·`);
    await expect(printed.locator('.estimated-time')).toHaveCount(3);
    await expect(printed.locator('.print-notices li')).toHaveCount(2);
    await expect(printed.locator('.print-checklist')).toContainText('☑ Bring my camera');
    await expect(printed.locator('.print-budget')).toContainText('400.15');
    for (const code of ['CA', 'UT']) {
      const state = STATES.find((s) => s.code === code)!;
      const advisory = state.destinations[code === 'CA' ? 2 : 0].advisory!;
      expect(text.split(advisory.source)).toHaveLength(2);
      expect(text).toContain(local(advisory.text, lang));
      await expect(printed.locator('.print-notices')).toContainText(local(advisory.text, lang));
      await expect(printed.locator('.print-notices')).toContainText(advisory.checkedAt);
    }
    await page.emulateMedia({ media: 'screen' });
  }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!))).toEqual(
    saved,
  );
  for (const checklist of [undefined, []]) {
    await page.evaluate((checklist) => {
      const trip = JSON.parse(localStorage.getItem('roam.trip.v1')!);
      trip.checklist = checklist;
      localStorage.setItem('roam.trip.v1', JSON.stringify(trip));
    }, checklist);
    await page.reload();
    await expect(printed.locator('.print-checklist li')).toHaveCount(checklist ? 0 : 6);
    const download = page.waitForEvent('download');
    await page.locator('.export-main:visible').click();
    const text = readFileSync((await (await download).path())!, 'utf8');
    expect(text.includes(x('ko', 'documents'))).toBe(!checklist);
  }
});
