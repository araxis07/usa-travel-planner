import fs from 'node:fs/promises';
import ts from 'typescript';
import { createHash } from 'node:crypto';
const source = await fs.readFile('lib/content.ts', 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { validateCatalog, contentIssues } = await import(
  'data:text/javascript;base64,' + Buffer.from(javascript).toString('base64')
);
const catalog = validateCatalog(JSON.parse(await fs.readFile('content/states.json', 'utf8')));
const issues = contentIssues(catalog);
if (issues.length) throw Error(JSON.stringify(issues));
const dictionary = JSON.parse(await fs.readFile('content/translations.json', 'utf8'));
const cityContent = JSON.parse(await fs.readFile('content/city-guides.json', 'utf8'));
const cityJavascript = ts.transpileModule(await fs.readFile('lib/city-content.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { validateCityContent, cityContentIssues } = await import(
  'data:text/javascript;base64,' + Buffer.from(cityJavascript).toString('base64')
);
const cityIssues = cityContentIssues(validateCityContent(cityContent));
if (cityIssues.length) throw Error(JSON.stringify(cityIssues));
const preparation = JSON.parse(await fs.readFile('content/travel-preparation.json', 'utf8'));
function checkLocalizedText(value) {
  if (Array.isArray(value) && !value.length) throw Error('Empty guide content');
  if (Array.isArray(value) && value.some((item) => typeof item === 'string')) {
    if (value.length !== 5 || value.some((text) => typeof text !== 'string' || !text.trim()))
      throw Error('Guide text must have five nonempty translations');
  } else if (value && typeof value === 'object') Object.values(value).forEach(checkLocalizedText);
}
function checkReview(guide) {
  const validDate = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (
    !validDate(guide.checkedAt) ||
    !validDate(guide.reviewAfter) ||
    !(Date.parse(guide.reviewAfter) > Date.parse(guide.checkedAt)) ||
    guide.translationsReviewed.length !== 5 ||
    guide.translationsReviewed.some((n) => typeof n !== 'boolean')
  )
    throw Error('Invalid guide review metadata');
}
function checkLinks(links) {
  if (!links.length) throw Error('Missing guide sources');
  for (const link of links) {
    const url = new URL(link.url);
    if (url.protocol !== 'https:' || url.username || url.password || !link.name.trim())
      throw Error('Invalid guide source');
  }
}
checkLocalizedText(cityContent);
checkLocalizedText(preparation);
const cityIds = new Set();
for (const guide of cityContent.guides) {
  if (
    cityIds.has(guide.placeId) ||
    !catalog.states.some((state) => state.destinations.some((p) => p.id === guide.placeId)) ||
    guide.areas.length !== 3 ||
    guide.days.length !== 3 ||
    guide.airport.steps.length !== 3 ||
    !/^[A-Z]{3}$/.test(guide.airport.code) ||
    cityContent.copy.tiers.length !== 3 ||
    guide.budget.amounts.length !== cityContent.copy.rows.length ||
    guide.budget.amounts.some(
      (row) => row.length !== 3 || row.some((n) => !Number.isSafeInteger(n) || n < 0),
    )
  )
    throw Error('Invalid city guide: ' + guide.placeId);
  cityIds.add(guide.placeId);
  checkReview(guide);
  for (const area of guide.areas) if (!area.mapQuery.trim()) throw Error('Missing city map query');
  checkLinks([...guide.areas.map((area) => area.source), ...guide.airport.sources]);
  for (const day of guide.days) if (day.source) checkLinks([day.source]);
  if (guide.food) {
    checkReview(guide.food);
    if (
      guide.food.stops.length !== 3 ||
      guide.food.stops.some(
        (stop, i) =>
          stop.day !== i + 1 ||
          !stop.mapQuery.trim() ||
          stop.allowance.length !== 2 ||
          stop.allowance.some((n) => !Number.isSafeInteger(n) || n < 0) ||
          stop.allowance[0] > stop.allowance[1],
      )
    )
      throw Error('Invalid city food guide: ' + guide.placeId);
    checkLinks(guide.food.stops.map((stop) => stop.source));
  }
}
const parkIds = new Set();
if (
  preparation.copy.rows.length !== 4 ||
  preparation.parks.length !== 5 ||
  preparation.firstTrip.sections.length !== 9 ||
  preparation.intercity.sections.length !== 8
)
  throw Error('Incomplete travel preparation guides');
for (const guide of preparation.parks) {
  if (
    parkIds.has(guide.placeId) ||
    !catalog.states.some((state) => state.destinations.some((p) => p.id === guide.placeId)) ||
    guide.sections.length !== preparation.copy.rows.length
  )
    throw Error('Invalid park booking guide: ' + guide.placeId);
  parkIds.add(guide.placeId);
  checkReview(guide);
  guide.sections.forEach((section) => checkLinks(section.sources));
  if (guide.notice) checkLinks([guide.notice.source]);
}
checkReview(preparation.firstTrip);
checkLinks(preparation.firstTrip.sources);
checkReview(preparation.intercity);
checkLinks(preparation.intercity.sources);
checkLinks([preparation.intercity.notice.source]);
const missing = new Set();
for (const file of [
  'App.tsx',
  'data/travel.ts',
  ...(await fs.readdir('components'))
    .filter((n) => n.endsWith('.tsx'))
    .map((n) => 'components/' + n),
]) {
  const sf = ts.createSourceFile(
    file,
    await fs.readFile(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  function inspect(n) {
    if (
      ts.isCallExpression(n) &&
      ['t', 'translate'].includes(n.expression.getText(sf)) &&
      n.arguments.length >= 2 &&
      ts.isStringLiteral(n.arguments[0])
    ) {
      const key = n.arguments[0].text;
      if (!dictionary[key]?.every(Boolean) || dictionary[key].length !== 3) missing.add(key);
    }
    if (
      file === 'data/travel.ts' &&
      ts.isArrayLiteralExpression(n) &&
      n.elements.length === 2 &&
      n.elements.every(ts.isStringLiteral) &&
      /[ก-๙]/.test(n.elements[1].text)
    ) {
      const key = n.elements[0].text;
      if (!dictionary[key]?.every(Boolean)) missing.add(key);
    }
    ts.forEachChild(n, inspect);
  }
  inspect(sf);
}
if (missing.size) throw Error('Missing translations: ' + JSON.stringify([...missing]));
let photos = 0;
for (const state of catalog.states) {
  if (state.names[0] !== state.name || state.names[1] !== state.thai)
    throw Error(state.code + ' name aliases');
  const hashes = new Set();
  for (const photo of state.photos) {
    const bytes = await fs.readFile('public' + photo.src);
    const fingerprint = photo.placeIndex + ':' + createHash('sha256').update(bytes).digest('hex');
    if (hashes.has(fingerprint)) throw Error('Duplicate destination photograph: ' + photo.src);
    hashes.add(fingerprint);
    if (bytes.length < 100) throw Error('Empty photo ' + photo.src);
    const jpeg = bytes[0] === 255 && bytes[1] === 216;
    const png = bytes[0] === 137 && bytes[1] === 80;
    const webp = bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!jpeg && !png && !webp) throw Error('Invalid image ' + photo.src);
    photos++;
  }
}
console.log(
  `Content verified: ${catalog.states.length} states, ${photos} local photos, ${cityIds.size} detailed city guides, ${cityContent.guides.reduce((n, guide) => n + (guide.food?.stops.length || 0), 0)} food stops, ${parkIds.size} park booking guides, 9 predeparture and 8 intercity topics, 5 languages, ${Object.keys(dictionary).length} translated interface/article entries.`,
);
