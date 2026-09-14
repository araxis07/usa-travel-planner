import { createClient } from '@supabase/supabase-js';
import { validateTrip } from './storage';
import type { Trip } from '../data/travel';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// A legacy anon JWT is allowed; never accept a service-role JWT or secret key.
function publicKey(value: string | undefined) {
  if (!value) return false;
  if (value.startsWith('sb_publishable_')) return true;
  try {
    return (
      JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon'
    );
  } catch {
    return false;
  }
}
export const cloud =
  url && publicKey(key)
    ? createClient(url, key, { auth: { detectSessionInUrl: true, flowType: 'pkce' } })
    : null;
export interface CloudTrip {
  id: string;
  revision: number;
  updated_at: string;
  payload: Trip;
}
export interface CloudShare {
  token: string;
  expires_at: string;
  payload: Trip;
}
const requireCloud = () => {
  if (!cloud) throw new Error('CLOUD_UNAVAILABLE');
  return cloud;
};
export async function listCloudTrips(): Promise<CloudTrip[]> {
  const { data, error } = await requireCloud()
    .from('roam_trips')
    .select('id,revision,updated_at,payload')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, payload: validateTrip(row.payload) }));
}
export async function saveCloudTrip(
  trip: Trip,
  previous?: Pick<CloudTrip, 'id' | 'revision'>,
): Promise<CloudTrip> {
  const payload = validateTrip(trip);
  const table = requireCloud().from('roam_trips');
  const query = previous
    ? table.update({ payload }).eq('id', previous.id).eq('revision', previous.revision)
    : table.insert({ payload });
  const { data, error } = await query.select('id,revision,updated_at,payload').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('CLOUD_CONFLICT');
  return { ...data, payload: validateTrip(data.payload) };
}
export function shareSnapshot(trip: Trip, includeNotes: boolean): Trip {
  return validateTrip({
    ...trip,
    checklist: includeNotes ? trip.checklist : undefined,
    expenses: includeNotes ? trip.expenses : undefined,
    budgetMode: includeNotes ? trip.budgetMode : undefined,
    stops: trip.stops.map((s) => ({
      ...s,
      notes: includeNotes ? s.notes : '',
      activities: s.activities?.map((a) => ({ ...a, notes: includeNotes ? a.notes : '' })),
    })),
  });
}
export async function createShare(trip: Trip, includeNotes: boolean): Promise<CloudShare> {
  const { data, error } = await requireCloud()
    .from('roam_shares')
    .insert({ payload: shareSnapshot(trip, includeNotes) })
    .select('token,expires_at,payload')
    .single();
  if (error) throw error;
  return { ...data, payload: validateTrip(data.payload) };
}
export async function readShare(token: string): Promise<{ trip: Trip; expiresAt: string } | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return null;
  const { data, error } = await requireCloud().rpc('roam_read_shared_trip', { p_token: token });
  if (error) throw error;
  return data ? { ...data, trip: validateTrip(data.trip) } : null;
}
