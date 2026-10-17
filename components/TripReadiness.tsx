import { STATES, stateName, type Trip, type Language } from '../data/travel';
import { x } from '../data/experience-copy';
import { dayTimeline } from '../lib/timeline';
import { checklistItems } from './TripChecklist';
import type { PhotoStatus } from './OfflineStatus';

export default function TripReadiness({
  trip,
  lang,
  photoStatus,
  onDay,
  onChecklist,
  onPhotos,
}: {
  trip: Trip;
  lang: Language;
  photoStatus: PhotoStatus;
  onDay: (code: string, day: number) => void;
  onChecklist: () => void;
  onPhotos: () => void;
}) {
  let offset = 0;
  const days = trip.stops.flatMap((stop) => {
    const result = Array.from({ length: stop.days }, (_, i) => {
      const activities = (stop.activities ?? []).filter((a) => a.day === i + 1);
      return {
        code: stop.code,
        day: i + 1,
        number: offset + i + 1,
        empty: !activities.length,
        warning: dayTimeline(activities).some((item) => item.overlap || item.far),
      };
    });
    offset += stop.days;
    return result;
  });
  const issues = days.filter((day) => day.empty || day.warning);
  return (
    <details className="trip-readiness">
      <summary>
        <strong>{x(lang, 'planReview')}</strong>
        <span>
          {x(lang, 'openDays', { count: days.filter((d) => d.empty).length })} ·{' '}
          {x(lang, 'reviewDays', { count: days.filter((d) => d.warning).length })}
        </span>
      </summary>
      <p className="fine-print">{x(lang, 'planReviewNote')}</p>
      {issues.length ? (
        <ul>
          {issues.map((day) => (
            <li key={`${day.code}-${day.day}`}>
              <button className="text-link" onClick={() => onDay(day.code, day.day)}>
                {x(lang, day.empty ? 'openDay' : 'reviewDay', {
                  day: day.number,
                  state: stateName(
                    STATES.find((s) => s.code === day.code)!,
                    lang,
                  ),
                })}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>{x(lang, 'noDayIssues')}</p>
      )}
      <div className="readiness-actions">
        <button className="button button-outline" onClick={onChecklist}>
          {x(lang, 'checklistRemaining', {
            count: checklistItems(trip).filter((item) => !item.done).length,
          })}
        </button>
        <button className="button button-outline" onClick={onPhotos}>
          {x(
            lang,
            photoStatus === 'saved'
              ? 'photosSaved'
              : photoStatus === 'missing'
                ? 'photosMissing'
                : 'checkPhotos',
          )}
        </button>
      </div>
    </details>
  );
}
