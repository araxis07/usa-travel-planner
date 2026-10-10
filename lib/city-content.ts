import type content from '../content/city-guides.json';
import type { ContentIssue } from './content';
import { validateArrival, type Arrival } from './arrival';

export type City = Omit<(typeof content)['guides'][number], 'days'> & {
  days: {
    title: string[];
    text: string[];
    alternative: string[];
    source?: { name: string; url: string };
    arrival?: Arrival;
  }[];
};
export type CityContent = Omit<typeof content, 'guides'> & { guides: City[] };
export const CITY_IDS = ['NY-0', 'CA-0', 'NV-0', 'MA-0', 'IL-0', 'PA-0'];
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const string = (v: unknown, max = 4000): v is string => typeof v === 'string' && v.length <= max;
const list = (v: unknown, size: number): v is unknown[] => Array.isArray(v) && v.length === size;
const texts = (v: unknown) => list(v, 5) && v.every((s) => string(s));
const source = (v: unknown) => {
  if (!record(v) || !string(v.name, 200) || !string(v.url, 2000)) return false;
  if (!v.url) return true;
  try {
    const url = new URL(v.url);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
};
const review = (v: Record<string, unknown>) =>
  string(v.checkedAt, 10) &&
  string(v.reviewAfter, 10) &&
  list(v.translationsReviewed, 5) &&
  v.translationsReviewed.every((n) => typeof n === 'boolean');
const money = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= 1_000_000;

export function validateCityContent(value: unknown): CityContent {
  if (!record(value) || !record(value.copy) || !list(value.guides, CITY_IDS.length))
    throw Error('Invalid city guide collection');
  for (const key of [
    'title',
    'areas',
    'days',
    'day',
    'pace',
    'alternative',
    'map',
    'airport',
    'fares',
    'budget',
    'assumptions',
    'total',
    'perPerson',
    'checked',
    'review',
    'stale',
    'duration',
    'food',
    'mealAllowance',
    'foodAssumptions',
    'vegetarian',
    'foodStale',
  ])
    if (!texts(value.copy[key])) throw Error('Invalid city copy: ' + key);
  if (
    !list(value.copy.tiers, 3) ||
    !value.copy.tiers.every(texts) ||
    !list(value.copy.rows, 5) ||
    !value.copy.rows.every(texts)
  )
    throw Error('Invalid city budget labels');
  const seen = new Set();
  for (const g of value.guides) {
    if (
      !record(g) ||
      typeof g.placeId !== 'string' ||
      !CITY_IDS.includes(g.placeId) ||
      seen.has(g.placeId) ||
      !review(g) ||
      !texts(g.intro) ||
      !list(g.areas, 3) ||
      !list(g.days, 3) ||
      !record(g.airport) ||
      !record(g.budget) ||
      !record(g.food)
    )
      throw Error('Invalid city guide');
    seen.add(g.placeId);
    for (const d of g.days) if (record(d) && d.arrival !== undefined) validateArrival(d.arrival);
    if (
      g.areas.some(
        (a) =>
          !record(a) ||
          !texts(a.title) ||
          !texts(a.text) ||
          !string(a.mapQuery, 500) ||
          !source(a.source),
      ) ||
      g.days.some(
        (d) =>
          !record(d) ||
          !texts(d.title) ||
          !texts(d.text) ||
          !texts(d.alternative) ||
          (d.source !== undefined && !source(d.source)),
      )
    )
      throw Error('Invalid city areas or days');
    const a = g.airport,
      b = g.budget,
      f = g.food;
    if (
      !string(a.code, 3) ||
      !list(a.steps, 3) ||
      !a.steps.every(texts) ||
      !texts(a.fare) ||
      !texts(a.note) ||
      !Array.isArray(a.sources) ||
      a.sources.length < 1 ||
      a.sources.length > 20 ||
      !a.sources.every(source) ||
      !texts(b.note) ||
      !list(b.amounts, 5) ||
      b.amounts.some((r) => !list(r, 3) || !r.every(money)) ||
      !review(f) ||
      !texts(f.intro) ||
      !texts(f.vegetarian) ||
      !list(f.stops, 3) ||
      f.stops.some(
        (s, i) =>
          !record(s) ||
          s.day !== i + 1 ||
          !texts(s.title) ||
          !texts(s.text) ||
          !string(s.mapQuery, 500) ||
          !source(s.source) ||
          !list(s.allowance, 2) ||
          !s.allowance.every(money),
      )
    )
      throw Error('Invalid city airport, budget or food guide');
  }
  return value as unknown as CityContent;
}

export function cityContentIssues(content: CityContent): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const add = (code: string, field: string, message: string) =>
    issues.push({ code, field, message });
  const nonempty = (value: unknown, code: string, field: string) => {
    if (typeof value === 'string' && !value.trim()) add(code, field, 'กรุณาเติมข้อมูล');
    else if (value && typeof value === 'object') {
      if (record(value) && 'url' in value && !source(value))
        add(code, field, 'ใช้ลิงก์ HTTPS ที่ไม่มีข้อมูลเข้าสู่ระบบ');
      Object.entries(value).forEach(([key, v]) => nonempty(v, code, field + '.' + key));
    }
  };
  const dates = (v: { checkedAt: string; reviewAfter: string }, code: string, field: string) => {
    const valid = (s: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(s) &&
      Number.isFinite(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s;
    if (!valid(v.checkedAt) || !valid(v.reviewAfter) || v.reviewAfter <= v.checkedAt)
      add(code, field, 'ใช้วันที่จริง และกำหนดตรวจครั้งถัดไปหลังวันที่ตรวจแล้ว');
  };
  nonempty(content.copy, 'copy', 'copy');
  for (const g of content.guides) {
    nonempty(g, g.placeId, 'guide');
    dates(g, g.placeId, 'review');
    dates(g.food, g.placeId, 'food.review');
    if (!/^[A-Z]{3}$/.test(g.airport.code))
      add(g.placeId, 'airport.code', 'รหัสสนามบินต้องเป็นอักษร A–Z สามตัว');
    if (g.budget.amounts.some((row) => row.some((n) => !money(n))))
      add(g.placeId, 'budget.amounts', 'ใช้วงเงินเต็มดอลลาร์ระหว่าง 0–1,000,000');
    g.food.stops.forEach((s, i) => {
      if (s.allowance.some((n) => !money(n)) || s.allowance[0] > s.allowance[1])
        add(
          g.placeId,
          `food.stops.${i}.allowance`,
          'ใช้วงเงินเต็มดอลลาร์ 0–1,000,000 และต่ำสุดต้องไม่เกินสูงสุด',
        );
    });
  }
  return issues;
}

export function cityReviewQueue(
  content: CityContent,
  today = new Date().toISOString().slice(0, 10),
) {
  const nextWeek = Date.parse(today + 'T00:00:00Z') + 7 * 86400000;
  return content.guides
    .flatMap((g) =>
      (['city', 'food'] as const).map((section) => {
        const review = section === 'food' ? g.food : g;
        const date = Date.parse(review.reviewAfter + 'T00:00:00Z');
        const valid =
          Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === review.reviewAfter;
        return {
          placeId: g.placeId,
          airport: g.airport.code,
          section,
          reviewAfter: review.reviewAfter,
          due: valid && review.reviewAfter <= today,
          soon: valid && review.reviewAfter > today && date <= nextWeek,
          undated: !valid,
          languages: review.translationsReviewed.flatMap((done, i) => (done ? [] : [i])),
        };
      }),
    )
    .sort(
      (a, b) =>
        Number(a.undated) - Number(b.undated) ||
        a.reviewAfter.localeCompare(b.reviewAfter) ||
        a.placeId.localeCompare(b.placeId),
    );
}
