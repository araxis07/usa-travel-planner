import TravelImage from './TravelImage';
import { useState } from 'react';
import type { Language } from '../data/travel';
import { stateName, STATES } from '../data/travel';
import { x } from '../data/experience-copy';
import type { JourneyLibrary } from '../lib/journeyLibrary';
import { downloadFile, tripDays } from '../lib/storage';
import { LOCALES } from '../lib/i18n';
import Dialog from './Dialog';
import Icon from './Icon';

export default function TripLibrary({
  library,
  lang,
  onClose,
  onOpen,
  notify,
}: {
  library: JourneyLibrary;
  lang: Language;
  onClose: () => void;
  onOpen: () => void;
  notify: (message: string) => void;
}) {
  const [archived, setArchived] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const create = (trip?: (typeof library.trips)[number]['trip']) => {
    const result = library.create(trip);
    if (result === 'ok') onOpen();
    else notify(x(lang, result === 'full' ? 'libraryLimit' : 'storageError'));
  };
  return (
    <Dialog title={x(lang, 'library')} onClose={onClose} wide closeLabel={x(lang, 'done')}>
      <div className="library-panel">
        <span className="eyebrow">ROAM / COLLECTIONS</span>
        <h2>{x(lang, 'library')}</h2>
        <p>{x(lang, 'localOnly')}</p>
        {library.error && (
          <p role="alert" className="storage-warning">
            {x(lang, 'storageError')}
          </p>
        )}
        <div className="library-toolbar">
          <div className="segmented">
            <button aria-pressed={!archived} onClick={() => setArchived(false)}>
              {x(lang, 'activeTrips')}
            </button>
            <button aria-pressed={archived} onClick={() => setArchived(true)}>
              {x(lang, 'archived')}
            </button>
          </div>
          <button className="button button-red" onClick={() => create()}>
            <Icon name="plus" size={17} />
            {x(lang, 'newTrip')}
          </button>
        </div>
        <div className="library-grid">
          {library.trips
            .filter((e) => e.archived === archived)
            .sort(
              (a, b) =>
                Number(b.id === library.activeId) - Number(a.id === library.activeId) ||
                Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
            )
            .map((entry) => {
              const state = STATES.find((s) => s.code === entry.trip.stops[0]?.code);
              return (
                <article className="library-card" key={entry.id}>
                  {state && (
                    <TravelImage
                      src={state.photos[state.cover].src}
                      alt=""
                      loading="lazy"
                      width="480"
                      height="240"
                    />
                  )}
                  <div className="library-card-body">
                    <span className="eyebrow">
                      {entry.id === library.activeId
                        ? x(lang, 'current')
                        : new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'medium' }).format(
                            new Date(entry.updatedAt),
                          )}
                    </span>
                    <h3>{entry.trip.name || x(lang, 'unnamed')}</h3>
                    <p>
                      {entry.trip.stops
                        .map((s) =>
                          stateName(
                            STATES.find((v) => v.code === s.code)!,
                            lang,
                          ),
                        )
                        .join(' → ') || '—'}
                    </p>
                    <span>
                      {tripDays(entry.trip)} · {x(lang, 'duration')}
                    </span>
                    <div className="library-card-actions">
                      {!entry.archived && (
                        <button
                          className="button button-navy"
                          onClick={() => {
                            if (library.open(entry.id)) onOpen();
                          }}
                        >
                          {x(lang, 'open')}
                        </button>
                      )}
                      <button
                        className="text-link"
                        onClick={() => create(structuredClone(entry.trip))}
                      >
                        {x(lang, 'duplicate')}
                      </button>
                      <button
                        className="text-link"
                        onClick={() =>
                          downloadFile(
                            'roam-trip.json',
                            JSON.stringify({ version: 2, trip: entry.trip }, null, 2),
                            'application/json',
                          )
                        }
                      >
                        {x(lang, 'backup')}
                      </button>
                      {entry.id !== library.activeId && (
                        <>
                          <button
                            className="text-link"
                            onClick={() => library.archive(entry.id, !entry.archived)}
                          >
                            {x(lang, entry.archived ? 'restore' : 'archive')}
                          </button>
                          <button className="text-link" onClick={() => setRemoving(entry.id)}>
                            {x(lang, 'remove')}
                          </button>
                        </>
                      )}
                    </div>
                    {removing === entry.id && (
                      <div className="inline-confirm" role="alert">
                        <p>{x(lang, 'confirmDelete')}</p>
                        <button
                          className="button button-red"
                          onClick={() => {
                            library.remove(entry.id);
                            setRemoving(null);
                          }}
                        >
                          {x(lang, 'remove')}
                        </button>
                        <button className="button button-outline" onClick={() => setRemoving(null)}>
                          {x(lang, 'cancel')}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      </div>
    </Dialog>
  );
}
