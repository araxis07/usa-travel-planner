import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { EMPTY_TRIP, STATES } from '../data/travel';
import { validateCatalog, migrateCatalog, reviewQueue } from '../lib/content';
import { readFileSync } from 'node:fs';
const catalog = JSON.parse(
  readFileSync(new URL('../content/states.json', import.meta.url), 'utf8'),
);

test('legacy content migration preserves matching profiles and flags review work', () => {
  const current = validateCatalog(catalog);
  const legacy = structuredClone(catalog) as { states: Record<string, unknown>[] };
  for (const s of legacy.states) delete s.destinations;
  expect(validateCatalog(migrateCatalog(legacy, current)).states[0].destinations).toEqual(
    current.states[0].destinations,
  );
  legacy.states[0].places = ['A changed place', 'Yosemite National Park', 'Big Sur'];
  expect(() => migrateCatalog(legacy, current)).toThrow('Legacy place names changed');
  const invalid = structuredClone(current);
  invalid.states[0].destinations[0].coordinates = [0, 0];
  expect(() => validateCatalog(invalid)).toThrow();
  expect(reviewQueue(current).length).toBeGreaterThan(0);
});

test('choose day and duration before adding, search all states, and undo deletion', async ({
  page,
}) => {
  await page.goto('/en/states/california/yosemite-national-park/');
  await page.evaluate((value) => localStorage.setItem('roam.trip.v1', JSON.stringify(value)), {
    ...EMPTY_TRIP,
    stops: [{ code: 'CA', days: 3, notes: '' }],
  });
  await page.reload();
  await page.getByRole('button', { name: 'View fullscreen · 3', exact: true }).click();
  const gallery = page.getByRole('dialog', { name: 'Fullscreen gallery' });
  await expect(gallery.locator('.lightbox-toolbar')).toContainText('1 / 3');
  await gallery.getByRole('button', { name: 'Close gallery' }).click();
  await page.getByRole('button', { name: 'Add to my trip', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add to daily plan' });
  await dialog.getByLabel('Day in this state').selectOption('2');
  await dialog.getByLabel('Time of day').selectOption('afternoon');
  await dialog.getByLabel('Duration in minutes').fill('240');
  await dialog.getByRole('button', { name: 'Add activity', exact: true }).click();
  await page.locator('.header-trip').click();
  await page.getByRole('button', { name: 'Daily plan', exact: true }).click();
  await page.locator('.day-strip button').nth(1).click();
  await expect(page.getByLabel('Duration for Yosemite National Park')).toHaveValue('240');
  await page.getByRole('button', { name: 'Remove activity Yosemite National Park' }).click();
  await expect(page.locator('.day-activity')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByLabel('Duration for Yosemite National Park')).toHaveValue('240');
  await page.getByRole('button', { name: 'Add activity', exact: true }).click();
  await page.getByLabel('Search places', { exact: true }).fill('New York City');
  await expect(page.getByLabel('Choose a place or custom activity')).toHaveValue('NY-0');
  await expect(page.getByLabel('Duration in minutes', { exact: true })).toHaveValue(
    String(STATES.find((s) => s.code === 'NY')!.destinations[0].visitMinutes),
  );
  await page
    .locator('form.add-activity')
    .getByRole('button', { name: 'Add activity', exact: true })
    .click();
  await expect(page.locator('.day-activity h5')).toContainText([
    'New York City',
    'Yosemite National Park',
  ]);
  await page.reload();
  await page.locator('.day-strip button').nth(1).click();
  await expect(page.locator('.day-activity')).toHaveCount(2);
});

test('comparison limits three choices, persists them and remains accessible', async ({
  page,
  isMobile,
}) => {
  await page.goto('/?lang=en');
  if (isMobile) await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('button', { name: 'Compare destinations', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Compare destinations' });
  const select = dialog.getByLabel('Add a destination to compare');
  for (const id of ['CA-1', 'UT-0', 'NY']) await select.selectOption(id);
  await expect(select).toBeDisabled();
  await expect(dialog.locator('thead th')).toHaveCount(4);
  expect(
    (
      await new AxeBuilder({ page })
        .include('.compare-panel')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await dialog.getByRole('button', { name: 'Remove New York', exact: true }).click();
  await expect(select).toBeEnabled();
  await page.reload();
  if (isMobile) await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('button', { name: 'Compare destinations', exact: true }).click();
  await expect(page.getByRole('dialog').locator('thead th')).toHaveCount(3);
});
