import { useReducer, type SetStateAction } from 'react';
import type { Trip } from '../data/travel';
import { loadTrip } from './storage';
type History = { trip: Trip; undo: Trip | null };
type Action = { next: SetStateAction<Trip> } | { undo: true } | { replace: Trip };
const ids = (trip: Trip) =>
  new Set(trip.stops.flatMap((s) => [s.code, ...(s.activities ?? []).map((a) => a.id)]));
function reducer(value: History, action: Action): History {
  if ('replace' in action) return { trip: action.replace, undo: null };
  if ('undo' in action) return value.undo ? { trip: value.undo, undo: null } : value;
  const trip = typeof action.next === 'function' ? action.next(value.trip) : action.next;
  const nextIds = ids(trip);
  const removed = [...ids(value.trip)].some((id) => !nextIds.has(id));
  return { trip, undo: removed ? value.trip : null };
}
export function useTripHistory() {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    trip: loadTrip(),
    undo: null,
  }));
  return {
    trip: state.trip,
    setTrip: (next: SetStateAction<Trip>) => dispatch({ next }),
    canUndo: !!state.undo,
    undo: () => dispatch({ undo: true }),
    replaceTrip: (trip: Trip) => dispatch({ replace: trip }),
  };
}
