import { validateLibrary, type Library } from './journeyLibrary';
import { validateCollections, type Collections } from './collections';
import { validFavorites } from './storage';
import { atomicLocalWrite } from './localTransaction';
export interface WorkspaceBackup {
  format: 'roam-workspace';
  version: 1;
  exportedAt: string;
  library: Library;
  collections: Collections;
  favorites: string[];
}
export interface RestoreSelection {
  trips: string[];
  collections: boolean;
  favorites: boolean;
  mode: 'merge' | 'replace';
}
export function validateWorkspace(value: unknown): WorkspaceBackup {
  if (!value || typeof value !== 'object') throw Error('Invalid backup');
  const v = value as WorkspaceBackup;
  if (
    v.format !== 'roam-workspace' ||
    v.version !== 1 ||
    typeof v.exportedAt !== 'string' ||
    !Number.isFinite(Date.parse(v.exportedAt)) ||
    !Array.isArray(v.favorites) ||
    validFavorites(v.favorites).length !== v.favorites.length
  )
    throw Error('Invalid backup');
  const collections = validateCollections(v.collections);
  if (
    !Array.isArray(v.collections.visited) ||
    !Array.isArray(v.collections.groups) ||
    JSON.stringify(collections) !==
      JSON.stringify({
        groups: v.collections.groups.map((g) => ({ id: g.id, name: g.name, places: g.places })),
        visited: v.collections.visited,
      })
  )
    throw Error('Invalid collections in backup');
  return {
    format: 'roam-workspace',
    version: 1,
    exportedAt: v.exportedAt,
    library: validateLibrary(v.library),
    collections,
    favorites: validFavorites(v.favorites),
  };
}
export function planRestore(
  current: WorkspaceBackup,
  backup: WorkspaceBackup,
  selection: RestoreSelection,
): WorkspaceBackup {
  if (!selection.trips.length && !selection.collections && !selection.favorites)
    throw Error('noneSelected');
  if (
    new Set(selection.trips).size !== selection.trips.length ||
    selection.trips.some((id) => !backup.library.trips.some((t) => t.id === id))
  )
    throw Error('invalidBackup');
  const next = structuredClone(current);
  if (selection.trips.length) {
    const chosen = backup.library.trips
      .filter((t) => selection.trips.includes(t.id))
      .map((t) => ({
        ...structuredClone(t),
        id: selection.mode === 'merge' ? crypto.randomUUID() : t.id,
      }));
    if (selection.mode === 'merge') next.library.trips.push(...chosen);
    else {
      const active =
        chosen.find((t) => t.id === backup.library.activeId && !t.archived) ??
        chosen.find((t) => !t.archived) ??
        chosen[0];
      active.archived = false;
      next.library = { version: 1, activeId: active.id, trips: chosen };
    }
  }
  if (selection.collections) {
    if (selection.mode === 'replace') next.collections = structuredClone(backup.collections);
    else {
      for (const group of backup.collections.groups) {
        const match = next.collections.groups.find((g) =>
          group.id === 'someday' ? g.id === 'someday' : g.id !== 'someday' && g.name === group.name,
        );
        if (match) match.places = [...new Set([...match.places, ...group.places])];
        else next.collections.groups.push({ ...structuredClone(group), id: crypto.randomUUID() });
      }
      next.collections.visited = [
        ...new Set([...next.collections.visited, ...backup.collections.visited]),
      ];
    }
  }
  if (selection.favorites)
    next.favorites =
      selection.mode === 'replace'
        ? [...backup.favorites]
        : [...new Set([...next.favorites, ...backup.favorites])];
  if (next.library.trips.length > 30 || next.collections.groups.length > 20)
    throw Error('capacity');
  return validateWorkspace(next);
}
export function persistWorkspace(value: WorkspaceBackup) {
  const checked = validateWorkspace(value);
  atomicLocalWrite({
    'roam.library.v1': JSON.stringify(checked.library),
    'roam.trip.v1': JSON.stringify(
      checked.library.trips.find((t) => t.id === checked.library.activeId)!.trip,
    ),
    'roam.collections.v1': JSON.stringify(checked.collections),
    'roam.saved.v1': JSON.stringify(checked.favorites),
  });
}
