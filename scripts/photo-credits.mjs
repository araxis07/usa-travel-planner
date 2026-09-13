import fs from 'node:fs/promises';
const catalog = JSON.parse(await fs.readFile('content/states.json', 'utf8'));
const marker = '\nDESTINATION GALLERIES — WIKIMEDIA COMMONS AND NATIONAL PARK SERVICE\n';
let credits = (await fs.readFile('public/credits.txt', 'utf8')).split(
  /\n(?:WIKIMEDIA COMMONS DESTINATION GALLERIES|DESTINATION GALLERIES — WIKIMEDIA COMMONS AND NATIONAL PARK SERVICE)\n/,
)[0];
credits +=
  marker +
  'Photos are served locally, resized and cropped for layout. Each file retains its own license.\nThe source pages identify the subjects, photographers and applicable reuse terms.\n\n';
for (const state of catalog.states)
  for (const photo of state.photos)
    credits += `${state.name} — ${state.places[photo.placeIndex]}\nFile: ${photo.src}\nAuthor: ${photo.author}\nSource: ${photo.source}\nLicense: ${photo.license} — ${photo.licenseUrl}\n\n`;
await fs.writeFile('public/credits.txt', credits.trimEnd() + '\n');
