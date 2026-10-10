import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createServer, type ViteDevServer } from 'vite';
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { studioPlugin } from '../studio/server';
import viteConfig from '../vite.config';
import { validateCityContent, cityContentIssues, cityReviewQueue } from '../lib/city-content';
import cityContent from '../content/city-guides.json' with { type: 'json' };
const test = base.extend<{ studio: { url: string; root: string } }>({
  studio: async ({}, use) => {
    const root = await mkdtemp(path.join(tmpdir(), 'roam-studio-test-'));
    await mkdir(path.join(root, 'content'));
    await cp('content/states.json', path.join(root, 'content/states.json'));
    await cp('content/city-guides.json', path.join(root, 'content/city-guides.json'));
    await cp('public/images', path.join(root, 'public/images'), { recursive: true });
    const server: ViteDevServer = await createServer({
      configFile: false,
      mode: 'studio',
      cacheDir: path.join(root, '.vite-cache'),
      optimizeDeps: {
        noDiscovery: true,
        include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      },
      plugins: [
        ...(viteConfig({ mode: 'studio', command: 'serve' }).plugins || []).filter(
          (plugin) =>
            plugin &&
            typeof plugin === 'object' &&
            'name' in plugin &&
            plugin.name === 'catalog-views',
        ),
        studioPlugin(root),
      ],
      server: { host: '127.0.0.1', port: 0, strictPort: false },
    });
    await server.listen();
    const address = server.httpServer!.address();
    if (!address || typeof address === 'string') throw Error('No server address');
    try {
      await use({ url: `http://127.0.0.1:${address.port}`, root });
    } finally {
      await server.close();
      await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  },
});
test('city review queue separates food deadlines, seven-day boundaries and pending languages', () => {
  const content = structuredClone(validateCityContent(cityContent));
  for (const g of content.guides) {
    g.reviewAfter = g.food.reviewAfter = '2027-01-01';
    g.translationsReviewed = g.food.translationsReviewed = [true, true, true, true, true];
  }
  content.guides[0].reviewAfter = '2026-10-09';
  content.guides[0].food.reviewAfter = '2026-10-10';
  content.guides[1].reviewAfter = '2026-10-17';
  content.guides[1].food.reviewAfter = '2026-10-18';
  content.guides[1].food.translationsReviewed = [true, false, true, true, false];
  content.guides[2].reviewAfter = '2026-02-30';
  const before = JSON.stringify(content);
  const queue = cityReviewQueue(content, '2026-10-10');
  expect(queue.filter((r) => r.due).map((r) => [r.placeId, r.section])).toEqual([
    ['NY-0', 'city'],
    ['NY-0', 'food'],
  ]);
  expect(queue.filter((r) => r.soon).map((r) => [r.placeId, r.section])).toEqual([
    ['CA-0', 'city'],
  ]);
  expect(queue.find((r) => r.placeId === 'NV-0' && r.section === 'city')?.undated).toBe(true);
  expect(queue.filter((r) => r.languages.length).map((r) => r.languages)).toEqual([[1, 4]]);
  expect(JSON.stringify(content)).toBe(before);
});

test('city Studio queue opens the relevant section without confirming reviews or losing edits', async ({
  page,
  studio,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-10T12:00:00Z'));
  const content = structuredClone(cityContent);
  for (const g of content.guides) {
    g.checkedAt = g.food.checkedAt = '2026-09-01';
    g.reviewAfter = g.food.reviewAfter = '2027-01-01';
    g.translationsReviewed = g.food.translationsReviewed = [true, true, true, true, true];
  }
  const pa = content.guides[5];
  pa.reviewAfter = '2026-10-10';
  pa.food.reviewAfter = '2026-10-17';
  pa.translationsReviewed = [true, false, true, true, true];
  await writeFile(path.join(studio.root, 'content/city-guides.json'), JSON.stringify(content));
  await page.goto(studio.url + '/studio');
  await page.getByRole('button', { name: 'คู่มือเมืองและอาหาร', exact: true }).click();
  const queue = page.locator('.studio-city-queue');
  await queue.locator('summary').click();
  await expect(queue.locator('summary')).toContainText('1 ถึงกำหนด · 1 ภายใน 7 วัน · 1 รอตรวจภาษา');
  await queue.getByRole('button', { name: /PA-0 · เมือง/ }).click();
  await expect(page.locator('#studio-city-city-heading')).toBeFocused();
  await expect(
    page.locator('.studio-city-review').first().getByLabel('ตรวจครั้งถัดไป'),
  ).toHaveValue('2026-10-10');
  await page.getByRole('textbox', { name: /^คำแนะนำเมือง/ }).fill('งานเมืองที่ยังไม่บันทึก');
  await queue.getByLabel('แสดงคิวตรวจ').selectOption('soon');
  await queue.getByRole('button', { name: /PA-0 · อาหาร/ }).click();
  await expect(page.locator('#studio-city-food-heading')).toBeFocused();
  await expect(page.getByRole('textbox', { name: /^คำแนะนำเมือง/ })).toHaveValue(
    'งานเมืองที่ยังไม่บันทึก',
  );
  await expect(page.locator('.studio-city-review').nth(1).getByLabel('ตรวจครั้งถัดไป')).toHaveValue(
    '2026-10-17',
  );
  await expect(page.locator('.studio-city-review').first().getByRole('checkbox')).not.toBeChecked();
  await expect(page.locator('.studio-city-review').nth(1).getByRole('checkbox')).toBeChecked();
  await queue.getByLabel('แสดงคิวตรวจ').selectOption('languages');
  await expect(queue.getByRole('button')).toHaveCount(1);
  await expect(queue).toContainText('ภาษารอตรวจ: ไทย');
  expect(
    (
      await new AxeBuilder({ page })
        .include('.studio-city-queue')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'บันทึกฉบับร่างเมือง', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('บันทึกฉบับร่างเมืองแล้ว');
  const draft = JSON.parse(
    await readFile(path.join(studio.root, '.studio/city-draft.json'), 'utf8'),
  );
  expect(draft.guides[5].checkedAt).toBe(pa.checkedAt);
  expect(draft.guides[5].reviewAfter).toBe(pa.reviewAfter);
  expect(draft.guides[5].food).toEqual(pa.food);
});
test('city validation rejects unsafe structure and reports independently incomplete reviews', () => {
  expect(cityContentIssues(validateCityContent(cityContent))).toEqual([]);
  for (const mutate of [
    (c: typeof cityContent) => {
      c.guides.pop();
    },
    (c: typeof cityContent) => {
      c.guides[0].placeId = c.guides[1].placeId;
    },
    (c: typeof cityContent) => {
      (c as unknown as { guides: { placeId: unknown }[] }).guides[0].placeId = ['NY-0'];
    },
    (c: typeof cityContent) => {
      c.guides[0].areas[0].source.url = 'javascript:alert(1)';
    },
    (c: typeof cityContent) => {
      c.guides[0].areas[0].source.url = 'https://owner:secret@example.org/';
    },
    (c: typeof cityContent) => {
      c.guides[0].budget.amounts[0][0] = -1;
    },
    (c: typeof cityContent) => {
      c.guides[0].food.stops[0].day = 2;
    },
    (c: typeof cityContent) => {
      c.guides[0].intro.pop();
    },
  ]) {
    const invalid = structuredClone(cityContent);
    mutate(invalid);
    expect(() => validateCityContent(invalid)).toThrow();
  }
  const draft = structuredClone(cityContent);
  draft.guides[0].intro[3] = '';
  draft.guides[0].checkedAt = '2026-02-30';
  draft.guides[0].food.reviewAfter = draft.guides[0].food.checkedAt;
  draft.guides[0].food.stops[0].allowance = [30, 15];
  expect(cityContentIssues(validateCityContent(draft)).map((i) => i.field)).toEqual([
    'guide.intro.3',
    'review',
    'food.review',
    'food.stops.0.allowance',
  ]);
});
test('city Studio retains both editors, five languages, independent food reviews and safe rendered drafts', async ({
  page,
  studio,
}) => {
  test.setTimeout(90_000);
  const stateFile = path.join(studio.root, 'content/states.json');
  const cityFile = path.join(studio.root, 'content/city-guides.json');
  const originalStates = await readFile(stateFile, 'utf8');
  const originalCities = await readFile(cityFile, 'utf8');
  await page.goto(studio.url + '/studio');
  await page
    .getByRole('textbox', { name: 'คำแนะนำรัฐ', exact: true })
    .fill('งานรัฐที่ยังไม่บันทึก');
  await page.getByRole('button', { name: 'คู่มือเมืองและอาหาร', exact: true }).click();
  const languages = page.getByRole('group', { name: 'ภาษาคู่มือเมือง' });
  for (const g of cityContent.guides) {
    await page
      .getByRole('navigation', { name: 'เลือกคู่มือเมือง' })
      .getByRole('button', { name: new RegExp(g.placeId) })
      .click();
    for (const [i, name] of ['English', 'ไทย', '简体中文', '日本語', '한국어'].entries()) {
      await languages.getByRole('button', { name }).click();
      await expect(page.getByRole('textbox', { name: /^คำแนะนำเมือง/ })).toHaveValue(g.intro[i]);
    }
  }
  await page
    .getByRole('navigation', { name: 'เลือกคู่มือเมือง' })
    .getByRole('button', { name: /NY-0/ })
    .click();
  await languages.getByRole('button', { name: 'ไทย' }).click();
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
  const mainReview = page.getByRole('group', { name: 'ตรวจคู่มือเมือง', exact: true });
  const foodReview = page.getByRole('group', { name: 'ตรวจคู่มืออาหาร', exact: true });
  await mainReview.getByRole('checkbox').check();
  await foodReview.getByRole('checkbox').check();
  const mainDate = await mainReview.getByLabel('ตรวจแหล่งข้อมูลแล้ว').inputValue();
  const foodDate = await foodReview.getByLabel('ตรวจแหล่งข้อมูลแล้ว').inputValue();
  await page.getByRole('textbox', { name: /^คำแนะนำอาหาร/ }).fill('อาหารฉบับแก้ไขโดยเจ้าของ');
  await expect(foodReview.getByRole('checkbox')).not.toBeChecked();
  await expect(mainReview.getByRole('checkbox')).toBeChecked();
  await foodReview.getByLabel('ตรวจแหล่งข้อมูลแล้ว').fill('2026-10-11');
  await foodReview.getByLabel('ตรวจครั้งถัดไป').fill('2026-10-18');
  await page
    .getByRole('textbox', { name: /^แผนสำรองตามอากาศ/ })
    .first()
    .fill('แผนฝนตกฉบับร่างที่ตรวจได้');
  await expect(mainReview.getByRole('checkbox')).not.toBeChecked();
  await expect(mainReview.getByLabel('ตรวจแหล่งข้อมูลแล้ว')).toHaveValue(mainDate);
  expect(foodDate).not.toBe('');
  await page.getByRole('button', { name: 'คู่มือรัฐและภาพ', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'คำแนะนำรัฐ', exact: true })).toHaveValue(
    'งานรัฐที่ยังไม่บันทึก',
  );
  await page.getByRole('button', { name: 'บันทึกฉบับร่าง', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('บันทึกฉบับร่างลงเครื่องแล้ว');
  await page.getByRole('button', { name: 'คู่มือเมืองและอาหาร', exact: true }).click();
  await page.getByRole('button', { name: 'บันทึกฉบับร่างเมือง', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('บันทึกฉบับร่างเมืองแล้ว');
  expect(await readFile(stateFile, 'utf8')).toBe(originalStates);
  expect(await readFile(cityFile, 'utf8')).toBe(originalCities);
  await page.reload();
  await page.getByRole('button', { name: 'คู่มือเมืองและอาหาร', exact: true }).click();
  await expect(page.getByRole('textbox', { name: /^คำแนะนำอาหาร/ })).toHaveValue(
    'อาหารฉบับแก้ไขโดยเจ้าของ',
  );
  await languages.getByRole('button', { name: '日本語' }).click();
  const intro = page.getByRole('textbox', { name: /^คำแนะนำเมือง/ });
  const value = await intro.inputValue();
  await intro.fill('');
  await expect(
    page.getByRole('button', { name: 'เผยแพร่คู่มือเมือง', exact: true }),
  ).toBeDisabled();
  await expect(page.locator('.studio-issues:visible')).toContainText('guide.intro.3');
  await intro.fill(value);
  await languages.getByRole('button', { name: 'ไทย' }).click();
  await page.getByRole('button', { name: 'ดูตัวอย่างคู่มือเมือง', exact: true }).click();
  const preview = page.locator('.studio-preview:visible');
  await preview.locator('#guide-city-plan > summary').click();
  await expect(preview.locator('.city-plan-alternative').first()).toContainText(
    'แผนฝนตกฉบับร่างที่ตรวจได้',
  );
  await expect(preview.getByRole('button', { name: /ใช้แผน/ })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('roam.trip.v1'))).toBeNull();
  await page.getByRole('button', { name: 'กลับไปแก้คู่มือเมือง', exact: true }).click();
  await page.getByRole('button', { name: 'เผยแพร่คู่มือเมือง', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('เผยแพร่ลง content/city-guides.json แล้ว');
  const published = JSON.parse(await readFile(cityFile, 'utf8'));
  expect(published.guides[0].food.checkedAt).toBe('2026-10-11');
  expect(published.guides[0].checkedAt).toBe(mainDate);
  expect(published.guides[0].food.intro[1]).toBe('อาหารฉบับแก้ไขโดยเจ้าของ');
  expect(await readFile(stateFile, 'utf8')).toBe(originalStates);
  expect(
    JSON.parse(await readFile(path.join(studio.root, '.studio/draft.json'), 'utf8')).states[0]
      .description[1],
  ).toBe('งานรัฐที่ยังไม่บันทึก');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('city API protects drafts from stale and cross-site writes and blocks incomplete publication', async ({
  request,
  studio,
}) => {
  const url = studio.url + '/api/studio/cities';
  const session = await (await request.get(url)).json();
  const headers = { 'X-Studio-Token': session.token };
  const data = { content: session.content, revision: session.revision };
  expect((await request.put(url + '/draft', { data })).status()).toBe(403);
  expect(
    (
      await request.put(url + '/draft', {
        data,
        headers: { ...headers, Origin: 'https://example.org' },
      })
    ).status(),
  ).toBe(403);
  data.content.guides[0].intro[3] = '';
  const savedResponse = await request.put(url + '/draft', { data, headers });
  expect(savedResponse.status()).toBe(200);
  const saved = await savedResponse.json();
  expect((await request.put(url + '/draft', { data, headers })).status()).toBe(409);
  data.revision = saved.revision;
  expect((await request.post(url + '/publish', { data, headers })).status()).toBe(422);
  expect(await readFile(path.join(studio.root, 'content/city-guides.json'), 'utf8')).toBe(
    await readFile('content/city-guides.json', 'utf8'),
  );
  data.content.guides[0].intro[3] = session.content.guides[0].intro[0];
  data.content.guides[0].areas[0].source.url = 'http://example.org';
  expect((await request.put(url + '/draft', { data, headers })).status()).toBe(400);
  data.content.guides[0].areas[0].source.url = cityContent.guides[0].areas[0].source.url;
  data.content.copy.title[0] = 'Unexpected copy change';
  expect((await request.put(url + '/draft', { data, headers })).status()).toBe(400);
  await writeFile(
    path.join(studio.root, 'content/city-guides.json'),
    JSON.stringify(cityContent) + '\n',
  );
  expect((await request.put(url + '/draft', { data, headers })).status()).toBe(409);
  expect(
    JSON.parse(await readFile(path.join(studio.root, '.studio/city-draft.json'), 'utf8')).guides[0]
      .intro[3],
  ).toBe('');
});
test('studio saves drafts, detects missing translations, previews and publishes a file-backed revision', async ({
  page,
  studio,
}) => {
  await page.goto(studio.url + '/studio');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ทุกจุดหมาย');
  await expect(
    page.getByRole('button', { name: 'เผยแพร่เข้าโปรเจกต์', exact: true }),
  ).toBeEnabled();
  const field = page.getByRole('textbox', { name: 'คำแนะนำรัฐ', exact: true });
  const original = await field.inputValue();
  const caption = page.locator('.studio-photo-captions').first();
  await caption.getByRole('checkbox').check();
  await caption.getByRole('textbox').fill('เกาะอัลคาทราซจากมุมสูง — ฉบับแก้ไข');
  await expect(caption.getByRole('checkbox')).not.toBeChecked();
  await field.fill('เรื่องราวฉบับร่างที่แก้ไขจาก Studio');
  await page.getByRole('button', { name: 'บันทึกฉบับร่าง', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('บันทึกฉบับร่างลงเครื่องแล้ว');
  expect(
    JSON.parse(await readFile(path.join(studio.root, 'content/states.json'), 'utf8')).states[0]
      .description[1],
  ).toBe(original);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'คำแนะนำรัฐ', exact: true })).toHaveValue(
    'เรื่องราวฉบับร่างที่แก้ไขจาก Studio',
  );
  await page.getByRole('button', { name: '日本語' }).click();
  const japanese = await field.inputValue();
  await field.fill('');
  await expect(
    page.getByRole('button', { name: 'เผยแพร่เข้าโปรเจกต์', exact: true }),
  ).toBeDisabled();
  await expect(page.locator('.studio-issues')).toContainText('description.3');
  await field.fill(japanese);
  await page.getByRole('button', { name: 'ดูตัวอย่าง', exact: true }).click();
  await expect(page.locator('.studio-preview h2')).toHaveText('カリフォルニア州');
  await page.getByRole('button', { name: 'กลับไปแก้ไข', exact: true }).click();
  await page.getByRole('button', { name: 'เผยแพร่เข้าโปรเจกต์', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('เผยแพร่ลง content/states.json แล้ว');
  expect(
    JSON.parse(await readFile(path.join(studio.root, 'content/states.json'), 'utf8')).states[0]
      .description[1],
  ).toBe('เรื่องราวฉบับร่างที่แก้ไขจาก Studio');
  const published = JSON.parse(
    await readFile(path.join(studio.root, 'content/states.json'), 'utf8'),
  );
  expect(published.states[0].photos[0].displayCaption[1]).toBe(
    'เกาะอัลคาทราซจากมุมสูง — ฉบับแก้ไข',
  );
  expect(published.states[0].photos[0].captionReviewed[1]).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('studio rejects cross-site writes, stale revisions, invalid image paths and incomplete publication', async ({
  request,
  studio,
}) => {
  const session = await (await request.get(studio.url + '/api/studio')).json();
  const headers = { 'X-Studio-Token': session.token };
  const data = { catalog: session.catalog, revision: session.revision };
  expect((await request.put(studio.url + '/api/studio/draft', { data })).status()).toBe(403);
  expect(
    (
      await request.put(studio.url + '/api/studio/draft', {
        headers: { ...headers, Origin: 'https://example.org' },
        data,
      })
    ).status(),
  ).toBe(403);
  const saved = await (
    await request.put(studio.url + '/api/studio/draft', { headers, data })
  ).json();
  expect(saved.revision).not.toBe(session.revision);
  expect((await request.put(studio.url + '/api/studio/draft', { headers, data })).status()).toBe(
    409,
  );
  data.revision = saved.revision;
  data.catalog.states[0].description[3] = '';
  expect((await request.post(studio.url + '/api/studio/publish', { headers, data })).status()).toBe(
    422,
  );
  data.catalog.states[0].photos[0].src = '/images/../../outside.jpg';
  expect((await request.put(studio.url + '/api/studio/draft', { headers, data })).status()).toBe(
    400,
  );
  expect(
    (
      await request.post(studio.url + '/api/studio/upload', {
        headers,
        data: Buffer.from('<svg onload="alert(1)"/>'),
      })
    ).status(),
  ).toBe(400);
  const bytes = await readFile('public/images/states/ca-1.jpg');
  const uploaded = await request.post(studio.url + '/api/studio/upload', {
    headers: { ...headers, 'Content-Type': 'image/jpeg' },
    data: bytes,
  });
  expect(uploaded.status()).toBe(201);
  const photo = await uploaded.json();
  expect(await readFile(path.join(studio.root, 'public' + photo.src))).toEqual(bytes);
  const updated = await (await request.get(studio.url + '/api/studio')).json();
  updated.catalog.states[0].photos[0].src = '/images/missing.jpg';
  expect(
    (
      await request.post(studio.url + '/api/studio/publish', {
        headers,
        data: { catalog: updated.catalog, revision: updated.revision },
      })
    ).status(),
  ).toBe(422);
  await writeFile(
    path.join(studio.root, 'content/states.json'),
    JSON.stringify(session.catalog) + '\n',
  );
  expect(
    (
      await request.put(studio.url + '/api/studio/draft', {
        headers,
        data: { catalog: updated.catalog, revision: updated.revision },
      })
    ).status(),
  ).toBe(409);
});
