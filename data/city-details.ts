import loaders from 'virtual:city-details';
import type { City } from '../lib/city-content';

const pending: Record<string, Promise<City>> = {};
const missing = Promise.resolve(undefined);
export function loadCityGuide(id?: string): Promise<City | undefined> {
  return id && Object.prototype.hasOwnProperty.call(loaders, id)
    ? (pending[id] ??= loaders[id]().then((module) => module.default))
    : missing;
}
