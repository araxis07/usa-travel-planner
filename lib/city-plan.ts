import content from '../content/city-guides.json?copy' with { type: 'json' };
import { languageIndex, type Language } from './i18n';
import { starterTrip } from '../data/itineraries';
import { x } from '../data/experience-copy';
import type { Trip, TripActivity } from '../data/travel';
import { CITY_IDS, type City } from './city-content';

export const cityCopy = content.copy;

export function cityGuideTrip(guide: City, days: number, lang: Language): Trip {
  if (!CITY_IDS.includes(guide.placeId) || !Number.isInteger(days) || days < 1 || days > 3)
    throw new Error('Invalid city plan');
  const l = languageIndex(lang);
  const trip = starterTrip(guide.placeId, days, lang);
  trip.name = x(lang, 'cityPlanName', { city: trip.name, days });
  const stop = trip.stops[0];
  stop.notes = x(lang, 'cityPlanNote');
  stop.activities = Array.from({ length: days }, (_, i) => {
    const [visit, meal, rest] = stop.activities!.filter((a) => a.day === i + 1);
    visit.title = guide.days[i].title[l];
    visit.minutes = 180;
    visit.notes = `${guide.days[i].text[l]}\n${cityCopy.alternative[l]}: ${guide.days[i].alternative[l]}`;
    // shortcut: only source-checked arrivals get pins, map other city walks after checking their entrances.
    delete visit.placeId;
    if (guide.days[i].arrival) visit.arrival = structuredClone(guide.days[i].arrival);
    meal.title = guide.food.stops[i].title[l];
    meal.notes = guide.food.stops[i].text[l];
    const activities: TripActivity[] = [
      {
        id: crypto.randomUUID(),
        day: i + 1,
        period: 'morning' as const,
        title: x(lang, 'cityRoute'),
        minutes: 30,
        bufferMinutes: 15,
        notes: x(lang, 'cityTransferNote'),
      },
      visit,
      meal,
      rest,
    ];
    activities.forEach((activity) => delete activity.startTime);
    return activities;
  }).flat();
  return trip;
}
