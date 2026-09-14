import { useRef, useState } from 'react';
import type { Language } from '../data/travel';
import { w } from '../data/workspace-copy';
import { x } from '../data/experience-copy';
import { downloadFile } from '../lib/storage';
import {
  validateWorkspace,
  planRestore,
  type WorkspaceBackup as Backup,
  type RestoreSelection,
} from '../lib/workspaceBackup';
export default function WorkspaceBackup({
  lang,
  current,
  onRestore,
}: {
  lang: Language;
  current: Backup;
  onRestore: (value: Backup) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null),
    [error, setError] = useState(''),
    [done, setDone] = useState(false);
  const [selection, setSelection] = useState<RestoreSelection>({
    trips: [],
    collections: true,
    favorites: true,
    mode: 'merge',
  });
  return (
    <details className="workspace-backup">
      <summary>{w(lang, 'workspace')}</summary>
      <p>{w(lang, 'backupHint')}</p>
      <div className="workspace-backup-actions">
        <button
          className="button button-outline"
          onClick={() =>
            downloadFile(
              'roam-all-travel-data.json',
              JSON.stringify(validateWorkspace(current), null, 2),
              'application/json',
            )
          }
        >
          {w(lang, 'exportAll')}
        </button>
        <button className="button button-outline" onClick={() => input.current?.click()}>
          {w(lang, 'importAll')}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        aria-label={w(lang, 'backupFile')}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setError('');
          setDone(false);
          setPending(null);
          try {
            if (f.size > 10000000) throw Error();
            const data = validateWorkspace(JSON.parse(await f.text()));
            setPending(data);
            setSelection({
              trips: data.library.trips.map((t) => t.id),
              collections: true,
              favorites: true,
              mode: 'merge',
            });
          } catch {
            setError(w(lang, 'invalidBackup'));
          }
        }}
      />
      {error && <p role="alert">{error}</p>}
      {done && <p role="status">{w(lang, 'restored')}</p>}
      {pending && (
        <div className="restore-preview">
          <h3>{w(lang, 'selectRestore')}</h3>
          <fieldset>
            <legend>{x(lang, 'library')}</legend>
            {pending.library.trips.map((t) => (
              <label key={t.id}>
                <input
                  type="checkbox"
                  checked={selection.trips.includes(t.id)}
                  onChange={() =>
                    setSelection((v) => ({
                      ...v,
                      trips: v.trips.includes(t.id)
                        ? v.trips.filter((id) => id !== t.id)
                        : [...v.trips, t.id],
                    }))
                  }
                />
                {t.trip.name || x(lang, 'unnamed')} {t.archived && `· ${x(lang, 'archived')}`}
              </label>
            ))}
          </fieldset>
          <label>
            <input
              type="checkbox"
              checked={selection.collections}
              onChange={(e) => setSelection((v) => ({ ...v, collections: e.target.checked }))}
            />
            {w(lang, 'collections')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={selection.favorites}
              onChange={(e) => setSelection((v) => ({ ...v, favorites: e.target.checked }))}
            />
            {w(lang, 'favorites')}
          </label>
          <fieldset>
            {(['merge', 'replace'] as const).map((mode) => (
              <label key={mode}>
                <input
                  type="radio"
                  name="restore-mode"
                  value={mode}
                  checked={selection.mode === mode}
                  onChange={() => setSelection((v) => ({ ...v, mode }))}
                />
                {w(lang, mode)}
              </label>
            ))}
          </fieldset>
          <p>{w(lang, selection.mode === 'merge' ? 'mergeHint' : 'replaceWarning')}</p>
          <div className="workspace-backup-actions">
            <button
              className="button button-red"
              onClick={() => {
                try {
                  const next = planRestore(current, pending, selection);
                  onRestore(next);
                  setPending(null);
                  setDone(true);
                  setError('');
                } catch (e) {
                  const code = e instanceof Error ? e.message : '';
                  setError(
                    code === 'capacity' || code === 'noneSelected'
                      ? w(lang, code)
                      : x(lang, 'storageError'),
                  );
                }
              }}
            >
              {w(lang, 'restore')}
            </button>
            <button className="button button-outline" onClick={() => setPending(null)}>
              {w(lang, 'cancel')}
            </button>
          </div>
        </div>
      )}
    </details>
  );
}
