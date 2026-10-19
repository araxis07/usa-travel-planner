import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { EMPTY_TRIP } from '../data/travel';
import { LANGUAGES } from '../lib/i18n';

test('main page and planner meet automated WCAG 2.2 AA checks', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const audit = () =>
    new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  const home = await audit();
  expect(
    home.violations.map((item) => ({
      id: item.id,
      description: item.description,
      nodes: item.nodes.map((node) => ({ target: node.target, failure: node.failureSummary })),
    })),
  ).toEqual([]);
  await page.locator('.route-card').first().click();
  await page.getByRole('button', { name: 'Make this my adventure' }).click();
  await page.locator('.trip-readiness summary').click();
  const planner = await audit();
  expect(
    planner.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({ target: node.target, failure: node.failureSummary })),
    })),
  ).toEqual([]);
});

for (const lang of LANGUAGES) {
  test(`${lang} text contrast across discovery, guides, dialogs and planning`, async ({
    page,
    isMobile,
  }) => {
    test.setTimeout(60000);
    if (isMobile) await page.setViewportSize({ width: 320, height: 740 });
    await page.addInitScript(
      (trip) => {
        localStorage.setItem('roam.trip.v1', JSON.stringify(trip));
      },
      {
        ...EMPTY_TRIP,
        name: 'Readability review',
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
        budgetMode: 'items',
        expenses: [{ id: 'hotel', name: 'Hotel', category: 'lodging', planned: 300, paid: 100 }],
      },
    );
    const audit = async (surface: string) => {
      await page.evaluate(() => document.fonts.ready);
      const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      expect
        .soft(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          surface,
        )
        .toBe(true);
      expect
        .soft(
          results.violations.map((v) => ({
            surface,
            nodes: v.nodes.map((n) => ({ target: n.target, detail: n.failureSummary })),
          })),
        )
        .toEqual([]);
    };
    await page.goto(`/${lang}/`);
    await expect(page.locator('.state-card').first()).toBeVisible();
    expect(
      await page
        .locator('.card-over-image h3')
        .evaluateAll((headings) =>
          headings.every((heading) => heading.scrollWidth <= heading.clientWidth),
        ),
    ).toBe(true);
    await audit('home');
    await page.locator('.card-quick-view').first().click();
    await expect(page.locator('.state-detail')).toBeVisible();
    await audit('quick view');
    await page.keyboard.press('Escape');
    await page.locator('.discovery-view-bar .segmented button').nth(1).click();
    await expect(page.locator('.discovery-place').first()).toBeVisible();
    await audit('places');
    await page.goto(`/${lang}/states/california/`);
    await expect(page.locator('.place-story').first()).toBeVisible();
    await audit('state guide');
    await page.goto(`/${lang}/states/california/big-sur/`);
    await expect(page.locator('.place-practical')).toBeVisible();
    await audit('place guide');
    await page.locator('.destination-gallery-open').click();
    await expect(page.locator('.photo-lightbox')).toBeVisible();
    await audit('gallery');
    await page.keyboard.press('Escape');
    await page.goto(`/${lang}/?view=planner`);
    await expect(page.locator('.planner-tabs')).toBeVisible();
    await page.locator('.planner-tabs button').first().click();
    await audit('trip overview');
    await page.locator('.planner-tabs button').nth(1).click();
    await expect(page.locator('.daily-planner')).toBeVisible();
    await audit('daily plan');
    await page.locator('.planner-tabs button').nth(2).click();
    await expect(page.locator('.trip-budget')).toBeVisible();
    await audit('budget');
  });
}

