import { useEffect, useState } from 'react';
import { STATES, stateName, type Trip, type Language } from '../data/travel';
import { x } from '../data/experience-copy';
import { offlinePhotoPaths } from '../lib/offline';
export default function OfflineStatus({
  trip,
  lang,
  refresh,
  downloading,
  onRemove,
}: {
  trip: Trip;
  lang: Language;
  refresh: number;
  downloading: boolean;
  onRemove: () => void;
}) {
  const [online, setOnline] = useState(navigator.onLine);
  const [coverage, setCoverage] = useState<{
    key: string;
    count: number;
    missing: string[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const states = STATES.filter((state) => trip.stops.some((stop) => stop.code === state.code));
  const paths = states.flatMap((state) =>
    state.photos.flatMap((photo) => offlinePhotoPaths(photo.src)),
  );
  const key = paths.join('|');
  const current = coverage?.key === key ? coverage : null;
  useEffect(() => {
    const changed = () => setOnline(navigator.onLine);
    window.addEventListener('online', changed);
    window.addEventListener('offline', changed);
    return () => {
      window.removeEventListener('online', changed);
      window.removeEventListener('offline', changed);
    };
  }, []);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (!('caches' in window)) throw new Error('Offline storage unavailable');
        const cache = await caches.open('roam-trip-photos-v1');
        const matches = await Promise.all(paths.map((p) => cache.match(p)));
        const saved = new Set(paths.filter((_, i) => !!matches[i]));
        const missing = states
          .filter((state) =>
            state.photos.some((photo) =>
              offlinePhotoPaths(photo.src).some((path) => !saved.has(path)),
            ),
          )
          .map((state) => state.code);
        if (active) {
          setCoverage({ key, count: saved.size, missing });
          setFailed(false);
        }
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [key, refresh]);
  return (
    <details className="offline-status">
      <summary>
        {x(lang, 'offlineStatus')}
        <span className={online ? 'connection-online' : 'connection-offline'}>
          {x(lang, online ? 'online' : 'offline')}
        </span>
      </summary>
      <p aria-live="polite">
        {current
          ? x(lang, 'offlineCoverage', { count: current.count, total: paths.length })
          : x(lang, 'offlineChecking')}
      </p>
      {!!current?.missing.length && (
        <p>
          {x(lang, 'offlineMissing', {
            states: states
              .filter((state) => current.missing.includes(state.code))
              .map((state) => stateName(state, lang))
              .join(', '),
          })}
        </p>
      )}
      <p>{x(lang, 'offlineScope')}</p>
      {failed && <p role="alert">{x(lang, 'storageError')}</p>}
      {!!current?.count && (
        <button
          className="text-link"
          disabled={busy || downloading}
          onClick={() => setConfirm(true)}
        >
          {x(lang, 'clearDownloads')}
        </button>
      )}
      {confirm && (
        <div className="inline-confirm">
          <p>{x(lang, 'clearDownloads')}?</p>
          <button className="button button-outline" onClick={() => setConfirm(false)}>
            {x(lang, 'cancel')}
          </button>
          <button
            className="button button-red"
            disabled={busy || downloading}
            onClick={async () => {
              setBusy(true);
              onRemove();
              try {
                const cache = await caches.open('roam-trip-photos-v1');
                await Promise.all(paths.map((p) => cache.delete(p)));
                setCoverage({ key, count: 0, missing: states.map((state) => state.code) });
                setConfirm(false);
                setFailed(false);
              } catch {
                setCoverage(null);
                setFailed(true);
              } finally {
                setBusy(false);
              }
            }}
          >
            {x(lang, 'remove')}
          </button>
        </div>
      )}
    </details>
  );
}
