import loaders from 'virtual:state-details';
import type { Photo, PlaceProfile } from './travel';
import { use } from 'react';

export type StateDetails = { photos: Photo[]; destinations: PlaceProfile[] };
const pending: Record<string, Promise<StateDetails>> = {};
const loaded: Record<string, StateDetails> = {};

export function loadStateDetails(code: string): Promise<StateDetails> {
  return (pending[code] ??= loaders[code]().then((module) => (loaded[code] = module.default)));
}
export function useStateDetails(code: string): StateDetails {
  return loaded[code] ?? use(loadStateDetails(code));
}
