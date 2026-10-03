import {
  STATES,
  local,
  type StateGuide,
  type Language,
  type TripActivity,
  type PlaceProfile,
} from '../data/travel';
import { translate } from './i18n';

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
  const parts = location.pathname.split('/').filter(Boolean);
  const stateSlug = parts[1] === 'states' ? parts[2] : query.get('state');
  const placeSlug = parts[1] === 'states' ? parts[3] : query.get('place');
  const state = STATES.find((item) => slug(item.name) === stateSlug);
  if (!state) return null;
  const index = state.places.findIndex((name) => slug(name) === placeSlug);
  return { state, ...(index >= 0 ? { placeIndex: index } : {}) };
}
export function destinationUrl(state: StateGuide, lang: Language, placeIndex?: number) {
  return `/${lang}/states/${slug(state.name)}/${placeIndex === undefined ? '' : `${slug(state.places[placeIndex])}/`}`;
}
export const placeId = (state: StateGuide, index: number) => `${state.code}-${index}`;
export function mapsQuery(state: StateGuide, index: number) {
  const profile = state.destinations[index];
  return profile.locationKind === 'area'
    ? `${state.places[index]}, ${state.name}, USA`
    : profile.coordinates.join(',');
}
export function locationKindLabel(kind: PlaceProfile['locationKind'], lang: Language) {
  return kind === 'area'
    ? translate('Area reference', 'ตำแหน่งพื้นที่โดยประมาณ', lang)
    : kind === 'visitor-center'
      ? translate('Visitor center reference', 'ตำแหน่งศูนย์บริการนักท่องเที่ยว', lang)
      : translate('Entrance / parking', 'ทางเข้า / ที่จอดรถ', lang);
}
export function findPlace(id: string) {
  const state = STATES.find((item) => item.code === id.split('-')[0]);
  const index = Number(id.split('-')[1]);
  const profile = state?.destinations?.[index];
  return profile?.id === id && state
    ? {
        id,
        state,
        index,
        place: state.places[index],
        title: state.places[index],
        profile,
        coordinates: profile.coordinates,
        source: profile.locationSource,
        checkedAt: profile.locationCheckedAt,
        kind: profile.locationKind,
      }
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
