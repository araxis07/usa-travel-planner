import loaders from 'virtual:state-details';
import type { Photo, PlaceProfile } from './travel';

export type StateDetails = { photos: Photo[]; destinations: PlaceProfile[] };
const pending: Record<string, Promise<StateDetails>> = {};

export function loadStateDetails(code: string): Promise<StateDetails> {
  return (pending[code] ??= loaders[code]().then((module) => module.default));
}
