import { EMPTY_TRIP, STATES, type Trip, type TripStop, type TripActivity } from '../data/travel';
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
  const activityIds = new Set<string>();
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
    const result: TripStop = { code: stop.code, days: stop.days, notes: stop.notes };
    if (stop.activities !== undefined) {
      if (!Array.isArray(stop.activities) || stop.activities.length > 200)
        throw new Error('Invalid activities');
      result.activities = stop.activities.map((raw: unknown): TripActivity => {
        if (!raw || typeof raw !== 'object') throw new Error('Invalid activity');
        const a = raw as Record<string, unknown>;
        if (
          typeof a.id !== 'string' ||
          !/^[a-zA-Z0-9-]{1,80}$/.test(a.id) ||
          activityIds.has(a.id) ||
          activityIds.size >= 200 ||
          typeof a.day !== 'number' ||
          !Number.isInteger(a.day) ||
          a.day < 1 ||
          a.day > result.days ||
          !['morning', 'afternoon', 'evening'].includes(a.period as string) ||
          typeof a.title !== 'string' ||
          !a.title.trim() ||
          a.title.length > 120 ||
          typeof a.minutes !== 'number' ||
          !Number.isInteger(a.minutes) ||
          a.minutes < 15 ||
          a.minutes > 720 ||
          typeof a.notes !== 'string' ||
          a.notes.length > 500 ||
          (a.startTime !== undefined &&
            (typeof a.startTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(a.startTime))) ||
          (a.bufferMinutes !== undefined &&
            (typeof a.bufferMinutes !== 'number' ||
              !Number.isInteger(a.bufferMinutes) ||
              a.bufferMinutes < 0 ||
              a.bufferMinutes > 360)) ||
          (a.placeId !== undefined &&
            (typeof a.placeId !== 'string' ||
              !/^[A-Z]{2}-[0-2]$/.test(a.placeId) ||
              !codes.has(a.placeId.slice(0, 2))))
        )
          throw new Error('Invalid activity');
        activityIds.add(a.id);
        return {
          id: a.id,
          day: a.day,
          period: a.period as TripActivity['period'],
          title: a.title.trim(),
          minutes: a.minutes,
          notes: a.notes,
          ...(typeof a.startTime === 'string' ? { startTime: a.startTime } : {}),
          ...(typeof a.bufferMinutes === 'number' ? { bufferMinutes: a.bufferMinutes } : {}),
          ...(typeof a.placeId === 'string' ? { placeId: a.placeId } : {}),
        };
      });
    }
    return result;
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
    ...(trip.checklist !== undefined ? { checklist: validateChecklist(trip.checklist) } : {}),
  };
}
function validateChecklist(value: unknown): NonNullable<Trip['checklist']> {
  if (!Array.isArray(value) || value.length > 80) throw Error('Invalid checklist');
  const seen = new Set<string>();
  return value.map((item) => {
    if (
      !item ||
      typeof item.id !== 'string' ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(item.id) ||
      seen.has(item.id) ||
      typeof item.label !== 'string' ||
      item.label.length > 200 ||
      typeof item.done !== 'boolean'
    )
      throw Error('Invalid checklist item');
    seen.add(item.id);
    return { id: item.id, label: item.label, done: item.done };
  });
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
