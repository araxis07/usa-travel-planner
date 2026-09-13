// Cached official NPS facts. Never runs on a visitor request or during a build.
import { mkdir, writeFile, rename } from 'node:fs/promises';
const mapping = {
  'CA-1': 'yose',
  'AZ-0': 'grca',
  'HI-1': 'havo',
  'UT-0': 'zion',
  'UT-1': 'brca',
  'UT-2': 'arch',
  'CO-0': 'romo',
  'CO-2': 'meve',
  'FL-1': 'ever',
  'WA-1': 'olym',
  'WA-2': 'mora',
  'AK-0': 'dena',
  'AK-1': 'kefj',
  'AR-0': 'hosp',
  'AR-1': 'buff',
  'ID-2': 'crmo',
  'IN-1': 'indu',
  'KS-0': 'tapr',
  'KY-1': 'maca',
  'ME-0': 'acad',
  'MD-2': 'asis',
  'MI-1': 'slbe',
  'MN-2': 'voya',
  'MS-2': 'guis',
  'MO-2': 'ozar',
  'MT-0': 'glac',
  'MT-2': 'libi',
  'NE-1': 'scbl',
  'NM-1': 'whsa',
  'NC-1': 'blri',
  'ND-0': 'thro',
  'OR-2': 'crla',
  'SC-2': 'cong',
  'SD-0': 'badl',
  'TN-2': 'grsm',
  'TX-2': 'bibe',
  'VA-0': 'shen',
  'WV-0': 'neri',
  'WV-1': 'hafe',
  'WI-2': 'apis',
  'WY-0': 'yell',
  'WY-1': 'grte',
};
const key = process.env.NPS_API_KEY || 'DEMO_KEY';
async function get(endpoint) {
  const url = new URL(`https://developer.nps.gov/api/v1/${endpoint}`);
  url.search = `parkCode=${Object.values(mapping).join(',')}&limit=500&api_key=${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    headers: { 'X-Api-Key': key },
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`NPS ${endpoint}: ${response.status}; existing snapshot kept`);
  const json = await response.json();
  if (!Array.isArray(json.data) || Number(json.total) > json.data.length)
    throw new Error('Incomplete NPS response; existing snapshot kept');
  return json.data;
}
const parks = await get('parks');
const alerts = await get('alerts');
const centers = await get('visitorcenters');
const data = Object.entries(mapping).map(([id, code]) => {
  const park = parks.find((p) => p.parkCode === code);
  if (
    !park?.url ||
    !park.fullName ||
    !Array.isArray(park.entranceFees) ||
    !Array.isArray(park.operatingHours)
  )
    throw new Error(`Missing park ${code}; returned ${parks.map((p) => p.parkCode).join(',')}`);
  return {
    id,
    code,
    name: park.fullName,
    url: park.url,
    description: park.description,
    directions: park.directionsInfo,
    directionsUrl: park.directionsUrl,
    hours: park.operatingHours,
    fees: park.entranceFees,
    images: park.images,
    visitorCenters: centers
      .filter((c) => c.parkCode === code)
      .map(({ id, name, url, latitude, longitude, directionsInfo, operatingHours }) => ({
        id,
        name,
        url: url?.replace(/^http:\/\/www\.nps\.gov\//, 'https://www.nps.gov/'),
        latitude,
        longitude,
        directionsInfo,
        operatingHours,
      })),
    alerts: alerts
      .filter((a) => a.parkCode === code)
      .map(({ id, title, category, description, url, lastIndexedDate }) => ({
        id,
        title,
        category,
        description,
        url,
        lastIndexedDate,
      })),
  };
});
await mkdir('public/data', { recursive: true });
const target = 'public/data/parks.json';
await writeFile(
  `${target}.tmp`,
  JSON.stringify(
    {
      version: 1,
      checkedAt: new Date().toISOString(),
      source: 'https://www.nps.gov/subjects/developer/',
      parks: data,
    },
    null,
    2,
  ) + '\n',
);
await rename(`${target}.tmp`, target);
console.log(
  `Updated ${data.length} parks and ${alerts.length} alerts; review changes before publishing.`,
);
