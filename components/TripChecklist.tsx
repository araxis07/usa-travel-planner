import { useState } from 'react';
import type { Trip, Language } from '../data/travel';
import { x, type ExperienceKey } from '../data/experience-copy';
export const CHECKLIST_KEYS = [
  'documents',
  'bookings',
  'conditions',
  'pack',
  'download',
  'contacts',
] as const;
export function checklistItems(trip: Trip) {
  return trip.checklist ?? CHECKLIST_KEYS.map((id) => ({ id, label: '', done: false }));
}
export function checklistLabel(item: NonNullable<Trip['checklist']>[number], lang: Language) {
  return (
    item.label ||
    x(
      lang,
      CHECKLIST_KEYS.includes(item.id as (typeof CHECKLIST_KEYS)[number])
        ? (item.id as ExperienceKey)
        : 'addTask',
    )
  );
}
export default function TripChecklist({
  trip,
  setTrip,
  lang,
}: {
  trip: Trip;
  setTrip: (trip: Trip) => void;
  lang: Language;
}) {
  const [label, setLabel] = useState('');
  const items = checklistItems(trip);
  return (
    <details className="trip-checklist">
      <summary>
        <strong>{x(lang, 'checklist')}</strong>
        <span>
          {items.filter((i) => i.done).length} / {items.length} {x(lang, 'completed')}
        </span>
      </summary>
      <progress
        max={Math.max(1, items.length)}
        value={items.filter((i) => i.done).length}
        aria-label={x(lang, 'checklist')}
      />
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <label>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() =>
                  setTrip({
                    ...trip,
                    checklist: items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)),
                  })
                }
              />
              <span>{checklistLabel(item, lang)}</span>
            </label>
            <button
              className="icon-button"
              aria-label={`${x(lang, 'remove')} ${checklistLabel(item, lang)}`}
              onClick={() => setTrip({ ...trip, checklist: items.filter((i) => i.id !== item.id) })}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (label.trim() && items.length < 80) {
            setTrip({
              ...trip,
              checklist: [...items, { id: crypto.randomUUID(), label: label.trim(), done: false }],
            });
            setLabel('');
          }
        }}
      >
        <label>
          {x(lang, 'addTask')}
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={200}
            required
          />
        </label>
        <button className="button button-outline" disabled={items.length >= 80}>
          {x(lang, 'create')}
        </button>
      </form>
    </details>
  );
}
