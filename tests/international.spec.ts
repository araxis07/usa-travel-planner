import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { contentIssues, validateCatalog } from '../lib/content';
import { LANGUAGES, translate } from '../lib/i18n';
const catalog = validateCatalog(
  JSON.parse(readFileSync(new URL('../content/states.json', import.meta.url), 'utf8')),
);

test('all published content has five languages and three credited local destination photographs', () => {
  expect(contentIssues(catalog)).toEqual([]);
  for (const state of catalog.states) {
    expect(state.photos.length).toBeGreaterThanOrEqual(3);
    expect(new Set(state.photos.map((p) => p.placeIndex)).size).toBe(3);
    expect(state.photos.every((photo) => photo.displayCaption?.length === 5)).toBe(true);
    for (let index = 0; index < 3; index++) {
      const photos = state.photos.filter((p) => p.placeIndex === index);
      expect(photos).toHaveLength(3);
      for (let lang = 0; lang < 5; lang++) {
        const captions = photos.map((p) => p.displayCaption![lang]);
        expect(new Set(captions).size).toBe(3);
        expect(
          captions.every(
            (caption) => !/photograph \d|ภาพที่ \d|照片 \d|写真 \d|사진 \d/.test(caption),
          ),
        ).toBe(true);
      }
      expect(state.destinations[index].officialUrl).not.toContain('visittheusa.com/destinations/');
      expect(state.destinations[index].access[0]).not.toContain(
        'Group nearby sights into a walkable neighborhood.',
      );
    }
    for (const text of [
      state.names,
      state.description,
      state.food,
      state.tip,
      ...state.placeNames,
    ]) {
      expect(text).toHaveLength(5);
      expect(text.every((t) => t.trim().length > 0)).toBe(true);
    }
    for (const photo of state.photos)
      expect(
        readFileSync(new URL('../public' + photo.src, import.meta.url)).byteLength,
      ).toBeGreaterThan(3000);
  }
  const invalid = structuredClone(catalog);
  invalid.states[0].photos[0].src = '/images/../../secret.jpg';
  expect(() => validateCatalog(invalid)).toThrow();
  invalid.states[0].photos[0].src = '/images/states/ca-1.jpg';
  invalid.states[0].photos[0].source = 'javascript:alert(1)';
  expect(() => validateCatalog(invalid)).toThrow();
});
for (const [lang, headline, name] of [
  ['zh', '寻找你的', '加利福尼亚州'],
  ['ja', 'あなたらしい', 'カリフォルニア州'],
  ['ko', '나만의', '캘리포니아주'],
] as const) {
  test(`${lang} localizes discovery, open galleries, planner exports and remembered language`, async ({
    page,
  }) => {
    await page.goto('/?lang=' + lang);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(headline);
    await expect(page.getByRole('combobox', { name: 'Language / ภาษา' })).toHaveValue(lang);
    await page.locator('.destination-grid .card-quick-view').first().click();
    let dialog = page.getByRole('dialog');
    await expect(dialog).toHaveAccessibleName(name);
    await expect(dialog.locator('.photo-gallery button')).toHaveCount(
      catalog.states[0].photos.length,
    );
    await dialog.locator('.photo-gallery button').nth(1).click();
    const src = await dialog.locator('.detail-cover img').getAttribute('src');
    await dialog.getByRole('combobox', { name: 'Language / ภาษา' }).selectOption('en');
    await expect(dialog).toHaveAccessibleName('California');
    await expect(dialog.locator('.detail-cover img')).toHaveAttribute('src', src!);
    await dialog.getByRole('combobox', { name: 'Language / ภาษา' }).selectOption(lang);
    const add = translate('Add to my trip', 'เพิ่มในทริปของฉัน', lang);
    await dialog.getByRole('button', { name: add, exact: true }).click();
    dialog = page.locator('#planner-page');
    await expect(dialog.locator('.stop-places')).not.toContainText('San Francisco');
    const notes = dialog.locator('textarea').first();
    await notes.fill('My own café note');
    const downloadPromise = page.waitForEvent('download');
    await dialog
      .getByRole('button', { name: translate('Download my itinerary', 'ดาวน์โหลดแผนเที่ยว', lang) })
      .click();
    const download = await downloadPromise;
    const file = await download.path();
    const output = readFileSync(file!, 'utf8');
    expect(output).toContain(name);
    expect(output).toContain('My own café note');
    expect(output).not.toContain('Daily budget per traveler');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('roam.trip.v1')!).stops[0].notes),
    ).toBe('My own café note');
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
    for (const width of [360, 768]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  });
}
test('cross-language place search works regardless of the current interface language', async ({
  page,
}) => {
  await page.goto('/?lang=en');
  for (const [term, name] of [
    ['纽约', 'New York'],
    ['ヨセミテ', 'California'],
    ['하와이', 'Hawaii'],
    ['ซานฟรานซิสโก', 'California'],
  ]) {
    await page.getByRole('textbox', { name: 'Search destinations' }).fill(term);
    await page.getByRole('button', { name: 'Let’s explore' }).click();
    await expect(page.locator('.destination-grid h3')).toHaveText(name);
  }
  await page.goto('/?lang=ko');
  await page.goto('/?lang=ja');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
});
test('all fifty states load real covers and every language keeps the atlas available', async ({
  page,
}) => {
  await page.goto('/?lang=en');
  await page.getByRole('button', { name: 'Explore all 50 states', exact: true }).click();
  const images = page.locator('.destination-grid .card-image-button img');
  await expect(images).toHaveCount(50);
  await images.evaluateAll((elements) =>
    Promise.all(
      elements.map(async (node) => {
        const image = node as HTMLImageElement;
        image.loading = 'eager';
        await image.decode();
      }),
    ),
  );
  await page.locator('#map').scrollIntoViewIfNeeded();
  for (const lang of LANGUAGES) {
    await page.getByRole('combobox', { name: 'Language / ภาษา' }).selectOption(lang);
    await expect(page.locator('#map svg.usa-map')).toHaveCount(1);
  }
});
