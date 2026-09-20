import { test, expect } from '@playwright/test';
import { EMPTY_TRIP } from '../data/travel';
import { LANGUAGES } from '../lib/i18n';

test('home search, language controls and trip shortcuts fit all five languages', async ({
  page,
  isMobile,
}) => {
  await page.goto('/en/');
  for (const lang of LANGUAGES) {
    await page.getByLabel('Language / ภาษา', { exact: true }).selectOption(lang);
    await expect(page.locator('.hero-search input')).toBeInViewport();
    await expect(page.locator('.hero-wizard')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (isMobile) {
      for (const selector of ['.header-trip', '.menu-button', '.language-selector']) {
        const box = await page.locator(selector).boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }
  }
  await page.locator('.hero-wizard').click();
  await expect(page.locator('.wizard-panel')).toBeVisible();
});

test('card image opens the full guide and back restores discovery filters and position', async ({
  page,
}) => {
  await page.goto('/en/');
  await page.getByLabel('Search destinations', { exact: true }).fill('California');
  await page.locator('.hero-search button').click();
  const card = page.locator('.destination-grid .card-image-button').first();
  await card.scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  await card.click();
  await expect(page.locator('.destination-hero h1')).toHaveText('California');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('.guide-breadcrumb button').click();
  await expect(page.getByLabel('Search destinations', { exact: true })).toHaveValue('California');
  await expect(page.locator('.destination-grid .state-card')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(scroll, -1);
  await card.click();
  await page.goBack();
  await expect(page.locator('.destination-grid .state-card')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(scroll, -1);
  await page.locator('.card-quick-view').first().click();
  await expect(page.getByRole('dialog', { name: 'California', exact: true })).toBeVisible();
});

test('daily planner shows the first activity early and empty periods add to the right slot', async ({
  page,
  isMobile,
}) => {
  await page.addInitScript(
    (trip) => {
      if (!localStorage.getItem('roam.trip.v1'))
        localStorage.setItem('roam.trip.v1', JSON.stringify(trip));
    },
    {
      ...EMPTY_TRIP,
      name: 'A day in California',
      stops: [
        {
          code: 'CA',
          days: 3,
          notes: '',
          activities: [
            {
              id: 'morning',
              day: 1,
              period: 'morning',
              placeId: 'CA-0',
              title: 'San Francisco',
              minutes: 180,
              notes: '',
            },
          ],
        },
      ],
    },
  );
  await page.goto('/en/?view=planner');
  await expect(page.locator('.day-activity').first()).toBeInViewport();
  await page.getByRole('button', { name: 'Add activity · Afternoon', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Time of day', exact: true })).toHaveValue(
    'afternoon',
  );
  await page.locator('.add-activity button[type="submit"]').click();
  await expect(page.locator('.day-period[aria-label="Afternoon"] .day-activity')).toHaveCount(1);
  await expect(
    page.getByRole('status').filter({ hasText: 'Activity added to your day.' }).first(),
  ).toBeVisible();
  if (isMobile) {
    await page.locator('.day-period[aria-label="Evening"]').scrollIntoViewIfNeeded();
    await expect(page.locator('.add-activity-toggle')).toBeInViewport();
  }
  await page.reload();
  await expect(page.locator('.day-period[aria-label="Afternoon"] .day-activity')).toHaveCount(1);
});

test('place overview exposes access notices and saving applies to that place', async ({ page }) => {
  await page.goto('/en/states/california/big-sur/');
  await expect(page.locator('.guide-overview dd')).toHaveCount(4);
  await expect(page.locator('.guide-overview .guide-advisory')).toBeVisible();
  const save = page.locator('.hero-save');
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('roam.collections.v1')!),
  );
  expect(stored.groups[0].places).toContain('CA-2');
});