test('photo labels remain readable on white images and card focus stays inside its clipped frame', async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Explore all 50 states', exact: true }).click();
  await expect(page.locator('.state-card')).toHaveCount(50);
  const whiteImages = await page.addStyleTag({
    content: `
    .state-card-visual, .detail-cover, .route-card { background: #fff !important; }
    .state-card-visual img, .detail-cover img, .route-card > img { visibility: hidden !important; }
    .card-image-button::after, .detail-cover::after, .route-card::after { background: none !important; }
  `,
  });
  for (const lang of LANGUAGES) {
    await page.getByLabel('Language / ภาษา', { exact: true }).selectOption(lang);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.locator('.state-card').evaluateAll((cards) =>
        cards.flatMap((card) => {
          const heading = card.querySelector('h3')!;
          const caption = card.querySelector('.card-over-image')!.getBoundingClientRect();
          const badge = card.querySelector('.card-region')!.getBoundingClientRect();
          return heading.scrollWidth <= heading.clientWidth && caption.top >= badge.bottom
            ? []
            : [
                {
                  name: heading.textContent,
                  captionTop: caption.top,
                  badgeBottom: badge.bottom,
                  width: heading.clientWidth,
                  textWidth: heading.scrollWidth,
                },
              ];
        }),
      ),
      lang,
    ).toEqual([]);
    const cards = await new AxeBuilder({ page })
      .include('.card-region')
      .include('.card-over-image')
      .include('.route-days')
      .include('.route-card-content')
      .withRules(['color-contrast'])
      .analyze();
    expect(cards.violations, lang).toEqual([]);
    expect(cards.incomplete, lang).toEqual([]);
    const routeOverflow = await page.locator('.route-card').evaluateAll((routes) =>
      routes.flatMap((route) => {
        const elements = [...route.querySelectorAll<HTMLElement>('*')];
        const sizes = elements.map((el) => parseFloat(getComputedStyle(el).fontSize));
        elements.forEach((el, i) => (el.style.fontSize = `${sizes[i] * 2}px`));
        const card = route.getBoundingClientRect();
        const panel = route.querySelector('.route-card-content')!.getBoundingClientRect();
        const badge = route.querySelector('.route-days')!.getBoundingClientRect();
        const fits =
          panel.bottom <= card.bottom &&
          panel.top >= badge.bottom &&
          elements.every((el) => el.scrollWidth <= el.clientWidth);
        elements.forEach((el) => el.style.removeProperty('font-size'));
        return fits ? [] : [route.textContent];
      }),
    );
    expect(routeOverflow, `${lang} doubled itinerary-card text`).toEqual([]);
    await page.locator('.card-quick-view').first().click();
    await expect(page.locator('.detail-cover > div')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const cover = await new AxeBuilder({ page })
      .include('.detail-cover > div')
      .withRules(['color-contrast'])
      .analyze();
    expect(cover.violations, lang).toEqual([]);
    expect(cover.incomplete, lang).toEqual([]);
    await page.keyboard.press('Escape');
  }
  await whiteImages.evaluate((el) => el.parentNode?.removeChild(el));
  const card = page.locator('.state-card .card-image-button').first();
  await card.focus();
  await expect(card).toBeFocused();
  expect(
    await card.evaluate((el) => {
      const style = getComputedStyle(el);
      return (
        style.outlineStyle !== 'none' &&
        parseFloat(style.outlineWidth) >= 3 &&
        parseFloat(style.outlineOffset) < 0
      );
    }),
  ).toBe(true);
});

test('long English state names keep whole words on narrow discovery and saved cards', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('roam.saved.v1', JSON.stringify(['WA', 'MA', 'PA'])),
  );
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Explore all 50 states', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 740 });
    for (const selector of ['.destination-grid', '.saved-grid']) {
      if (selector === '.saved-grid') {
        await page
          .locator('.footer-links')
          .getByRole('button', { name: 'Saved places', exact: true })
          .click();
      }
      const headings = page.locator(`${selector} .card-over-image h3`);
      await expect(headings).toHaveCount(selector === '.saved-grid' ? 3 : 50);
      const splitWords = await headings.evaluateAll((headings) =>
        headings.flatMap((heading) => {
          const node = heading.firstChild!;
          return [...node.textContent!.matchAll(/[A-Za-z]+/g)].flatMap((match) => {
            const range = document.createRange();
            range.setStart(node, match.index!);
            range.setEnd(node, match.index! + match[0].length);
            return range.getClientRects().length > 1 ? [match[0]] : [];
          });
        }),
      );
      expect(splitWords, `${width}px ${selector} state names`).toEqual([]);
      if (selector === '.saved-grid') await page.keyboard.press('Escape');
    }
  }
});
