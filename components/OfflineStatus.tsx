import { useEffect, useRef, useState } from 'react';
import { STATES, stateName, type Trip, type Language } from '../data/travel';
import { x } from '../data/experience-copy';
import { offlinePhotoPaths } from '../lib/offline';
export type PhotoStatus = 'checking' | 'downloading' | 'unavailable' | 'missing' | 'saved';
export default function OfflineStatus({
  trip,
  lang,
  refresh,
  downloading,
  onRemove,
  onRemoving,
  onStatus,
}: {
  trip: Trip;
  lang: Language;
  refresh: number;
  downloading: boolean;
  onRemove: () => void;
  onRemoving: (busy: boolean) => void;
  onStatus?: (status: PhotoStatus) => void;
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
  const [attempt, setAttempt] = useState(0);
  const removing = useRef(false);
  const revision = useRef(0);
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
    if (downloading) return;
    let active = true;
    setConfirm(false);
    const check = async () => {
      if (removing.current) return;
      const id = ++revision.current;
      setCoverage(null);
      setFailed(false);
      try {
        if (!paths.length) {
          setCoverage({ key, count: 0, missing: [] });
          return;
        }
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
        if (active && id === revision.current) {
          setCoverage({ key, count: saved.size, missing });
          if (missing.length) onRemove();
        }
      } catch {
        if (active && id === revision.current) {
          setFailed(true);
          onRemove();
        }
      }
    };
    const visible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    void check();
    window.addEventListener('focus', visible);
    window.addEventListener('online', visible);
    document.addEventListener('visibilitychange', visible);
    return () => {
      active = false;
      window.removeEventListener('focus', visible);
      window.removeEventListener('online', visible);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [key, refresh, attempt, downloading, onRemove]);
  useEffect(() => {
    onStatus?.(
      downloading
        ? 'downloading'
        : busy
          ? 'checking'
          : failed
            ? 'unavailable'
            : !current
              ? 'checking'
              : current.missing.length
                ? 'missing'
                : 'saved',
    );
  }, [downloading, busy, failed, current, onStatus]);
  return (
    <details className="offline-status">
      <summary>
        {x(lang, 'offlineStatus')}
        <span className={online ? 'connection-online' : 'connection-offline'}>
          {x(lang, online ? 'online' : 'offline')}
        </span>
      </summary>
      {!failed && (
        <p aria-live="polite">
          {!paths.length
            ? x(lang, 'offlineEmpty')
            : current
              ? x(lang, 'offlineCoverage', { count: current.count, total: paths.length })
              : x(lang, 'offlineChecking')}
        </p>
      )}
      {!downloading && !failed && !!current?.missing.length && (
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
      {failed && (
        <>
          <p role="alert">{x(lang, 'offlineStorageError')}</p>
          <button
            className="text-link"
            disabled={busy || downloading}
            onClick={() => setAttempt((value) => value + 1)}
          >
            {x(lang, 'offlineCheckAgain')}
          </button>
        </>
      )}
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
          <p>{x(lang, 'offlineRemoveExplanation')}</p>
          <button className="button button-outline" onClick={() => setConfirm(false)}>
            {x(lang, 'cancel')}
          </button>
          <button
            className="button button-red"
            disabled={busy || downloading}
            onClick={async () => {
              setBusy(true);
              removing.current = true;
              revision.current++;
              onRemoving(true);
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
                removing.current = false;
                onRemoving(false);
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
