import { test, expect } from '@playwright/test';
import { EMPTY_TRIP, type Trip } from '../data/travel';
import { x } from '../data/experience-copy';
import { LANGUAGES } from '../lib/i18n';

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
