import loaders from 'virtual:city-details';
import type { City } from '../lib/city-content';
import { use } from 'react';

const pending: Record<string, Promise<City>> = {};
const loaded: Record<string, City> = {};
const missing = Promise.resolve(undefined);
export function loadCityGuide(id?: string): Promise<City | undefined> {
  return id && Object.prototype.hasOwnProperty.call(loaders, id)
    ? (pending[id] ??= loaders[id]().then((module) => (loaded[id] = module.default)))
    : missing;
}
export function useCityGuide(id?: string): City | undefined {
  return id && Object.prototype.hasOwnProperty.call(loaders, id)
    ? (loaded[id] ?? use(loadCityGuide(id)))
    : undefined;
}
