import { STATES, local, stateName, type Trip, type Language } from '../data/travel';
import { x } from '../data/experience-copy';
import { findPlace } from '../lib/destinations';
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
        placeIds: activities.flatMap((activity) => (activity.placeId ? [activity.placeId] : [])),
      };
    });
    offset += stop.days;
    return result;
  });
  const issues = days.filter((day) => day.empty || day.warning);
  const notices = [...new Set(days.flatMap((day) => day.placeIds))].flatMap((id) => {
    const place = findPlace(id);
    const advisory = place?.profile.advisory;
    return place && advisory
      ? [{ place, advisory, days: days.filter((day) => day.placeIds.includes(id)) }]
      : [];
  });
  return (
    <details className="trip-readiness">
      <summary>
        <strong>{x(lang, 'planReview')}</strong>
        <span>
          {x(lang, 'openDays', { count: days.filter((d) => d.empty).length })} ·{' '}
          {x(lang, 'reviewDays', { count: days.filter((d) => d.warning).length })}
          {' · '}
          {x(lang, 'noticePlaces', { count: notices.length })}
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
      <section className="readiness-notices" aria-label={x(lang, 'placeNotices')}>
        <h3>{x(lang, 'placeNotices')}</h3>
        <p className="fine-print">{x(lang, 'placeNoticesNote')}</p>
        {notices.length ? (
          <ul>
            {notices.map(({ place, advisory, days: noticeDays }) => (
              <li key={place.id}>
                <h4>{local(place.state.placeNames[place.index], lang)}</h4>
                <p>{local(advisory.text, lang)}</p>
                <p>
                  <a href={advisory.source} target="_blank" rel="noreferrer">
                    {x(lang, 'official')}
                  </a>
                  {' · '}
                  <time dateTime={advisory.checkedAt}>
                    {x(lang, 'arrivalChecked', { date: advisory.checkedAt })}
                  </time>
                </p>
                <div className="readiness-actions">
                  {noticeDays.map((day) => (
                    <button
                      key={`${day.code}-${day.day}`}
                      className="text-link"
                      onClick={() => onDay(day.code, day.day)}
                    >
                      {x(lang, 'noticeDay', {
                        day: day.number,
                        state: stateName(
                          STATES.find((s) => s.code === day.code)!,
                          lang,
                        ),
                      })}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>{x(lang, 'noPlaceNotices')}</p>
        )}
      </section>
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
