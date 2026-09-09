import fs from 'node:fs/promises';
import ts from 'typescript';
const source = await fs.readFile('lib/content.ts', 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { validateCatalog, contentIssues } = await import(
  'data:text/javascript;base64,' + Buffer.from(javascript).toString('base64')
);
const catalog = validateCatalog(JSON.parse(await fs.readFile('content/states.json', 'utf8')));
const places = JSON.parse(await fs.readFile('content/places.json', 'utf8'));
const placeIds = new Set(
  catalog.states.flatMap((state) => state.places.map((_, index) => `${state.code}-${index}`)),
);
if (places.length !== placeIds.size || new Set(places.map((p) => p.id)).size !== placeIds.size)
  throw Error('Incomplete place coordinates');
for (const place of places) {
  const [code, index] = place.id.split('-');
  if (catalog.states.find((state) => state.code === code)?.places[Number(index)] !== place.place)
    throw Error('Place changed: update the reference coordinates for ' + place.id);
  if (
    !placeIds.has(place.id) ||
    !Array.isArray(place.coordinates) ||
    place.coordinates.length !== 2 ||
    !place.coordinates.every(Number.isFinite) ||
    place.coordinates[0] < 18 ||
    place.coordinates[0] > 72 ||
    place.coordinates[1] < -180 ||
    place.coordinates[1] > -60 ||
    !/^https:\/\/(en.wikipedia.org|www.wikidata.org)\/wiki\//.test(place.source) ||
    !place.title ||
    !/^\d{4}-\d{2}-\d{2}$/.test(place.checkedAt)
  )
    throw Error('Invalid place reference ' + place.id);
}
const issues = contentIssues(catalog);
if (issues.length) throw Error(JSON.stringify(issues));
const dictionary = JSON.parse(await fs.readFile('content/translations.json', 'utf8'));
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
  for (const photo of state.photos) {
    const bytes = await fs.readFile('public' + photo.src);
    if (bytes.length < 100) throw Error('Empty photo ' + photo.src);
    const jpeg = bytes[0] === 255 && bytes[1] === 216;
    const png = bytes[0] === 137 && bytes[1] === 80;
    const webp = bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!jpeg && !png && !webp) throw Error('Invalid image ' + photo.src);
    photos++;
  }
}
console.log(
  `Content verified: ${catalog.states.length} states, ${photos} local photos, 5 languages, ${Object.keys(dictionary).length} translated interface/article entries.`,
);
