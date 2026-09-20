import { useEffect, useState } from 'react';
import { STATES, type Trip, type Language } from '../data/travel';
import { x } from '../data/experience-copy';
export default function OfflineStatus({
  trip,
  lang,
  refresh,
}: {
  trip: Trip;
  lang: Language;
  refresh: boolean;
}) {
  const [online, setOnline] = useState(navigator.onLine);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const paths = trip.stops.flatMap(
    (s) => STATES.find((v) => v.code === s.code)?.photos.map((p) => p.src) ?? [],
  );
  const key = paths.join('|');
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
        if (!('caches' in window)) return;
        const cache = await caches.open('roam-trip-photos-v1');
        const matches = await Promise.all(paths.map((p) => cache.match(p)));
        if (active) setCount(matches.filter(Boolean).length);
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
        {count ? x(lang, 'offlineCount', { count }) : x(lang, 'noDownloads')}
      </p>
      {failed && <p role="alert">{x(lang, 'storageError')}</p>}
      {count > 0 && (
        <button className="text-link" disabled={busy} onClick={() => setConfirm(true)}>
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
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const cache = await caches.open('roam-trip-photos-v1');
                await Promise.all(
                  paths
                    .flatMap((src) => [
                      src,
                      ...[480, 640, 960].map((width) =>
                        src
                          .replace('/images/', '/images/responsive/')
                          .replace(/\.(jpg|jpeg|png)$/, `-${width}.webp`),
                      ),
                    ])
                    .map((p) => cache.delete(p)),
                );
                setCount(0);
                setConfirm(false);
              } catch {
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
