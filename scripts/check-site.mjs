import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

let browser;
try {
  assert.ok(process.argv[2], 'Usage: npm run check:site -- https://your-domain');
  const url = new URL(process.argv[2]);
  assert.ok(
    ['https:', 'http:'].includes(url.protocol) &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password,
    'Use an absolute site origin without a path, query or credentials.',
  );
  const origin = url.origin;
  const langs = ['en', 'th', 'zh', 'ja', 'ko'];
  const catalog = JSON.parse(await readFile('content/states.json', 'utf8'));
  const california = catalog.states.find((state) => state.code === 'CA');
  const samples = [
    { path: '', names: langs.map(() => 'Roam America') },
    { path: 'states/california/', names: california.names },
    { path: 'states/california/big-sur/', names: california.placeNames[2] },
  ];
  browser = await chromium.launch();
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route('**/*', (route) => {
    const request = route.request();
    return new URL(request.url()).origin !== origin ||
      ['image', 'font', 'media', 'script'].includes(request.resourceType())
      ? route.abort()
      : route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const assets = new Set();
  const paths = [];
  for (const [i, lang] of langs.entries()) {
    for (const sample of samples) {
      const path = `/${lang}/${sample.path}`;
      const response = await page.goto(origin + path, { timeout: 15000 });
      assert.equal(response?.status(), 200, `${path}: HTTP status`);
      assert.match(response.headers()['content-type'] || '', /text\/html/, `${path}: HTML`);
      assert.equal(await page.locator('html').getAttribute('lang'), lang, `${path}: language`);
      assert.equal(await page.locator('main h1').count(), 1, `${path}: static guide heading`);
      assert.equal(
        await page.locator('main h1').textContent(),
        sample.names[i],
        `${path}: heading`,
      );
      assert.equal(
        await page.locator('link[rel="canonical"]').count(),
        1,
        `${path}: canonical link; configure SITE_URL and rebuild`,
      );
      assert.equal(
        await page.locator('link[rel="canonical"]').getAttribute('href'),
        origin + path,
        `${path}: canonical origin; configure SITE_URL and rebuild`,
      );
      assert.equal(
        await page.locator('link[rel="alternate"][hreflang]').count(),
        6,
        `${path}: language links`,
      );
      for (const code of [...langs, 'x-default'])
        assert.equal(
          await page.locator(`link[rel="alternate"][hreflang="${code}"]`).getAttribute('href'),
          `${origin}/${code === 'x-default' ? 'en' : code}/${sample.path}`,
          `${path}: ${code} alternate`,
        );
      assert.doesNotMatch(
        (response.headers()['x-robots-tag'] || '') +
          ' ' +
          (await page
            .locator('meta[name="robots"]')
            .evaluateAll((elements) => elements.map((el) => el.getAttribute('content')).join(' '))),
        /noindex|nofollow/i,
        `${path}: public guide indexing`,
      );
      for (const asset of await page
        .locator('script[src],link[rel="stylesheet"]')
        .evaluateAll((elements) =>
          elements.map((el) => el.getAttribute('src') || el.getAttribute('href')),
        ))
        assets.add(new URL(asset, origin).href);
      paths.push(origin + path);
    }
  }
  const get = async (path) => {
    const response = await context.request.get(origin + path, { timeout: 15000 });
    assert.equal(response.status(), 200, `${path}: HTTP status`);
    return response;
  };
  const sitemap = await (await get('/sitemap.xml')).text();
  const locations = await page.evaluate((xml) => {
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    if (document.querySelector('parsererror')) throw Error('Invalid sitemap XML');
    return [...document.querySelectorAll('loc')].map((el) => el.textContent);
  }, sitemap);
  assert.equal(
    new Set(locations).size,
    langs.length * (1 + catalog.states.length * 4),
    'Sitemap coverage',
  );
  assert.equal(locations.length, new Set(locations).size, 'No duplicate sitemap entries');
  assert.ok(
    locations.every((location) => new URL(location).origin === origin),
    'Sitemap origin',
  );
  assert.ok(
    paths.every((path) => locations.includes(path)),
    'Sample pages listed in sitemap',
  );
  const robots = await (await get('/robots.txt')).text();
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`), 'robots.txt sitemap');
  assets.add(origin + '/sw.js');
  for (const asset of assets) {
    assert.equal(new URL(asset).origin, origin, 'Application assets stay on the site origin');
    const response = await context.request.get(asset, { timeout: 15000 });
    assert.equal(response.status(), 200, `${asset}: HTTP status`);
    assert.match(
      response.headers()['content-type'] || '',
      asset.endsWith('.css') ? /text\/css/ : /(?:application|text)\/(?:javascript|ecmascript)/,
      `${asset}: asset MIME type; HTML fallback is not a valid asset`,
    );
  }
  console.log(
    `Passed: ${paths.length} static pages in five languages, SEO links, sitemap, robots.txt and ${assets.size} application assets at ${origin}.`,
  );
} catch (error) {
  console.error(`Site check failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
