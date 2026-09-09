import { test as base, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { studioPlugin } from '../studio/server';
const test = base.extend<{ studio: { url: string; root: string } }>({
  studio: async ({}, use) => {
    const root = await mkdtemp(path.join(tmpdir(), 'roam-studio-test-'));
    await mkdir(path.join(root, 'content'));
    await cp('content/states.json', path.join(root, 'content/states.json'));
    await cp('public/images', path.join(root, 'public/images'), { recursive: true });
    const server: ViteDevServer = await createServer({
      configFile: false,
      mode: 'studio',
      cacheDir: path.join(root, '.vite-cache'),
      optimizeDeps: { entries: ['index.html'] },
      plugins: [studioPlugin(root)],
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
