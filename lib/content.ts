import type { StateGuide } from '../data/travel';
export interface Catalog {
  version: 1;
  states: StateGuide[];
}
export interface ContentIssue {
  code: string;
  field: string;
  message: string;
}
const canonicalNames: Record<string, string> = {
  CA: 'California',
  NY: 'New York',
  AZ: 'Arizona',
  HI: 'Hawaii',
  UT: 'Utah',
  CO: 'Colorado',
  FL: 'Florida',
  WA: 'Washington',
  AL: 'Alabama',
  AK: 'Alaska',
  AR: 'Arkansas',
  CT: 'Connecticut',
  DE: 'Delaware',
  GA: 'Georgia',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  VT: 'Vermont',
  VA: 'Virginia',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};
const regions = ['West', 'Southwest', 'Midwest', 'Southeast', 'Northeast'];
const interests = ['Nature', 'Cities', 'Coast', 'Culture'];
const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const string = (v: unknown, max = 4000): v is string => typeof v === 'string' && v.length <= max;
const texts = (v: unknown) => Array.isArray(v) && v.length === 5 && v.every((x) => string(x));
const url = (v: unknown) => {
  if (!string(v, 2000)) return false;
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password;
  } catch {
    return false;
  }
};
const date = (v: unknown) =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
export function migrateCatalog(value: unknown, base: Catalog): unknown {
  if (!record(value) || !Array.isArray(value.states)) return value;
  return {
    ...value,
    states: value.states.map((state) => {
      if (!record(state) || state.destinations !== undefined) return state;
      const prior = base.states.find((s) => s.code === state.code);
      if (!prior || JSON.stringify(state.places) !== JSON.stringify(prior.places))
        throw Error('Legacy place names changed; restore the matching catalog before importing.');
      return { ...state, destinations: structuredClone(prior.destinations) };
    }),
  };
}
export const safeImagePath = (v: unknown): v is string =>
  string(v, 200) && /^\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(v);
