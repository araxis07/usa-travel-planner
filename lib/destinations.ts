import coordinates from '../content/places.json' with { type: 'json' };
import { STATES, local, type StateGuide, type Language, type TripActivity } from '../data/travel';

export const slug = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036fʻ’']/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
export interface DestinationRoute {
  state: StateGuide;
  placeIndex?: number;
}
export function readDestination(): DestinationRoute | null {
  const query = new URLSearchParams(location.search);
  const state = STATES.find((item) => slug(item.name) === query.get('state'));
  if (!state) return null;
  const index = state.places.findIndex((name) => slug(name) === query.get('place'));
  return { state, ...(index >= 0 ? { placeIndex: index } : {}) };
}
export function destinationUrl(state: StateGuide, lang: Language, placeIndex?: number) {
  const query = new URLSearchParams({ lang, state: slug(state.name) });
  if (placeIndex !== undefined) query.set('place', slug(state.places[placeIndex]));
  return `${location.pathname}?${query}`;
}
export const placeId = (state: StateGuide, index: number) => `${state.code}-${index}`;
export function findPlace(id: string) {
  const record = coordinates.find((item) => item.id === id);
  const state = STATES.find((item) => item.code === id.split('-')[0]);
  const index = Number(id.split('-')[1]);
  return record && state && state.places[index] === record.place
    ? { ...record, state, index }
    : undefined;
}
export function activityName(activity: TripActivity, lang: Language) {
  const place = activity.placeId ? findPlace(activity.placeId) : undefined;
  return place ? local(place.state.placeNames[place.index], lang) : activity.title;
}
export const PERIODS = ['morning', 'afternoon', 'evening'] as const;
export const sortedActivities = (activities: TripActivity[]) =>
  [...activities].sort(
    (a, b) => a.day - b.day || PERIODS.indexOf(a.period) - PERIODS.indexOf(b.period),
  );
