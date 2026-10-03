import { test, expect } from '@playwright/test';
import { EMPTY_TRIP } from '../data/travel';
import { LANGUAGES } from '../lib/i18n';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (trip) => {
      if (!localStorage.getItem('roam.trip.v1'))
        localStorage.setItem('roam.trip.v1', JSON.stringify(trip));
    },
    { ...EMPTY_TRIP, name: 'Touch journey', stops: [{ code: 'CA', days: 3, notes: '' }] },
  );
});

test('touch planning survives short viewports, rotation and reload in all languages', async ({
  page,
}) => {
  await page.goto('/en/?view=planner');
  for (const lang of LANGUAGES) {
    await page.getByLabel('Language / ภาษา', { exact: true }).selectOption(lang);
    await page.locator('.add-activity-toggle').tap();
    expect(
      await page
        .locator('.daily-planner input, .daily-planner select')
        .evaluateAll((fields) =>
          fields.every((field) => parseFloat(getComputedStyle(field).fontSize) >= 16),
        ),
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('.add-activity-toggle').tap();
  }
  await page.getByLabel('Language / ภาษา', { exact: true }).selectOption('en');
  await page.locator('.day-strip button').nth(1).tap();
  await page.locator('.add-activity-toggle').tap();
  // A constrained viewport checks occlusion; it does not simulate an OS keyboard.
  await page.setViewportSize({ width: 390, height: 360 });
  await page
    .getByRole('combobox', { name: 'Choose a place or custom activity', exact: true })
    .selectOption('custom');
  const name = page.getByRole('textbox', { name: 'Activity name', exact: true });
  await name.fill('A slow afternoon');
  await expect(page.locator('.day-navigation')).toHaveCSS('position', 'static');
  const submit = page.locator('.add-activity button[type="submit"]');
  await submit.tap();
  await expect(page.locator('.day-activity h5')).toHaveText('A slow afternoon');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.locator('.day-activity').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.locator('.day-strip button').nth(1).tap();
  await expect(page.locator('.day-activity h5')).toHaveText('A slow afternoon');
});

test('guide dialog accepts a focused-field touch submit and dismisses after rotation', async ({
  page,
}) => {
  await page.goto('/en/states/california/san-francisco/');
  const add = page.locator('.hero-primary-action');
  await add.tap();
  const dialog = page.getByRole('dialog', { name: 'Add to daily plan' });
  await expect(dialog).toBeVisible();
  await page.setViewportSize({ width: 390, height: 360 });
  await dialog.getByRole('combobox', { name: 'Day in this state', exact: true }).selectOption('2');
  await dialog.getByLabel('Duration in minutes', { exact: true }).fill('90');
  await dialog.getByRole('button', { name: 'Add activity', exact: true }).tap();
  await expect(dialog).toHaveCount(0);
  const trip = await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!));
  expect(trip.stops[0].activities).toEqual([
    expect.objectContaining({ placeId: 'CA-0', day: 2, minutes: 90 }),
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/states/california/san-francisco/');
  await add.tap();
  await page.setViewportSize({ width: 844, height: 390 });
  await dialog.getByRole('button', { name: 'Close', exact: true }).tap();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await add.tap();
  await expect(dialog).toBeVisible();
});

test('enlarged text keeps narrow-screen navigation and sticky day controls reachable in five languages', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 320, height: 740 });
  const enlargeText = () =>
    page.evaluate(() => {
      // Layout stress check; this does not emulate a phone's OS text-size setting.
      const elements = [...document.body.querySelectorAll('*')].filter(
        (el): el is HTMLElement =>
          el instanceof HTMLElement && !['SCRIPT', 'STYLE'].includes(el.tagName),
      );
      const sizes = elements.map((el) => parseFloat(getComputedStyle(el).fontSize));
      elements.forEach((el, i) => (el.style.fontSize = `${sizes[i] * 2}px`));
    });
  for (const lang of LANGUAGES) {
    await page.goto(`/${lang}/`);
    await expect(page.locator('.state-card').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await enlargeText();
    const menu = page.locator('.menu-button');
    await expect
      .poll(() =>
        page.locator('.header-actions > button, .header select').evaluateAll((controls) =>
          controls
            .filter((el) => el.checkVisibility())
            .every((el) => {
              const rect = el.getBoundingClientRect();
              return rect.left >= 0 && rect.right <= innerWidth;
            }),
        ),
      )
      .toBe(true);
    await menu.tap();
    await expect(page.locator('#main-navigation')).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.querySelector('#main-navigation')!.getBoundingClientRect().top >=
          document.querySelector('.header')!.getBoundingClientRect().bottom - 1,
      ),
    ).toBe(true);
    await menu.tap();
    await page.goto(`/${lang}/?view=planner`);
    await expect(page.locator('.daily-planner')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await enlargeText();
    await page.locator('.day-navigation').scrollIntoViewIfNeeded();
    await page.evaluate(() => scrollBy(0, 200));
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.querySelector('.day-navigation')!.getBoundingClientRect().top >=
            document.querySelector('.header')!.getBoundingClientRect().bottom - 1,
        ),
      )
      .toBe(true);
    await page.locator('.add-activity-toggle').tap();
    await expect(page.locator('.add-activity')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
