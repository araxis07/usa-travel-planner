import profiles from '../content/states.json?practical';
import type { PlaceOverview, PlaceProfile } from './travel';

const details = profiles as Record<string, Omit<PlaceProfile, keyof PlaceOverview>>;
export const placeDetails = (profile: PlaceOverview | PlaceProfile): PlaceProfile =>
  'access' in profile ? profile : { ...profile, ...details[profile.id] };
