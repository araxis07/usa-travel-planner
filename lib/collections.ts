import { useEffect, useState } from 'react';
import { findPlace } from './destinations';
import { readLocal } from './storage';
export interface Collection {
  id: string;
  name: string;
  places: string[];
}
export interface Collections {
  groups: Collection[];
  visited: string[];
}
export function validateCollections(value: unknown): Collections {
  if (!value || typeof value !== 'object') throw Error('Invalid collections');
  const v = value as Collections;
  const places = (items: unknown) =>
    Array.isArray(items)
      ? [
          ...new Set(items.filter((p): p is string => typeof p === 'string' && !!findPlace(p))),
        ].slice(0, 150)
      : [];
  if (!Array.isArray(v.groups) || v.groups.length > 20) throw Error('Invalid collections');
  const ids = new Set<string>();
  const groups = v.groups.map((g) => {
    if (
      !g ||
      typeof g.id !== 'string' ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(g.id) ||
      ids.has(g.id) ||
      typeof g.name !== 'string' ||
      g.name.length > 60
    )
      throw Error('Invalid collection');
    ids.add(g.id);
    return { id: g.id, name: g.name, places: places(g.places) };
  });
  if (!ids.has('someday')) {
    if (groups.length >= 20) throw Error('Too many collections');
    groups.unshift({ id: 'someday', name: '', places: [] });
  }
  return {
    groups: [
      ...groups.filter((g) => g.id === 'someday'),
      ...groups.filter((g) => g.id !== 'someday'),
    ],
    visited: places(v.visited),
  };
}
export function useCollections() {
  const [value, setValue] = useState(() =>
    readLocal<Collections>(
      'roam.collections.v1',
      { groups: [{ id: 'someday', name: '', places: [] }], visited: [] },
      validateCollections,
    ),
  );
  const [error, setError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem('roam.collections.v1', JSON.stringify(value));
      setError(false);
    } catch {
      setError(true);
    }
  }, [value]);
  return {
    ...value,
    error,
    restore(data: Collections) {
      setValue(validateCollections(data));
    },
    saved: (id: string) => value.groups.some((g) => g.places.includes(id)),
    toggle(id: string, group = 'someday') {
      if (!findPlace(id)) return;
      setValue((v) => ({
        ...v,
        groups: v.groups.map((g) =>
          g.id !== group
            ? g
            : {
                ...g,
                places: g.places.includes(id)
                  ? g.places.filter((p) => p !== id)
                  : [...g.places, id],
              },
        ),
      }));
    },
    toggleVisited(id: string) {
      if (!findPlace(id)) return;
      setValue((v) => ({
        ...v,
        visited: v.visited.includes(id) ? v.visited.filter((p) => p !== id) : [...v.visited, id],
      }));
    },
    create(name: string) {
      if (!name.trim() || value.groups.length >= 20) return;
      setValue((v) => ({
        ...v,
        groups: [
          ...v.groups,
          { id: crypto.randomUUID(), name: name.trim().slice(0, 60), places: [] },
        ],
      }));
    },
    remove(id: string) {
      if (id !== 'someday')
        setValue((v) => ({ ...v, groups: v.groups.filter((g) => g.id !== id) }));
    },
  };
}
export type PlaceCollections = ReturnType<typeof useCollections>;
