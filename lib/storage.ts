import { EMPTY_TRIP, STATES, type Trip, type TripStop } from '../data/travel';
const codes = new Set(STATES.map((state) => state.code));
export function readLocal<T>(key: string, fallback: T, validate: (data: unknown) => T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? validate(JSON.parse(value)) : fallback;
  } catch {
    return fallback;
  }
}
export function validFavorites(value: unknown): string[] {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter((code): code is string => typeof code === 'string' && codes.has(code)),
        ),
      ]
    : [];
}
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateTrip(value: unknown): Trip {
  if (!value || typeof value !== 'object') throw new Error('Invalid trip');
  const trip = value as Record<string, unknown>;
  if (!Array.isArray(trip.stops) || trip.stops.length > 50) throw new Error('Invalid stops');
  const seen = new Set<string>();
  const stops: TripStop[] = trip.stops.map((raw: unknown) => {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid stop');
    const stop = raw as Record<string, unknown>;
    if (
      typeof stop.code !== 'string' ||
      !codes.has(stop.code) ||
      seen.has(stop.code) ||
      typeof stop.days !== 'number' ||
      !Number.isInteger(stop.days) ||
      stop.days < 1 ||
      stop.days > 30 ||
      typeof stop.notes !== 'string' ||
      stop.notes.length > 1000
    )
      throw new Error('Invalid stop');
    seen.add(stop.code);
    return { code: stop.code, days: stop.days, notes: stop.notes };
  });
  if (
    typeof trip.name !== 'string' ||
    trip.name.length > 80 ||
    (trip.startDate !== '' && !validDate(trip.startDate)) ||
    typeof trip.travelers !== 'number' ||
    !Number.isInteger(trip.travelers) ||
    trip.travelers < 1 ||
    trip.travelers > 20 ||
    typeof trip.dailyBudget !== 'number' ||
    !Number.isFinite(trip.dailyBudget) ||
    trip.dailyBudget < 0 ||
    trip.dailyBudget > 10000
  )
    throw new Error('Invalid trip settings');
  return {
    name: trip.name,
    startDate: trip.startDate as string,
    travelers: trip.travelers,
    dailyBudget: trip.dailyBudget,
    stops,
  };
}
export function loadTrip() {
  return readLocal('roam.trip.v1', EMPTY_TRIP, validateTrip);
}
export function tripDays(trip: Trip) {
  return trip.stops.reduce((total, stop) => total + stop.days, 0);
}
export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
