import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
const outDir = process.argv[2] || 'dist';
const env = loadEnv('production', process.cwd(), '');
const configured = process.env.SITE_URL || env.SITE_URL || '';
let origin = '';
if (configured) {
  const url = new URL(configured);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw Error('SITE_URL must be an absolute site origin, without a path or credentials');
  origin = url.origin;
}
const langs = ['en', 'th', 'zh', 'ja', 'ko'];
const labels = ['English', 'ไทย', '简体中文', '日本語', '한국어'];
const catalog = JSON.parse(await readFile('content/states.json', 'utf8'));
const template = await readFile(outDir + '/index.html', 'utf8');
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const slug = (name) =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036fʻ’']/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const pagePath = (lang, state, index) =>
  `/${lang}/${state ? `states/${slug(state.name)}/${index === undefined ? '' : `${slug(state.places[index])}/`}` : ''}`;
const descriptions = [
  'Explore all 50 U.S. states and 150 destinations. Plan each day, compare places and save your own American adventure.',
  'สำรวจอเมริกาครบ 50 รัฐและ 150 จุดหมาย วางแผนรายวัน เปรียบเทียบสถานที่ และบันทึกทริปของคุณ',
  '探索美国50个州与150个目的地，安排每日行程、比较景点并保存旅行计划。',
  'アメリカ全50州と150の目的地を探索。日ごとの旅を計画し、行き先を比較して保存できます。',
  '미국 50개 주와 150개 여행지를 둘러보세요. 일별 여행을 계획하고 장소를 비교하며 일정을 저장하세요.',
];
const pages = [];
function render(lang, state, index) {
  const l = langs.indexOf(lang),
    profile = index === undefined ? undefined : state.destinations[index];
  const name = profile ? state.placeNames[index][l] : state ? state.names[l] : 'Roam America';
  const description = profile ? profile.summary[l] : state ? state.description[l] : descriptions[l];
  const path = pagePath(lang, state, index),
    title = `${name} — Roam America`;
  const photo = state
    ? profile
      ? state.photos.find((p) => p.placeIndex === index)
      : state.photos[state.cover]
    : null;
  const canonical = origin ? `${origin}${path}` : '';
  const alternatives = origin
    ? langs
        .map(
          (code) =>
            `<link rel="alternate" hreflang="${code}" href="${origin}${pagePath(code, state, index)}"/>`,
        )
        .join('') +
      `<link rel="alternate" hreflang="x-default" href="${origin}${pagePath('en', state, index)}"/>`
    : '';
  const social = canonical
    ? `<link rel="canonical" href="${canonical}"/><meta property="og:url" content="${canonical}"/><meta property="og:image" content="${origin}${photo?.src || '/images/hero.jpg'}"/><meta property="og:image:alt" content="${escape(name)}"/><meta name="twitter:card" content="summary_large_image"/>`
    : '';
  const links = state
    ? profile
      ? state.places
          .map(
            (_, i) =>
              `<li><a href="${pagePath(lang, state, i)}">${escape(state.placeNames[i][l])}</a></li>`,
          )
          .join('')
      : state.places
          .map(
            (_, i) =>
              `<li><a href="${pagePath(lang, state, i)}">${escape(state.placeNames[i][l])}</a><p>${escape(state.destinations[i].summary[l])}</p></li>`,
          )
          .join('')
    : catalog.states
        .map((s) => `<li><a href="${pagePath(lang, s)}">${escape(s.names[l])}</a></li>`)
        .join('');
  const content = `<header><a href="/${lang}/">Roam America</a><nav>${langs.map((code, i) => `<a lang="${code}" href="${pagePath(code, state, index)}">${labels[i]}</a>`).join(' · ')}</nav></header><main style="max-width:1000px;margin:auto;padding:32px"><h1>${escape(name)}</h1>${photo ? `<img src="${photo.src}" alt="${escape(name)}" width="960" style="max-width:100%;height:auto"/>` : ''}<p>${escape(description)}</p>${profile ? `<p>${escape(profile.access[l])}</p><p>${escape(profile.stay[l])}</p><a href="${escape(profile.officialUrl)}">${escape(profile.officialUrl)}</a><p><a href="${escape(profile.summarySources[l])}">Wikipedia contributors</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">${escape(profile.summaryLicense)}</a></p>` : ''}<ul>${links}</ul></main>`;
  const json = state
    ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': profile ? 'TouristAttraction' : 'TouristDestination', name, description, ...(canonical ? { url: canonical } : {}), ...(photo && origin ? { image: origin + photo.src } : {}), ...(profile ? { geo: { '@type': 'GeoCoordinates', latitude: profile.coordinates[0], longitude: profile.coordinates[1] } } : {}) }).replace(/</g, '\\u003c')}</script>`
    : '';
  const html = template
    .replace(/<html lang="[^"]+">/, `<html lang="${lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      `<meta name="description" content="${escape(description)}"/>`,
    )
    .replace(
      /<meta property="og:title"[^>]*\/>/,
      `<meta property="og:title" content="${escape(title)}"/>`,
    )
    .replace(
      /<meta\s+property="og:description"[\s\S]*?\/>/,
      `<meta property="og:description" content="${escape(description)}"/>`,
    )
    .replace(
      '</head>',
      `${origin ? `<meta name="roam:site-origin" content="${origin}"/>` : ''}${social}${alternatives}${json}</head>`,
    )
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`);
  return { path, html, lastmod: profile?.reviewedAt || state?.updatedAt };
}
for (const lang of langs) {
  pages.push(render(lang));
  for (const state of catalog.states) {
    pages.push(render(lang, state));
    for (let i = 0; i < 3; i++) pages.push(render(lang, state, i));
  }
}
for (const page of pages) {
  await mkdir(`${outDir}${page.path}`, { recursive: true });
  await writeFile(`${outDir}${page.path}index.html`, page.html);
}
await writeFile(outDir + '/index.html', pages[0].html);
if (origin) {
  const xml = pages
    .map(
      (p) =>
        `<url><loc>${escape(origin + p.path)}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}</url>`,
    )
    .join('');
  await writeFile(
    outDir + '/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xml}</urlset>`,
  );
}
await writeFile(
  outDir + '/robots.txt',
  `User-agent: *\nAllow: /\nDisallow: /studio\nDisallow: /*?*view=planner\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`,
);
// Only first-party application assets are cached. Public map tiles are never cached or prefetched.
const assets = (await readdir(outDir + '/assets')).map((name) => '/assets/' + name);
const fonts = (await readdir(outDir + '/fonts'))
  .filter((name) => /\.(woff2|css)$/.test(name))
  .map((name) => '/fonts/' + name);
