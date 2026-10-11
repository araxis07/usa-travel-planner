export interface Arrival {
  label: string[];
  note: string[];
  coordinates: [number, number];
  source: { name: string; url: string };
  coordinateSource: string;
  coordinateLicense: 'https://opendatacommons.org/licenses/odbl/1-0/';
  checkedAt: string;
}
export type ArrivalDraft = Omit<Arrival, 'coordinates'> & {
  coordinates: [number | null, number | null];
};
const https = (value: unknown) => {
  if (typeof value !== 'string' || value.length > 2000) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
};
export function validateArrival(value: unknown): Arrival;
export function validateArrival(value: unknown, draft: true): ArrivalDraft;
export function validateArrival(value: unknown, draft = false): ArrivalDraft {
  const a = value as ArrivalDraft | null;
  const texts = (v: unknown, max: number) =>
    Array.isArray(v) &&
    v.length === 5 &&
    v.every((s) => typeof s === 'string' && (draft || !!s.trim()) && s.length <= max);
  if (
    !a ||
    !texts(a.label, 200) ||
    !texts(a.note, 1000) ||
    !Array.isArray(a.coordinates) ||
    a.coordinates.length !== 2 ||
    a.coordinates.some(
      (n, i) =>
        !(draft && n === null) &&
        (typeof n !== 'number' || !Number.isFinite(n) || Math.abs(n) > (i === 0 ? 90 : 180)),
    ) ||
    !a.source ||
    typeof a.source.name !== 'string' ||
    (!draft && !a.source.name.trim()) ||
    a.source.name.length > 200 ||
    (!(draft && a.source.url === '') && !https(a.source.url)) ||
    (!(draft && a.coordinateSource === '') &&
      (!https(a.coordinateSource) ||
        !/^https:\/\/www\.openstreetmap\.org\/node\/[1-9]\d*$/.test(a.coordinateSource))) ||
    a.coordinateLicense !== 'https://opendatacommons.org/licenses/odbl/1-0/' ||
    typeof a.checkedAt !== 'string' ||
    (!(draft && a.checkedAt === '') &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(a.checkedAt) ||
        !Number.isFinite(Date.parse(a.checkedAt)) ||
        new Date(a.checkedAt).toISOString().slice(0, 10) !== a.checkedAt))
  )
    throw Error('Invalid arrival reference');
  return {
    label: [...a.label],
    note: [...a.note],
    coordinates: [...a.coordinates],
    source: { name: a.source.name, url: a.source.url },
    coordinateSource: a.coordinateSource,
    coordinateLicense: a.coordinateLicense,
    checkedAt: a.checkedAt,
  };
}
