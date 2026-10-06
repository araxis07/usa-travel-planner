import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { contentIssues, validateCatalog } from '../lib/content';
import { LANGUAGES, LOCALES, translate } from '../lib/i18n';
import cityContent from '../content/city-guides.json' with { type: 'json' };
import preparation from '../content/travel-preparation.json' with { type: 'json' };
import { EXPERIENCE_COPY } from '../data/experience-copy';
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
test('updated access notices stay readable and linked on a narrow screen in all languages', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const [path, code, index] of [
    ['/en/states/california/big-sur/', 'CA', 2],
    ['/en/states/arizona/grand-canyon-south-rim/', 'AZ', 0],
    ['/en/states/hawaii/hawaii-volcanoes-national-park/', 'HI', 1],
    ['/en/states/hawaii/kauai/', 'HI', 2],
    ['/en/states/utah/zion-national-park/', 'UT', 0],
    ['/en/states/alaska/denali-national-park/', 'AK', 0],
    ['/en/states/nevada/valley-of-fire-state-park/', 'NV', 1],
    ['/en/states/oregon/crater-lake-national-park/', 'OR', 2],
    ['/en/states/wisconsin/apostle-islands-national-lakeshore/', 'WI', 2],
  ] as const) {
    const profile = catalog.states.find((state) => state.code === code)!.destinations[index];
    await page.goto(path);
    for (const [i, lang] of LANGUAGES.entries()) {
      await page.getByLabel('Language / ภาษา').selectOption(lang);
      await expect(page.locator('.guide-advisory p')).toHaveText(profile.advisory!.text[i]);
      await expect(page.locator('.guide-advisory a')).toHaveAttribute(
        'href',
        profile.advisory!.source,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
});
test('dated access notices warn visitors when their saved check becomes stale', async ({
  page,
}) => {
  const checkedAt = catalog.states.find((state) => state.code === 'OR')!.destinations[2].advisory!
    .checkedAt;
  await page.clock.setFixedTime(new Date(Date.parse(checkedAt) + 8 * 86400000));
  await page.goto('/en/states/oregon/crater-lake-national-park/');
  await expect(page.locator('.guide-advisory .fine-print')).toContainText('over 7 days old');
  await expect(page.locator('.guide-advisory a')).toHaveAttribute(
    'href',
    'https://www.nps.gov/crla/planyourvisit/conditions.htm',
  );
});
test('city guides localize neighborhood links, airport steps and complete group budgets', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 320, height: 740 });
  const cities = [
    { path: 'new-york/new-york-city', totals: [850, 1440, 2310] },
    { path: 'california/san-francisco', totals: [800, 1340, 2170] },
    { path: 'nevada/las-vegas', totals: [560, 1010, 1920] },
    { path: 'massachusetts/boston', totals: [730, 1270, 2050] },
    { path: 'illinois/chicago', totals: [620, 1140, 1920] },
    { path: 'pennsylvania/philadelphia', totals: [630, 1140, 1880] },
  ];
  for (const [city, info] of cities.entries()) {
    const guide = cityContent.guides[city];
    for (const [l, lang] of LANGUAGES.entries()) {
      await page.goto(`/${lang}/states/${info.path}/`);
      const section = page.locator('#guide-city');
      await expect(section).toContainText(guide.intro[l]);
      await page.locator('.guide-toc a[href="#guide-city"]').click();
      const area = section.locator(':scope > details').first();
      await area.locator('summary').press('Enter');
      await expect(area).toContainText(guide.areas[0].text[l]);
      const url = new URL((await area.locator('a').first().getAttribute('href'))!);
      expect(url.searchParams.get('query')).toBe(guide.areas[0].mapQuery);
      for (let i = 0; i < guide.days.length; i++) {
        const day = guide.days[i];
        const item = section.locator('.city-day').nth(i);
        if (i) await item.locator('summary').press('Enter');
        await expect(item).toContainText(day.alternative[l]);
        if ('source' in day)
          await expect(item.locator('a')).toHaveAttribute('href', day.source.url);
      }
      await page.locator('.guide-toc a[href="#guide-airport"]').click();
      await expect(section.locator('.city-airport-steps li')).toHaveCount(3);
      await expect(page.locator('#guide-airport')).toContainText(guide.airport.fare[l]);
      await expect(page.locator('#guide-airport')).toContainText(guide.reviewAfter);
      await page.locator('.guide-toc a[href="#guide-city-budget"]').click();
      await expect(page.locator('#guide-city-budget')).toContainText(
        cityContent.copy.assumptions[l],
      );
      for (const [i, total] of info.totals.entries()) {
        const budget = section.locator('.city-budget').nth(i);
        await budget.locator('summary').press('Enter');
        await expect(budget.locator('dl > div')).toHaveCount(7);
        const money = (n: number) =>
          new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'USD' }).format(n);
        await expect(budget.locator('.city-budget-total dd')).toHaveText(money(total));
        await expect(budget.locator('dd').last()).toHaveText(money(total / 2));
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (lang === 'en') {
        const audit = await new AxeBuilder({ page })
          .include('#guide-city')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(audit.violations).toEqual([]);
      }
      await section.evaluate((el) => {
        const nodes = [...el.querySelectorAll('*')].filter(
          (node): node is HTMLElement => node instanceof HTMLElement,
        );
        const sizes = nodes.map((node) => parseFloat(getComputedStyle(node).fontSize));
        nodes.forEach((node, i) => (node.style.fontSize = `${sizes[i] * 2}px`));
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  await page.clock.setFixedTime(new Date('2026-10-14T00:00:00Z'));
  await page.reload();
  await expect(page.locator('#guide-airport .day-warning')).toHaveText(cityContent.copy.stale[4]);
  await page.goto('/en/states/nevada/valley-of-fire-state-park/');
  await expect(page.locator('#guide-city')).toHaveCount(0);
});
test('food stops follow each day with localized allowances, sources and independent review dates', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.clock.setFixedTime(new Date('2026-10-06T03:00:00Z'));
  await page.setViewportSize({ width: 320, height: 740 });
  const paths = [
    'new-york/new-york-city',
    'california/san-francisco',
    'nevada/las-vegas',
    'massachusetts/boston',
    'illinois/chicago',
    'pennsylvania/philadelphia',
  ];
  for (const [city, path] of paths.entries()) {
    const guide = cityContent.guides[city];
    const food = 'food' in guide ? guide.food! : undefined;
    expect(food).toBeTruthy();
    for (const [l, lang] of LANGUAGES.entries()) {
      await page.goto(`/${lang}/states/${path}/`);
      await page.locator('.guide-toc a[href="#guide-food"]').click();
      const section = page.locator('#guide-food');
      await expect(section.getByRole('heading')).toHaveText(cityContent.copy.food[l]);
      await expect(section).toContainText(food!.intro[l]);
      await expect(section).toContainText(cityContent.copy.foodAssumptions[l]);
      await expect(section).toContainText(food!.vegetarian[l]);
      await expect(section.locator('time').first()).toHaveAttribute('datetime', '2026-10-06');
      await expect(section.locator('time').last()).toHaveAttribute('datetime', '2026-10-13');
      await expect(page.locator('#guide-airport time').first()).toHaveAttribute(
        'datetime',
        guide.checkedAt,
      );
      await expect(section.locator('.day-warning')).toHaveCount(0);
      await expect(section.locator('details')).toHaveCount(3);
      for (const [i, stop] of food!.stops.entries()) {
        const item = section.locator('details').nth(i);
        if (i) await item.locator('summary').press('Enter');
        await expect(item).toHaveAttribute('open', '');
        await expect(item.locator('summary')).toHaveText(
          cityContent.copy.day[l].replace('{day}', String(i + 1)) + ' · ' + stop.title[l],
        );
        await expect(item).toContainText(stop.text[l]);
        const money = (n: number) =>
          new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'USD' }).format(n);
        await expect(item.locator('.city-meal-allowance')).toHaveText(
          `${cityContent.copy.mealAllowance[l]}: ${money(stop.allowance[0])}–${money(stop.allowance[1])}`,
        );
        const url = new URL((await item.locator('a').first().getAttribute('href'))!);
        expect(url.searchParams.get('query')).toBe(stop.mapQuery);
        await expect(item.locator('a').last()).toHaveAttribute('href', stop.source.url);
        await expect(item.locator('a').last()).toHaveAttribute('rel', 'noreferrer');
      }
      if (lang === 'en') {
        const audit = await new AxeBuilder({ page })
          .include('#guide-food')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(audit.violations).toEqual([]);
      }
      await section.evaluate((el) => {
        const nodes = [...el.querySelectorAll('*')].filter(
          (node): node is HTMLElement => node instanceof HTMLElement,
        );
        const sizes = nodes.map((node) => parseFloat(getComputedStyle(node).fontSize));
        nodes.forEach((node, i) => (node.style.fontSize = `${sizes[i] * 2}px`));
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  await page.clock.setFixedTime(new Date('2026-10-13T00:00:00Z'));
  await page.reload();
  await expect(page.locator('#guide-food .day-warning')).toHaveText(cityContent.copy.foodStale[4]);
  await page.goto('/en/states/nevada/valley-of-fire-state-park/');
  await expect(page.locator('#destination-guide')).toBeVisible();
  await expect(page.locator('#guide-food')).toHaveCount(0);
  await expect(page.locator('.guide-toc a[href="#guide-food"]')).toHaveCount(0);
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

test('park booking requirements stay distinct, dated and accessible in every language', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.clock.setFixedTime(new Date('2026-10-04T03:00:00Z'));
  await page.setViewportSize({ width: 320, height: 740 });
  const paths = [
    'california/yosemite-national-park',
    'utah/zion-national-park',
    'arizona/grand-canyon-south-rim',
    'colorado/rocky-mountain-national-park',
    'wyoming/yellowstone-national-park',
  ];
  for (const [p, guide] of preparation.parks.entries()) {
    for (const [l, lang] of LANGUAGES.entries()) {
      await page.goto(`/${lang}/states/${paths[p]}/`);
      const section = page.locator('#guide-booking');
      await expect(section.getByRole('heading')).toHaveText(preparation.copy.bookingTitle[l]);
      await expect(section).toContainText(guide.checkedAt);
      await expect(section).toContainText(guide.reviewAfter);
      for (const [i, detail] of guide.sections.entries()) {
        const item = section.locator('details').nth(i);
        if (i > 1) await item.locator('summary').press('Enter');
        await expect(item).toHaveAttribute('open', '');
        await expect(item.locator('summary')).toHaveText(preparation.copy.rows[i][l]);
        await expect(item).toContainText(detail.text[l]);
        for (const [s, source] of detail.sources.entries()) {
          await expect(item.locator('a').nth(s)).toHaveAttribute('href', source.url);
          await expect(item.locator('a').nth(s)).toHaveAttribute('rel', 'noreferrer');
        }
      }
      if (guide.notice) await expect(section.locator('aside')).toContainText(guide.notice.text[l]);
      const profile = catalog.states
        .flatMap((state) => state.destinations)
        .find((item) => item.id === guide.placeId)!;
      if (profile.advisory)
        await expect(page.locator('.guide-advisory')).toContainText(profile.advisory.text[l]);
      if (guide.placeId === 'CO-0') {
        await expect(section.locator('details').nth(1)).toContainText(/09:00[–〜~]14:00/);
        await expect(section.locator('details').nth(1)).toContainText(/05:00[–〜~]18:00/);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (lang === 'en') {
        const audit = await new AxeBuilder({ page })
          .include('#guide-booking')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(audit.violations).toEqual([]);
      }
      await section.evaluate((el) => {
        const nodes = [...el.querySelectorAll<HTMLElement>('*')];
        const sizes = nodes.map((node) => parseFloat(getComputedStyle(node).fontSize));
        nodes.forEach((node, i) => (node.style.fontSize = `${sizes[i] * 2}px`));
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  await page.clock.setFixedTime(new Date('2026-10-12T00:00:00Z'));
  await page.reload();
  await expect(page.locator('#guide-booking > .day-warning')).toHaveText(preparation.copy.stale[4]);
  await page.goto('/en/states/california/san-francisco/');
  await expect(page.locator('#guide-city')).toBeVisible();
  await expect(page.locator('#guide-booking')).toHaveCount(0);
});

test('first-trip field note covers nine preparation topics in all five languages', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-04T03:00:00Z'));
  await page.setViewportSize({ width: 320, height: 740 });
  for (const [l, lang] of LANGUAGES.entries()) {
    await page.goto('/?lang=' + lang);
    await page.locator('.guide-card').first().click();
    const guide = page.locator('.guide-detail');
    const categoryTop = await guide.locator(':scope > .eyebrow').evaluate((el) => {
      const text = document.createRange();
      text.selectNodeContents(el);
      return text.getBoundingClientRect().top;
    });
    const language = await page.locator('.dialog-language').boundingBox();
    expect(categoryTop).toBeGreaterThanOrEqual(language!.y + language!.height);
    await expect(guide.locator('section')).toHaveCount(9);
    for (const [i, section] of preparation.firstTrip.sections.entries()) {
      await expect(guide.locator('section').nth(i).getByRole('heading')).toHaveText(
        section.title[l],
      );
      await expect(guide.locator('section').nth(i)).toContainText(section.text[l]);
    }
    await expect(guide.locator('.guide-section-number').last()).toHaveText('09');
    await expect(guide.locator('.content-date')).toContainText('2026-10-11');
    await expect(guide.locator('.day-warning')).toHaveCount(0);
    for (const [i, source] of preparation.firstTrip.sources.entries()) {
      await expect(guide.locator('.guide-sources a').nth(i)).toHaveAttribute('href', source.url);
    }
    if (lang === 'en') {
      const audit = await new AxeBuilder({ page })
        .include('.guide-detail')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(audit.violations).toEqual([]);
      expect(
        await guide
          .locator('section p')
          .first()
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeGreaterThanOrEqual(15);
    }
    await guide.evaluate((el) => {
      const nodes = [...el.querySelectorAll<HTMLElement>('*')];
      const sizes = nodes.map((node) => parseFloat(getComputedStyle(node).fontSize));
      nodes.forEach((node, i) => (node.style.fontSize = `${sizes[i] * 2}px`));
    });
    expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.clock.setFixedTime(new Date('2026-10-12T00:00:00Z'));
  await page.locator('.guide-card').first().click();
  await expect(page.locator('.guide-detail .day-warning')).toHaveText(preparation.copy.stale[4]);
});

test('Northeast rail guide preserves station details, dated alerts and all five languages', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-06T03:00:00Z'));
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/en/');
  await expect(page.locator('.guide-card')).toHaveCount(7);
  await page
    .locator('.guide-topics')
    .getByRole('button', { name: 'Between cities', exact: true })
    .click();
  const card = page.locator('.guide-card').last();
  await card.press('Enter');
  const guide = page.locator('.guide-detail');
  for (const [l, lang] of LANGUAGES.entries()) {
    await page.locator('.dialog-language select').selectOption(lang);
    await expect(page.getByRole('dialog')).toHaveAccessibleName(preparation.copy.intercityTitle[l]);
    await expect(guide.locator('section')).toHaveCount(8);
    for (const [i, section] of preparation.intercity.sections.entries()) {
      await expect(guide.locator('section').nth(i).getByRole('heading')).toHaveText(
        section.title[l],
      );
      await expect(guide.locator('section').nth(i)).toContainText(section.text[l]);
    }
    for (const code of ['BOS', 'NYP', 'PHL'])
      await expect(guide.locator('section').first()).toContainText(code);
    await expect(guide.locator('.content-date time').first()).toHaveAttribute(
      'datetime',
      preparation.intercity.checkedAt,
    );
    await expect(guide.locator('.content-date time').last()).toHaveAttribute(
      'datetime',
      preparation.intercity.reviewAfter,
    );
    await expect(guide.locator(':scope > p.day-warning')).toHaveCount(0);
    await expect(guide.locator('aside')).toContainText(preparation.intercity.notice.text[l]);
    await expect(guide.locator('aside a')).toHaveAttribute(
      'href',
      preparation.intercity.notice.source.url,
    );
    await expect(guide.locator('.guide-sources a')).toHaveCount(
      preparation.intercity.sources.length,
    );
    for (const [i, source] of preparation.intercity.sources.entries()) {
      await expect(guide.locator('.guide-sources a').nth(i)).toHaveAttribute('href', source.url);
      await expect(guide.locator('.guide-sources a').nth(i)).toHaveAttribute('rel', 'noreferrer');
    }
    if (lang === 'en') {
      const audit = await new AxeBuilder({ page })
        .include('.guide-detail')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(audit.violations).toEqual([]);
    }
  }
  await guide.evaluate((el) => {
    const nodes = [...el.querySelectorAll<HTMLElement>('*')];
    const sizes = nodes.map((node) => parseFloat(getComputedStyle(node).fontSize));
    nodes.forEach((node, i) => (node.style.fontSize = `${sizes[i] * 2}px`));
  });
  expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.keyboard.press('Escape');
  await expect(card).toBeFocused();
  await page.clock.setFixedTime(new Date('2026-10-13T00:00:00Z'));
  await card.press('Enter');
  await expect(guide.locator(':scope > p.day-warning')).toHaveText(preparation.copy.stale[4]);
});

test('guide topics keep all seven notes reachable and remember the chosen topic in five languages', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const [l, lang] of LANGUAGES.entries()) {
    await page.goto('/' + lang + '/');
    const topics = page.locator('.guide-topics');
    await topics.getByRole('button', { name: EXPERIENCE_COPY.guideAll[l], exact: true }).click();
    await expect(page.locator('.guide-card:visible')).toHaveCount(3);
    await page.locator('.more-field-notes > summary').press('Enter');
    await expect(page.locator('.guide-card:visible')).toHaveCount(7);
    await topics.getByRole('button', { name: EXPERIENCE_COPY.guideNature[l], exact: true }).click();
    await expect(page.locator('.guide-card')).toHaveCount(2);
    await expect(page.locator('.guide-result-count')).toHaveText(
      EXPERIENCE_COPY.guideCount[l].replace('{count}', '2'),
    );
    await topics
      .getByRole('button', { name: EXPERIENCE_COPY.guideTransport[l], exact: true })
      .click();
    const selected = topics.getByRole('button', {
      name: EXPERIENCE_COPY.guideTransport[l],
      exact: true,
    });
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.guide-card').last().press('Enter');
    await expect(page.getByRole('dialog')).toHaveAccessibleName(preparation.copy.intercityTitle[l]);
    await page.keyboard.press('Escape');
    await expect(page.locator('.guide-card').last()).toBeFocused();
    await page.reload();
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.guide-card')).toHaveCount(2);
    if (lang === 'en') {
      const audit = await new AxeBuilder({ page })
        .include('#guides')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(audit.violations).toEqual([]);
    }
    await page.locator('#guides').evaluate((el) => {
      const nodes = [...el.querySelectorAll<HTMLElement>('*')];
      const sizes = nodes.map((node) => parseFloat(getComputedStyle(node).fontSize));
      nodes.forEach((node, i) => (node.style.fontSize = `${sizes[i] * 2}px`));
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
