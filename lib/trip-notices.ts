import type { Trip } from '../data/travel';
import { findPlace } from './destinations';

export function tripNotices(trip: Trip) {
  let offset = 0;
  const days = trip.stops.flatMap((stop) => {
    const result = Array.from({ length: stop.days }, (_, i) => ({
      code: stop.code,
      day: i + 1,
      number: offset + i + 1,
      placeIds: (stop.activities ?? []).flatMap((a) =>
        a.day === i + 1 && a.placeId ? [a.placeId] : [],
      ),
    }));
    offset += stop.days;
    return result;
  });
  return [...new Set(days.flatMap((day) => day.placeIds))].flatMap((id) => {
    const place = findPlace(id);
    const advisory = place?.profile.advisory;
    return place && advisory
      ? [{ place, advisory, days: days.filter((day) => day.placeIds.includes(id)) }]
      : [];
  });
}
