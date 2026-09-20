import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { EMPTY_TRIP, type Trip } from '../data/travel';
import { budgetTotals } from '../lib/budget';
import { validateTrip } from '../lib/storage';
import { validateWorkspace, planRestore, type WorkspaceBackup } from '../lib/workspaceBackup';
import { WORKSPACE_COPY, w } from '../data/workspace-copy';
const trip: Trip = {
  ...EMPTY_TRIP,
  name: 'Pacific holiday',
  stops: [{ code: 'CA', days: 3, notes: 'Keep this note' }],
  budgetMode: 'items',
  expenses: [
    { id: 'hotel', name: 'Hotel deposit', category: 'lodging', planned: 600.25, paid: 200.1 },
  ],
  checklist: [{ id: 'custom-1', label: 'Pack camera', done: true }],
};
const backup: WorkspaceBackup = {
  format: 'roam-workspace',
  version: 1,
  exportedAt: '2026-09-15T00:00:00Z',
  library: {
    version: 1,
    activeId: 'original',
    trips: [
      { id: 'original', trip, archived: false, updatedAt: '2026-09-15T00:00:00Z' },
      {
        id: 'archived',
        trip: { ...trip, name: 'Past journey' },
        archived: true,
        updatedAt: '2026-09-14T00:00:00Z',
      },
    ],
  },
  collections: {
    groups: [
      { id: 'someday', name: '', places: ['CA-0'] },
      { id: 'parks', name: 'My parks', places: ['UT-0'] },
    ],
    visited: ['NY-0'],
  },
  favorites: ['CA', 'UT'],
};

test('expense validation, cents and selective restore preserve complete travel data', () => {
  expect(budgetTotals(validateTrip(trip))).toMatchObject({
    estimate: 600.25,
    paid: 200.1,
    remaining: 400.15,
    overpaid: false,
  });
  expect(budgetTotals({ ...trip, budgetMode: 'daily' }).estimate).toBe(900);
  const over = {
    ...trip,
    expenses: [
      ...trip.expenses!,
      { id: 'flight', name: 'Flight', category: 'flight' as const, planned: 100, paid: 200 },
    ],
  };
  expect(budgetTotals(over)).toMatchObject({ remaining: 400.15, overpaid: true });
  for (const value of [-1, Infinity, NaN, 1000001])
    expect(() =>
      validateTrip({ ...trip, expenses: [{ ...trip.expenses![0], planned: value }] }),
    ).toThrow();
  expect(() =>
    validateTrip({ ...trip, expenses: [trip.expenses![0], trip.expenses![0]] }),
  ).toThrow();
  expect(validateWorkspace(JSON.parse(JSON.stringify(backup)))).toEqual(backup);
  const merged = planRestore(backup, backup, {
    trips: ['archived'],
    collections: false,
    favorites: false,
    mode: 'merge',
  });
  expect(merged.library.trips).toHaveLength(3);
  expect(merged.library.activeId).toBe('original');
  expect(merged.library.trips[2].id).not.toBe('archived');
  expect(merged.library.trips[2].archived).toBe(true);
  expect(merged.collections).toEqual(backup.collections);
  const replaced = planRestore(backup, backup, {
    trips: ['archived'],
    collections: false,
    favorites: false,
    mode: 'replace',
  });
  expect(replaced.library.trips).toHaveLength(1);
  expect(replaced.library.trips[0].archived).toBe(false);
  expect(replaced.library.trips[0].trip.expenses).toEqual(trip.expenses);
  const full = structuredClone(backup);
  full.library.trips = Array.from({ length: 30 }, (_, i) => ({
    ...backup.library.trips[0],
    id: i === 0 ? 'original' : `trip-${i}`,
  }));
  expect(() =>
    planRestore(full, backup, {
      trips: ['original'],
      collections: false,
      favorites: false,
      mode: 'merge',
    }),
  ).toThrow('capacity');
  expect(() =>
    validateWorkspace({ ...backup, collections: { ...backup.collections, visited: ['invalid'] } }),
  ).toThrow();
  expect(() => validateWorkspace({ ...backup, favorites: ['XX'] })).toThrow();
  Object.values(WORKSPACE_COPY).forEach((v) => {
    expect(v).toHaveLength(5);
    expect(v.every((t) => t.trim())).toBe(true);
  });
});

