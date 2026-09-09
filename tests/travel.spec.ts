import { test, expect } from '@playwright/test';
import { STATES, ROUTES, EMPTY_TRIP } from '../data/travel';
import { readFileSync } from 'node:fs';
import { validateTrip, validFavorites, validDate } from '../lib/storage';
const shapes: { name: string }[] = JSON.parse(
  readFileSync(new URL('../data/map-paths.json', import.meta.url), 'utf8'),
);

test('the atlas contains exactly 50 complete, unique state guides', () => {
  expect(STATES).toHaveLength(50);
  expect(new Set(STATES.map((state) => state.code)).size).toBe(50);
  expect(new Set(shapes.map((shape) => shape.name))).toEqual(
    new Set(STATES.map((state) => state.name)),
  );
  for (const state of STATES) {
    expect(state.places).toHaveLength(3);
    expect(
      state.description.every(Boolean) && state.food.every(Boolean) && state.tip.every(Boolean),
    ).toBe(true);
    expect(state.season.length).toBeGreaterThan(0);
  }
  for (const route of ROUTES) {
    expect(route.codes.length).toBe(route.days.length);
    expect(route.codes.every((code) => STATES.some((state) => state.code === code))).toBe(true);
  }
});

test('backup validation rejects corrupt data and impossible dates', () => {
  const valid = { ...EMPTY_TRIP, stops: [{ code: 'CA', days: 3, notes: 'Yosemite' }] };
  expect(validateTrip(valid)).toEqual(valid);
  for (const bad of [
    null,
    { ...valid, travelers: -1 },
    { ...valid, dailyBudget: Infinity },
    { ...valid, startDate: '2026-02-30' },
    { ...valid, stops: [...valid.stops, ...valid.stops] },
    { ...valid, stops: [{ code: 'XX', days: 1, notes: '' }] },
    { ...valid, stops: [{ code: 'CA', days: -1, notes: '' }] },
  ])
    expect(() => validateTrip(bad)).toThrow();
  expect(validDate('2028-02-29')).toBe(true);
  expect(validDate('2027-02-29')).toBe(false);
  expect(validFavorites(['CA', 'CA', 'XX', 1, 'NY'])).toEqual(['CA', 'NY']);
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('loads real images with no runtime errors or horizontal overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Find your');
  await page.locator('#destinations').scrollIntoViewIfNeeded();
  await expect(page.locator('.destination-grid .state-card')).toHaveCount(4);
  for (const img of await page.locator('.hero-image, .destination-grid img').all()) {
    await expect
      .poll(() =>
        img.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test('search combines landmarks, region, experience and season, with reset', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Search destinations' }).fill('Niagara');
  await page.getByRole('button', { name: 'Let’s explore' }).click();
  await expect(page.locator('.destination-grid .state-card')).toHaveCount(1);
  await expect(page.locator('.destination-grid h3')).toHaveText('New York');
  await page.getByLabel('Filter by region').selectOption('Southwest');
  await expect(page.getByText('A little detour?')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await page.getByLabel('Experience', { exact: true }).selectOption('Nature');
  await page.getByLabel('Season', { exact: true }).selectOption('Winter');
  await page.getByRole('button', { name: 'Let’s explore' }).click();
  await expect(page.locator('.destination-grid')).toContainText('Colorado');
  await expect(page.locator('.destination-grid')).not.toContainText('California');
});

test('all 50 states can be browsed and sorted', async ({ page }) => {
  await page.getByRole('button', { name: 'Explore all 50 states', exact: true }).click();
  await expect(page.locator('.destination-grid .state-card')).toHaveCount(50);
  await page.getByLabel('Sort destinations').selectOption('az');
  await expect(page.locator('.destination-grid h3').first()).toHaveText('Alabama');
  await expect(page.locator('.destination-grid h3').last()).toHaveText('Wyoming');
  await page.getByRole('button', { name: 'Show fewer places' }).click();
  await expect(page.locator('.destination-grid .state-card')).toHaveCount(4);
});

test('favorites persist through reload and can be removed from the collection', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Save California', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Unsave California', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .locator('.footer-links')
    .getByRole('button', { name: 'Saved places', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Saved places' });
  await expect(dialog.locator('.state-card')).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Unsave California', exact: true }).click();
  await expect(dialog.getByText('Your next favorite is out there.')).toBeVisible();
});

test('state guide, itinerary changes, budget, notes and persistence work together', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Explore California', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Yosemite National Park');
  await page.getByRole('button', { name: 'Add to my trip' }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Trip name', { exact: true }).fill('West coast adventure');
  await dialog.getByLabel('Start date', { exact: true }).fill('2026-10-10');
  await dialog.getByLabel('Travelers', { exact: true }).fill('3');
  await dialog.getByLabel('Daily budget in USD').fill('120');
  await dialog.getByRole('button', { name: 'Fewer days in California' }).click();
  await dialog.getByLabel('Notes for California').fill('Stay near Yosemite. Bring a camera.');
  await expect(dialog.locator('.budget-summary')).toContainText('$2,160');
  await page.reload();
  await page.locator('.header-trip').click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Trip name', { exact: true })).toHaveValue('West coast adventure');
  await expect(dialog.getByLabel('Notes for California')).toHaveValue(
    'Stay near Yosemite. Bring a camera.',
  );
  await expect(dialog.getByLabel('Start date', { exact: true })).toHaveValue('2026-10-10');
  await expect(dialog.locator('.budget-summary')).toContainText('$2,160');
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Download my itinerary' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('roam-america-itinerary.txt');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const content = Buffer.concat(chunks).toString('utf-8');
  expect(content).toContain('West coast adventure');
  expect(content).toContain('Stay near Yosemite');
  expect(content).toContain('$2,160');
});

test('route templates merge without duplicates and support reorder and removal', async ({
  page,
}) => {
  await page.locator('.route-card').first().click();
  await page.getByRole('button', { name: 'Make this my adventure' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.trip-stop')).toHaveCount(3);
  await expect(dialog.locator('.budget-summary')).toContainText('8 days');
  await dialog.getByLabel('Notes for Arizona').fill('Sunrise stop');
  await dialog.getByRole('button', { name: 'Move down Arizona' }).click();
  await expect(dialog.locator('.stop-title h4').first()).toHaveText('Utah');
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator('.route-card').first().click();
  await page.getByRole('button', { name: 'Make this my adventure' }).click();
  await expect(page.locator('.trip-stop')).toHaveCount(3);
  await expect(page.getByLabel('Notes for Arizona')).toHaveValue('Sunrise stop');
  await page.getByRole('button', { name: 'Remove Nevada' }).click();
  await expect(page.locator('.trip-stop')).toHaveCount(2);
});

test('import previews replacement, rejects invalid files, and clear can be cancelled', async ({
  page,
}) => {
  await page.locator('.header-trip').click();
  const input = page.getByLabel('Import trip file');
  await input.setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{bad json}'),
  });
  await expect(page.getByRole('dialog')).toContainText('Could not read this trip');
  await input.setInputFiles({
    name: 'trip.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        trip: {
          ...EMPTY_TRIP,
          name: 'Island time',
          stops: [{ code: 'HI', days: 7, notes: 'One island' }],
        },
      }),
    ),
  });
  await expect(page.getByText('Imported trip', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Replace with this trip' })).toBeVisible();
  await expect(page.locator('.trip-stop')).toHaveCount(0);
  await page.getByRole('button', { name: 'Replace with this trip' }).click();
  await expect(page.locator('.trip-stop')).toHaveCount(1);
  await expect(page.getByLabel('Notes for Hawaii')).toHaveValue('One island');
  await page.getByRole('button', { name: 'Clear trip', exact: true }).click();
  await page.getByRole('button', { name: 'Keep my trip' }).click();
  await expect(page.locator('.trip-stop')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear trip', exact: true }).click();
  await page.getByRole('button', { name: 'Clear this trip', exact: true }).click();
  await expect(page.locator('.trip-stop')).toHaveCount(0);
});

test('the state map works with keyboard and the 2D toggle', async ({ page }) => {
  await page.locator('#map').scrollIntoViewIfNeeded();
  await expect(page.locator('.map-state')).toHaveCount(50);
  const alaska = page.locator('.usa-map').getByRole('button', { name: 'Alaska', exact: true });
  await alaska.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Alaska', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(alaska).toBeFocused();
  await page.locator('.dimension').click();
  await expect(page.locator('.dimension')).toHaveText('2D');
  await page.getByLabel('Jump to a state').selectOption('RI');
  await expect(page.locator('.map-preview')).toContainText('Rhode Island');
  await page.locator('.map-preview-button').click();
  await expect(page.getByRole('dialog')).toContainText('Newport');
});

test('Thai translation, search and persisted preference render without overflow', async ({
  page,
}) => {
  await page.getByRole('combobox', { name: 'Language / ภาษา' }).selectOption('th');
  await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ค้นพบอเมริกา');
  await page.getByLabel('ค้นหาจุดหมาย', { exact: true }).fill('ฮาวาย');
  await page.getByRole('button', { name: 'ออกไปสำรวจ', exact: true }).click();
  await expect(page.locator('.destination-grid h3')).toHaveText('ฮาวาย');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.locator('.header-trip').click();
  await expect(page.getByRole('dialog')).toContainText('บันทึกอัตโนมัติในเบราว์เซอร์นี้');
});

test('reduced motion, readable guides, focus trapping and mobile navigation', async ({
  page,
  isMobile,
}) => {
  await expect(page.locator('.site')).toHaveAttribute('data-motion', 'paused');
  if (isMobile) {
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Field notes' })
      .click();
    await expect(page.getByRole('button', { name: 'Toggle navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  }
  await page.locator('.guide-card').nth(1).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Separate passes from reservations');
  await expect(dialog.getByRole('link', { name: 'NPS travel tips' })).toHaveAttribute(
    'href',
    'https://www.nps.gov/planyourvisit/travel-tips.htm',
  );
  for (let i = 0; i < 10; i++) await page.keyboard.press('Tab');
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('corrupt local storage recovers without breaking the page', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('roam.trip.v1', '{not-json');
    localStorage.setItem('roam.saved.v1', JSON.stringify(['XX', 'CA', 'CA']));
  });
  await page.reload();
  await page.locator('.header-trip').click();
  await expect(page.getByRole('dialog')).toContainText('Every adventure starts somewhere.');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('roam.saved.v1')!))).toEqual([
    'CA',
  ]);
});

test('narrow phones and tablets retain filters and fit the screen in both languages', async ({
  page,
}) => {
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.getByLabel('Season', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('combobox', { name: 'Language / ภาษา' }).selectOption('th');
    await expect(page.getByLabel('ฤดูกาล', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('combobox', { name: 'Language / ภาษา' }).selectOption('en');
  }
});
