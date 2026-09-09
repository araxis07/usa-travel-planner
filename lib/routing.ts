export interface RoutePoint {
  id: string;
  name: string;
  coordinates: [number, number];
}
export interface DrivingRoute {
  distance: number;
  duration: number;
  geometry: [number, number][];
}
const cache = new Map<string, DrivingRoute>();
let queue: Promise<unknown> = Promise.resolve();
let lastRequest = 0;
// Public service policy: at most one request per second. Never fetch until requested.
export function drivingRoute(points: RoutePoint[], signal: AbortSignal): Promise<DrivingRoute> {
  const coordinates = points.map((p) => `${p.coordinates[1]},${p.coordinates[0]}`).join(';');
  const cached = cache.get(coordinates);
  if (cached) return Promise.resolve(cached);
  const request = queue
    .catch(() => {})
    .then(async () => {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, 1100 - (Date.now() - lastRequest))),
      );
      signal.throwIfAborted();
      lastRequest = Date.now();
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(abort, 12000);
      try {
        const response = await fetch(
          `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordinates}?overview=simplified&geometries=geojson&radiuses=${points.map(() => 5000).join(';')}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error('Route service unavailable');
        const json = await response.json();
        const route = json.routes?.[0];
        if (
          json.code !== 'Ok' ||
          !route ||
          !Number.isFinite(route.distance) ||
          !Number.isFinite(route.duration) ||
          route.distance < 0 ||
          route.duration < 0 ||
          !Array.isArray(route.geometry?.coordinates) ||
          route.geometry.coordinates.length < 2 ||
          !route.geometry.coordinates.every(
            (c: unknown) =>
              Array.isArray(c) &&
              c.length >= 2 &&
              Number.isFinite(c[0]) &&
              Number.isFinite(c[1]) &&
              Math.abs(c[0]) <= 180 &&
              Math.abs(c[1]) <= 90,
          )
        )
          throw new Error('No driving route');
        const result: DrivingRoute = {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]),
        };
        if (cache.size >= 30) cache.delete(cache.keys().next().value!);
        cache.set(coordinates, result);
        return result;
      } finally {
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
      }
    });
  queue = request;
  return request;
}
