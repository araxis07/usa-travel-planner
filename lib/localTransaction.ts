const JOURNAL = 'roam.restore.pending.v1';
const KEYS = ['roam.trip.v1', 'roam.library.v1', 'roam.collections.v1', 'roam.saved.v1'];
function restore(values: Record<string, string | null>) {
  // Free partially written values first; retaining them can make rollback itself exceed quota.
  // The journal remains available if the browser closes during this synchronous restoration.
  for (const key of Object.keys(values)) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(values)) {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }
}
export function recoverLocalTransaction() {
  const raw = localStorage.getItem(JOURNAL);
  if (!raw) return;
  const previous = JSON.parse(raw);
  if (
    !previous ||
    typeof previous !== 'object' ||
    Array.isArray(previous) ||
    Object.entries(previous).some(
      ([k, v]) => !KEYS.includes(k) || (v !== null && typeof v !== 'string'),
    )
  )
    throw Error('Invalid restore journal');
  restore(previous);
  localStorage.removeItem(JOURNAL);
}
export function atomicLocalWrite(values: Record<string, string>) {
  recoverLocalTransaction();
  if (Object.keys(values).some((k) => !KEYS.includes(k))) throw Error('Invalid storage key');
  const previous = Object.fromEntries(Object.keys(values).map((k) => [k, localStorage.getItem(k)]));
  localStorage.setItem(JOURNAL, JSON.stringify(previous));
  try {
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
    localStorage.removeItem(JOURNAL);
  } catch (error) {
    try {
      restore(previous);
      localStorage.removeItem(JOURNAL);
    } catch {
      /* Retry the rollback before the next application read. */
    }
    throw error;
  }
}
