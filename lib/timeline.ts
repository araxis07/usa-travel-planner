import type { TripActivity } from '../data/travel';
import { sortedActivities, findPlace } from './destinations';
export const clockMinutes = (value: string) =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
export const clockLabel = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}${minutes >= 1440 ? ` +${Math.floor(minutes / 1440)}` : ''}`;
export function dayTimeline(activities: TripActivity[]) {
  let previousEnd = 0;
  let previousPoint: [number, number] | undefined;
  return sortedActivities(activities).map((activity) => {
    const base = { morning: 540, afternoon: 780, evening: 1080 }[activity.period];
    const start = activity.startTime
      ? clockMinutes(activity.startTime)
      : Math.max(base, previousEnd);
    const end = start + activity.minutes;
    const buffer = activity.bufferMinutes ?? 30;
    const overlap = start < previousEnd || end + buffer > 1440;
    previousEnd = Math.max(previousEnd, end + buffer);
    const point = activity.placeId ? findPlace(activity.placeId)?.coordinates : undefined;
    let far = false;
    if (point && previousPoint) {
      const radians = Math.PI / 180;
      const a =
        Math.sin(((point[0] - previousPoint[0]) * radians) / 2) ** 2 +
        Math.cos(point[0] * radians) *
          Math.cos(previousPoint[0] * radians) *
          Math.sin(((point[1] - previousPoint[1]) * radians) / 2) ** 2;
      far = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) > 120;
    }
    if (point) previousPoint = point;
    return { activity, start, end, buffer, overlap, far };
  });
}
