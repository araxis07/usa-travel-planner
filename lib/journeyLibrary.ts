import { useEffect, useRef, useState } from 'react';
import { EMPTY_TRIP, type Trip } from '../data/travel';
import { readLocal, validateTrip } from './storage';

export interface SavedTrip {
  id: string;
  trip: Trip;
  archived: boolean;
  updatedAt: string;
}
export interface Library {
  version: 1;
  activeId: string;
  trips: SavedTrip[];
}
export const LIBRARY_KEY = 'roam.library.v1';
export function validateLibrary(value: unknown): Library {
  if (!value || typeof value !== 'object') throw Error('Invalid library');
  const v = value as Library;
  if (v.version !== 1 || !Array.isArray(v.trips) || !v.trips.length || v.trips.length > 30)
    throw Error('Invalid library');
  const ids = new Set<string>();
  const trips = v.trips.map((entry) => {
    if (
      !entry ||
      typeof entry.id !== 'string' ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(entry.id) ||
      ids.has(entry.id) ||
      typeof entry.archived !== 'boolean' ||
      !Number.isFinite(Date.parse(entry.updatedAt))
    )
      throw Error('Invalid saved trip');
    ids.add(entry.id);
    return {
      id: entry.id,
      trip: validateTrip(entry.trip),
      archived: entry.archived,
      updatedAt: entry.updatedAt,
    };
  });
  if (!trips.some((t) => t.id === v.activeId && !t.archived)) throw Error('Missing current trip');
  return { version: 1, activeId: v.activeId, trips };
}
export function useJourneyLibrary(trip: Trip, replaceTrip: (trip: Trip) => void) {
  const [library, setLibrary] = useState<Library>(() =>
    readLocal(
      LIBRARY_KEY,
      {
        version: 1,
        activeId: 'first-trip',
        trips: [{ id: 'first-trip', trip, archived: false, updatedAt: new Date().toISOString() }],
      },
      validateLibrary,
    ),
  );
  const latest = useRef(library);
  latest.current = library;
  const [error, setError] = useState(false);
  const write = (next: Library) => {
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
      latest.current = next;
      setLibrary(next);
      setError(false);
      return true;
    } catch {
      setError(true);
      return false;
    }
  };
  useEffect(() => {
    const previous = latest.current;
    const active = previous.trips.find((t) => t.id === previous.activeId)!;
    if (JSON.stringify(active.trip) === JSON.stringify(trip)) return;
    write({
      ...previous,
      trips: previous.trips.map((t) =>
        t.id === previous.activeId ? { ...t, trip, updatedAt: new Date().toISOString() } : t,
      ),
    });
  }, [trip]);
  const snapshot = (): Library => ({
    ...latest.current,
    trips: latest.current.trips.map((t) => (t.id === latest.current.activeId ? { ...t, trip } : t)),
  });
  const create = (nextTrip: Trip = structuredClone(EMPTY_TRIP)) => {
    const previous = snapshot();
    if (previous.trips.length >= 30) return 'full' as const;
    const entry: SavedTrip = {
      id: crypto.randomUUID(),
      trip: nextTrip,
      archived: false,
      updatedAt: new Date().toISOString(),
    };
    if (!write({ ...previous, activeId: entry.id, trips: [...previous.trips, entry] }))
      return 'storage' as const;
    replaceTrip(nextTrip);
    return 'ok' as const;
  };
  return {
    ...library,
    error,
    create,
    applyRestored(next: Library) {
      const checked = validateLibrary(next);
      latest.current = checked;
      setLibrary(checked);
      replaceTrip(checked.trips.find((t) => t.id === checked.activeId)!.trip);
      setError(false);
    },
    open(id: string) {
      const previous = snapshot();
      const entry = previous.trips.find((t) => t.id === id && !t.archived);
      if (!entry || !write({ ...previous, activeId: id })) return false;
      replaceTrip(entry.trip);
      return true;
    },
    archive(id: string, archived: boolean) {
      if (id === library.activeId) return;
      const previous = snapshot();
      write({
        ...previous,
        trips: previous.trips.map((t) => (t.id === id ? { ...t, archived } : t)),
      });
    },
    remove(id: string) {
      if (id === library.activeId) return;
      const previous = snapshot();
      write({ ...previous, trips: previous.trips.filter((t) => t.id !== id) });
    },
  };
}
export type JourneyLibrary = ReturnType<typeof useJourneyLibrary>;