test('itemized budget edits, exports, reloads and remains usable in five languages', async ({
  page,
}) => {
  await page.addInitScript((value) => {
    if (!localStorage.getItem('roam.trip.v1'))
      localStorage.setItem('roam.trip.v1', JSON.stringify(value));
  }, trip);
  await page.goto('/en/?view=planner');
  await page.locator('.header-trip').click();
  await page.getByRole('button', { name: 'Trip budget', exact: true }).click();
  const budget = page.getByRole('region', { name: 'Trip budget' });
  await expect(budget.locator('.expense-totals')).toContainText('$600.25');
  await expect(budget.locator('.expense-totals')).toContainText('$400.15');
  const form = budget.locator('form');
  await form.getByLabel('Expense name').fill('Flights for two');
  await form.getByLabel('Category').selectOption('flight');
  await form.getByLabel('Planned (USD)').fill('800.5');
  await form.getByRole('button', { name: 'Add expense' }).click();
  await expect(budget.locator('.expense-totals')).toContainText('$1,400.75');
  const flight = budget.locator('.expense-row').nth(1);
  await flight.getByLabel('Already paid (USD)').fill('800.5');
  await expect(budget.locator('.expense-totals')).toContainText('$1,000.60');
  await expect(budget.locator('.expense-totals')).toContainText('$400.15');
  await budget.getByLabel('Budget calculation').selectOption('daily');
  await expect(budget.locator('.expense-totals').locator('strong').first()).toHaveText('$900.00');
  await budget.getByLabel('Budget calculation').selectOption('items');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my itinerary', exact: true }).click();
  expect(readFileSync((await (await download).path())!, 'utf8')).toContain('Flights for two');
  for (const lang of ['th', 'zh', 'ja', 'ko', 'en'] as const) {
    await page.getByRole('combobox', { name: 'Language / ภาษา' }).selectOption(lang);
    await expect(page.locator('.trip-budget h2')).toHaveText(w(lang, 'budget'));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  expect(
    (
      await new AxeBuilder({ page })
        .include('.trip-budget')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.reload();
  await page.getByRole('button', { name: 'Trip budget', exact: true }).click();
  await expect(page.locator('.expense-row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Daily plan', exact: true }).click();
  await page.getByRole('button', { name: 'Add activity', exact: true }).click();
  await expect(page.getByLabel('Search places', { exact: true })).toBeFocused();
});

test('full backup previews selection and restores trips, archives, collections and expenses', async ({
  page,
}) => {
  await page.goto('/en/');
  await page.locator('.header-trip').click();
  await page.getByRole('button', { name: 'My trip library', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'My trip library' });
  await dialog.locator('.workspace-backup summary').click();
  await dialog.getByLabel('Travel data backup file').setInputFiles({
    name: 'all.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(dialog.locator('.restore-preview')).toBeVisible();
  await dialog.getByLabel('Replace the selected data groups', { exact: true }).check();
  await dialog.getByRole('button', { name: 'Confirm restore' }).click();
  await expect(dialog.getByRole('status')).toContainText('Selected travel data restored.');
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!).name))
    .toBe('Pacific holiday');
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Download full backup' }).click();
  const exported = JSON.parse(readFileSync((await (await download).path())!, 'utf8'));
  expect(exported.library).toEqual(backup.library);
  expect(exported.collections).toEqual(backup.collections);
  expect(exported.favorites).toEqual(backup.favorites);
  // Restore just the archived trip as a copy; collections and current trip stay intact.
  await dialog.getByLabel('Travel data backup file').setInputFiles({
    name: 'all.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await dialog.getByRole('checkbox', { name: 'Pacific holiday', exact: true }).uncheck();
  await dialog
    .getByRole('checkbox', { name: 'Collections & visited places', exact: true })
    .uncheck();
  await dialog.getByRole('checkbox', { name: 'Saved states', exact: true }).uncheck();
  await dialog.getByRole('button', { name: 'Confirm restore' }).click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('roam.library.v1')!));
  expect(stored.trips).toHaveLength(3);
  expect(stored.activeId).toBe('original');
  await page.reload();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('roam.collections.v1')!)),
  ).toEqual(backup.collections);
});

test('restore transaction rolls back partial writes and recovers after interruption', async ({
  page,
}) => {
  await page.goto('/en/');
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite serves this browser module in the development harness.
    const { atomicLocalWrite, recoverLocalTransaction } = await import('/lib/localTransaction.ts');
    const key = 'roam.trip.v1';
    const library = 'roam.library.v1';
    localStorage.setItem(key, 'old trip');
    localStorage.setItem(library, 'old library');
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      if (k === library && v === 'new library')
        throw new DOMException('Full', 'QuotaExceededError');
      return original.call(this, k, v);
    };
    let failed = false;
    try {
      atomicLocalWrite({ [key]: 'new trip', [library]: 'new library' });
    } catch {
      failed = true;
    } finally {
      Storage.prototype.setItem = original;
    }
    const rolledBack =
      localStorage.getItem(key) === 'old trip' && localStorage.getItem(library) === 'old library';
    localStorage.setItem(
      'roam.restore.pending.v1',
      JSON.stringify({ [key]: 'old trip', [library]: 'old library' }),
    );
    localStorage.setItem(key, 'interrupted trip');
    localStorage.setItem(library, 'oversized partial library');
    Storage.prototype.setItem = function (k: string, v: string) {
      if (
        k === key &&
        v === 'old trip' &&
        localStorage.getItem(library) === 'oversized partial library'
      )
        throw new DOMException('Rollback needs free space', 'QuotaExceededError');
      return original.call(this, k, v);
    };
    try {
      recoverLocalTransaction();
    } finally {
      Storage.prototype.setItem = original;
    }
    return {
      failed,
      rolledBack,
      recovered: localStorage.getItem(key) === 'old trip',
      journal: localStorage.getItem('roam.restore.pending.v1'),
    };
  });
  expect(result).toEqual({ failed: true, rolledBack: true, recovered: true, journal: null });
});

test('contextual scenes switch to photographs and advisories appear in destination guides', async ({
  page,
}) => {
  await page.goto('/en/');
  await page.locator('#map').scrollIntoViewIfNeeded();
  const select = page.getByLabel('Jump to a state');
  for (const code of ['CA', 'NY', 'AZ']) {
    await select.selectOption(code);
    await expect(page.locator('.landmark-scene-top')).toContainText(code);
    await expect(page.locator('.landmark-scene canvas, .landmark-scene img')).toHaveCount(1);
  }
  await page.getByRole('button', { name: 'Photo mode', exact: true }).click();
  await expect(page.locator('.landmark-scene img')).toBeVisible();
  await page.reload();
  await page.locator('#map').scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: '3D scene', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goto('/en/states/california/big-sur/');
  await expect(page.locator('.guide-overview .guide-advisory')).toContainText('September 2');
  await expect(page.locator('.place-practical')).toContainText(
    'Big Sur Station visitor information',
  );
});
