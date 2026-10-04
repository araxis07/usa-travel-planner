import content from '../content/travel-preparation.json' with { type: 'json' };
import { languageIndex, type Language } from '../lib/i18n';

export default function ParkBooking({ placeId, lang }: { placeId: string; lang: Language }) {
  const guide = content.parks.find((park) => park.placeId === placeId);
  if (!guide) return null;
  const l = languageIndex(lang);
  const copy = content.copy;
  return (
    <div className="park-booking" id="guide-booking" aria-labelledby="park-booking-title">
      <h4 id="park-booking-title">{copy.bookingTitle[l]}</h4>
      <p>{copy.bookingIntro[l]}</p>
      {guide.notice && (
        <aside className="day-warning">
          <p>{guide.notice.text[l]}</p>
          <a href={guide.notice.source.url} target="_blank" rel="noreferrer">
            {guide.notice.source.name}
          </a>
        </aside>
      )}
      <p className="content-date">
        {copy.checked[l]} · <time dateTime={guide.checkedAt}>{guide.checkedAt}</time>
        {' · '}
        {copy.review[l]} · <time dateTime={guide.reviewAfter}>{guide.reviewAfter}</time>
      </p>
      {Date.now() >= Date.parse(guide.reviewAfter + 'T00:00:00Z') && (
        <p className="day-warning">{copy.stale[l]}</p>
      )}
      {guide.sections.map((section, i) => (
        <details className="guide-details" key={i} open={i < 2}>
          <summary>{copy.rows[i][l]}</summary>
          <p>{section.text[l]}</p>
          <div className="practical-links">
            {section.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                {source.name}
              </a>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
