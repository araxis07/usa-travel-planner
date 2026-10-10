import type { Arrival } from '../lib/arrival';
import { languageIndex, type Language } from '../lib/i18n';
import { x } from '../data/experience-copy';

export default function ArrivalReference({
  arrival: a,
  lang,
}: {
  arrival: Arrival;
  lang: Language;
}) {
  const l = languageIndex(lang);
  return (
    <div className="arrival-reference">
      <p>
        <strong>
          {x(lang, 'arrival')} · {a.label[l]}
        </strong>
      </p>
      <p>{a.note[l]}</p>
      <p>{x(lang, 'arrivalLimit')}</p>
      <div className="city-guide-links">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.coordinates.join(','))}`}
          target="_blank"
          rel="noreferrer"
        >
          {a.label[l]}
        </a>
        <a href={a.source.url} target="_blank" rel="noreferrer">
          {a.source.name}
        </a>
        <a href={a.coordinateSource} target="_blank" rel="noreferrer">
          © OpenStreetMap contributors
        </a>
        <a href={a.coordinateLicense} target="_blank" rel="noreferrer">
          ODbL
        </a>
      </div>
      <p className="content-date">{x(lang, 'arrivalChecked', { date: a.checkedAt })}</p>
    </div>
  );
}