export function validateCatalog(value: unknown): Catalog {
  const fail = (field: string): never => {
    throw new Error(`Invalid content: ${field}`);
  };
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.states) ||
    value.states.length !== 50
  )
    return fail('50 states required');
  const seen = new Set<string>();
  for (const state of value.states) {
    if (
      !record(state) ||
      typeof state.code !== 'string' ||
      !canonicalNames[state.code] ||
      seen.has(state.code)
    )
      return fail('state code');
    const c = state.code;
    seen.add(c);
    if (!Array.isArray(state.destinations) || state.destinations.length !== 3)
      return fail(`${c} destination profiles`);
    for (const [i, profile] of state.destinations.entries()) {
      if (record(profile) && profile.advisory !== undefined) {
        const a = profile.advisory;
        if (!record(a) || !texts(a.text) || !url(a.source) || !a.source || !date(a.checkedAt))
          return fail(`${c} advisory`);
      }
      if (record(profile) && profile.planning !== undefined) {
        const p = profile.planning;
        if (
          !record(p) ||
          !['transit', 'car', 'boat'].includes(p.transport as string) ||
          !['indoors', 'outdoors'].includes(p.setting as string) ||
          !['easy', 'varied'].includes(p.walking as string) ||
          !['Nature', 'Cities', 'Coast', 'Culture'].includes(p.interest as string) ||
          !Array.isArray(p.months) ||
          !p.months.length ||
          new Set(p.months).size !== p.months.length ||
          !p.months.every((m) => Number.isInteger(m) && m >= 1 && m <= 12)
        )
          return fail(`${c} planning metadata`);
      }
      if (
        !record(profile) ||
        profile.id !== `${c}-${i}` ||
        !texts(profile.summary) ||
        !texts(profile.access) ||
        !texts(profile.stay) ||
        !texts(profile.locationLabel) ||
        !Array.isArray(profile.summarySources) ||
        profile.summarySources.length !== 5 ||
        !profile.summarySources.every(url) ||
        !string(profile.summaryLicense, 150) ||
        !url(profile.locationSource) ||
        !url(profile.officialUrl) ||
        !url(profile.bookingUrl) ||
        !['area', 'entrance', 'visitor-center'].includes(profile.locationKind as string) ||
        !date(profile.locationCheckedAt) ||
        !date(profile.reviewedAt) ||
        !date(profile.reviewAfter) ||
        !Number.isInteger(profile.visitMinutes) ||
        Number(profile.visitMinutes) < 15 ||
        Number(profile.visitMinutes) > 720 ||
        !Array.isArray(profile.coordinates) ||
        profile.coordinates.length !== 2 ||
        !profile.coordinates.every(Number.isFinite) ||
        profile.coordinates[0] < 18 ||
        profile.coordinates[0] > 72 ||
        profile.coordinates[1] < -180 ||
        profile.coordinates[1] > -60 ||
        !Array.isArray(profile.translationsReviewed) ||
        profile.translationsReviewed.length !== 5 ||
        !profile.translationsReviewed.every((v) => typeof v === 'boolean')
      )
        return fail(`${c} destination ${i}`);
    }
    if (
      state.name !== canonicalNames[c] ||
      !string(state.thai, 150) ||
      !texts(state.names) ||
      !texts(state.description) ||
      !texts(state.food) ||
      !texts(state.tip)
    )
      return fail(`${c} translations`);
    const names = state.names as string[];
    if (names[0] !== state.name || names[1] !== state.thai) return fail(`${c} name aliases`);
    if (
      !regions.includes(state.region as string) ||
      !Array.isArray(state.interests) ||
      !state.interests.length ||
      !state.interests.every((x) => interests.includes(x))
    )
      return fail(`${c} interests`);
    if (
      !Array.isArray(state.season) ||
      !state.season.length ||
      !state.season.every((x) => seasons.includes(x))
    )
      return fail(`${c} seasons`);
    if (
      !Array.isArray(state.places) ||
      state.places.length !== 3 ||
      !state.places.every((x) => string(x, 200)) ||
      !Array.isArray(state.placeNames) ||
      state.placeNames.length !== 3 ||
      !state.placeNames.every(texts)
    )
      return fail(`${c} places`);
    if (
      !Number.isInteger(state.days) ||
      Number(state.days) < 1 ||
      Number(state.days) > 30 ||
      !string(state.hub, 100) ||
      !string(state.updatedAt, 10) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(state.updatedAt) ||
      new Date(state.updatedAt).toISOString().slice(0, 10) !== state.updatedAt
    )
      return fail(`${c} travel facts`);
    if (
      !Array.isArray(state.photos) ||
      state.photos.length > 12 ||
      !Number.isInteger(state.cover) ||
      Number(state.cover) < 0 ||
      Number(state.cover) >= Math.max(1, state.photos.length)
    )
      return fail(`${c} gallery`);
    const paths = new Set<string>();
    for (const photo of state.photos) {
      if (
        !record(photo) ||
        !safeImagePath(photo.src) ||
        paths.has(photo.src) ||
        !Number.isInteger(photo.placeIndex) ||
        Number(photo.placeIndex) < 0 ||
        Number(photo.placeIndex) > 2 ||
        !url(photo.source) ||
        !url(photo.licenseUrl) ||
        !url(photo.original) ||
        !string(photo.author, 2000) ||
        !string(photo.license, 150) ||
        (photo.caption !== undefined && !string(photo.caption, 2000)) ||
        (photo.displayCaption !== undefined && !texts(photo.displayCaption)) ||
        (photo.captionReviewed !== undefined &&
          (!Array.isArray(photo.captionReviewed) ||
            photo.captionReviewed.length !== 5 ||
            !photo.captionReviewed.every((v) => typeof v === 'boolean'))) ||
        !Number.isInteger(photo.width) ||
        !Number.isInteger(photo.height) ||
        Number(photo.width) < 1 ||
        Number(photo.height) < 1
      )
        return fail(`${c} photo`);
      paths.add(photo.src);
    }
    if (
      !Array.isArray(state.sources) ||
      state.sources.length > 10 ||
      !state.sources.every((s) => record(s) && string(s.name, 200) && url(s.url))
    )
      return fail(`${c} sources`);
  }
  return value as unknown as Catalog;
}
export function contentIssues(catalog: Catalog): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const state of catalog.states) {
    const add = (field: string, message: string) =>
      issues.push({ code: state.code, field, message });
    for (const field of ['names', 'description', 'food', 'tip'] as const)
      state[field].forEach((v, i) => {
        if (!v.trim()) add(`${field}.${i}`, 'คำแปลยังว่าง');
      });
    state.placeNames.forEach((names, p) =>
      names.forEach((v, l) => {
        if (!v.trim()) add(`placeNames.${p}.${l}`, 'ชื่อสถานที่ยังว่าง');
      }),
    );
    if (!state.hub.trim()) add('hub', 'ยังไม่มีสนามบินหลัก');
    state.destinations.forEach((p, index) => {
      for (const field of ['summary', 'access', 'stay', 'locationLabel'] as const)
        p[field].forEach((value, l) => {
          if (!value.trim()) add(`destinations.${index}.${field}.${l}`, 'รายละเอียดสถานที่ยังว่าง');
        });
      if (
        !p.locationSource ||
        !p.officialUrl ||
        !p.summaryLicense ||
        p.summarySources.some((s) => !s)
      )
        add(`destinations.${index}.sources`, 'แหล่งอ้างอิงสถานที่ยังไม่ครบ');
      if (p.advisory?.text.some((s) => !s.trim()))
        add(`destinations.${index}.advisory`, 'ประกาศต้องมีคำแปลครบ 5 ภาษา');
    });
    if (state.photos.length < 3) add('photos', 'ต้องมีภาพอย่างน้อย 3 ภาพ');
    for (let p = 0; p < 3; p++)
      if (state.photos.filter((photo) => photo.placeIndex === p).length < 3)
        add('photos', `สถานที่ ${p + 1} ต้องมีภาพอย่างน้อย 3 ภาพ`);
    state.photos.forEach((photo, i) => {
      if (!photo.displayCaption || photo.displayCaption.some((v) => !v.trim()))
        add(`photos.${i}.displayCaption`, 'คำบรรยายภาพ 5 ภาษายังไม่ครบ');
      for (const key of ['source', 'author', 'license', 'licenseUrl'] as const)
        if (!photo[key].trim()) add(`photos.${i}.${key}`, 'เครดิตหรือสิทธิ์ใช้งานยังไม่ครบ');
    });
    if (!state.sources.length || state.sources.some((s) => !s.name.trim() || !s.url.trim()))
      add('sources', 'แหล่งข้อมูลยังไม่ครบ');
  }
  return issues;
}
export function reviewQueue(catalog: Catalog, today = new Date().toISOString().slice(0, 10)) {
  return catalog.states.flatMap((state) =>
    state.destinations.flatMap((p, index) => [
      ...(p.reviewAfter <= today
        ? [{ code: state.code, index, reason: 'ถึงกำหนดตรวจข้อมูล' }]
        : []),
      ...(!p.translationsReviewed.every(Boolean)
        ? [{ code: state.code, index, reason: 'รอตรวจทานภาษา' }]
        : []),
      ...(p.locationKind === 'area'
        ? [{ code: state.code, index, reason: 'ยังใช้พิกัดพื้นที่โดยประมาณ' }]
        : []),
      ...(state.photos
        .filter((photo) => photo.placeIndex === index)
        .some((photo) => !photo.captionReviewed?.every(Boolean))
        ? [{ code: state.code, index, reason: 'รอตรวจคำบรรยายภาพ' }]
        : []),
      ...(p.advisory ? [{ code: state.code, index, reason: 'ตรวจประกาศการเดินทางอีกครั้ง' }] : []),
    ]),
  );
}
