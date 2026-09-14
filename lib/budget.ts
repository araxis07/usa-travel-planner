import type { Trip, TripExpense } from '../data/travel';
export const EXPENSE_CATEGORIES = [
  'flight',
  'lodging',
  'transport',
  'food',
  'activities',
  'other',
] as const;
export const cents = (amount: number) => Math.round((amount + Number.EPSILON) * 100);
export function validateExpenses(value: unknown): TripExpense[] {
  if (!Array.isArray(value) || value.length > 200) throw Error('Invalid expenses');
  const ids = new Set<string>();
  return value.map((item) => {
    if (
      !item ||
      typeof item.id !== 'string' ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(item.id) ||
      ids.has(item.id) ||
      !EXPENSE_CATEGORIES.includes(item.category) ||
      typeof item.name !== 'string' ||
      !item.name.trim() ||
      item.name.length > 120 ||
      [item.planned, item.paid].some(
        (n) => typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1000000,
      )
    )
      throw Error('Invalid expense');
    ids.add(item.id);
    return {
      id: item.id,
      category: item.category,
      name: item.name.trim(),
      planned: cents(item.planned) / 100,
      paid: cents(item.paid) / 100,
    };
  });
}
export function budgetTotals(trip: Trip) {
  const items = trip.expenses ?? [];
  const planned = items.reduce((n, e) => n + cents(e.planned), 0);
  const paid = items.reduce((n, e) => n + cents(e.paid), 0);
  const daily =
    trip.stops.reduce((n, s) => n + s.days, 0) * trip.travelers * cents(trip.dailyBudget);
  return {
    planned: planned / 100,
    paid: paid / 100,
    remaining: items.reduce((n, e) => n + Math.max(0, cents(e.planned) - cents(e.paid)), 0) / 100,
    overpaid: items.some((e) => cents(e.paid) > cents(e.planned)),
    estimate: (trip.budgetMode === 'items' ? planned : daily) / 100,
  };
}