const shell = ['/', '/index.html', '/favicon.svg', '/data/parks.json', ...assets, ...fonts];
const version = createHash('sha256')
  .update(JSON.stringify(shell) + (await readFile(outDir + '/data/parks.json')))
  .digest('hex')
  .slice(0, 16);
const sw = `const CACHE='roam-shell-${version}',PHOTOS='roam-trip-photos-v1',SHELL=${JSON.stringify(shell)};
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(SHELL);})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('roam-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.origin!==self.location.origin||event.request.method!=='GET'||url.pathname.startsWith('/api/'))return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(async()=>{const cache=await caches.open(CACHE);return await cache.match('/index.html')||Response.error();}));return;}
 if(SHELL.includes(url.pathname)||url.pathname.startsWith('/images/'))event.respondWith((async()=>{const hit=await caches.match(url.pathname);return hit||fetch(event.request);})());
});
self.addEventListener('message',event=>{if(event.data?.type!=='SAVE_TRIP')return;event.waitUntil((async()=>{try{const photos=event.data.photos;if(!Array.isArray(photos)||photos.length>1500||photos.some(p=>typeof p!=='string'||!/^\\/images\\/(?:[a-zA-Z0-9_-]+\\/)*[a-zA-Z0-9_-]+\\.(jpg|jpeg|png|webp)$/.test(p)))throw Error();const cache=await caches.open(PHOTOS);for(const path of new Set(photos)){if(!await cache.match(path)){const response=await fetch(path);if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error();await cache.put(path,response);}}event.ports[0]?.postMessage({ok:true});}catch{event.ports[0]?.postMessage({ok:false});}})());});`;
await writeFile(outDir + '/sw.js', sw);
console.log(
  `Generated ${pages.length} localized pages, offline service worker${origin ? ' and production sitemap' : ' (set SITE_URL to add absolute SEO metadata and sitemap)'}.`,
);
