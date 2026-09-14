import { useState } from 'react';
import type { Language, Trip, TripExpense } from '../data/travel';
import { budgetTotals, EXPENSE_CATEGORIES } from '../lib/budget';
import { w } from '../data/workspace-copy';
import { LOCALES } from '../lib/i18n';
export default function TripBudget({
  trip,
  lang,
  setTrip,
}: {
  trip: Trip;
  lang: Language;
  setTrip: (trip: Trip) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TripExpense['category']>('lodging');
  const [planned, setPlanned] = useState('');
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const totals = budgetTotals(trip),
    items = trip.expenses ?? [];
  const money = (value: number) =>
    new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'USD' }).format(value);
  const update = (id: string, fields: Partial<TripExpense>) =>
    setTrip({ ...trip, expenses: items.map((e) => (e.id === id ? { ...e, ...fields } : e)) });
  const amount = (v: string) =>
    Math.round(Math.max(0, Math.min(1000000, Number(v) || 0)) * 100) / 100;
  return (
    <section className="trip-budget" aria-label={w(lang, 'budget')}>
      <div className="budget-heading">
        <div>
          <span className="eyebrow">ROAM / USD</span>
          <h2>{w(lang, 'budget')}</h2>
        </div>
        <label>
          {w(lang, 'budgetBasis')}
          <select
            value={trip.budgetMode ?? 'daily'}
            onChange={(e) => setTrip({ ...trip, budgetMode: e.target.value as Trip['budgetMode'] })}
          >
            <option value="daily">{w(lang, 'dailyMode')}</option>
            <option value="items">{w(lang, 'itemMode')}</option>
          </select>
        </label>
      </div>
      <p className="fine-print">{w(lang, 'budgetHint')}</p>
      <div className="expense-totals" aria-live="polite">
        <div>
          <span>{w(lang, 'planned')}</span>
          <strong>{money(totals.estimate)}</strong>
        </div>
        <div>
          <span>{w(lang, 'perPerson')}</span>
          <strong>{money(totals.estimate / trip.travelers)}</strong>
        </div>
        <div>
          <span>{w(lang, 'paid')}</span>
          <strong>{money(totals.paid)}</strong>
        </div>
        <div>
          <span>{w(lang, 'unpaid')}</span>
          <strong>
            {money(
              trip.budgetMode === 'items'
                ? totals.remaining
                : Math.max(0, totals.estimate - totals.paid),
            )}
          </strong>
        </div>
      </div>
      {totals.overpaid && (
        <p className="budget-warning" role="status">
          {w(lang, 'overpaid')}
        </p>
      )}
      <form
        className="expense-add"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || items.length >= 200) return;
          setTrip({
            ...trip,
            budgetMode: 'items',
            expenses: [
              ...items,
              {
                id: crypto.randomUUID(),
                name: name.trim(),
                category,
                planned: amount(planned),
                paid: 0,
              },
            ],
          });
          setName('');
          setPlanned('');
        }}
      >
        <label>
          {w(lang, 'name')}
          <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          {w(lang, 'category')}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TripExpense['category'])}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {w(lang, c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {w(lang, 'planned')} (USD)
          <input
            required
            type="number"
            min="0"
            max="1000000"
            step="0.01"
            value={planned}
            onChange={(e) => setPlanned(e.target.value)}
          />
        </label>
        <button className="button button-red" disabled={items.length >= 200}>
          {w(lang, 'addExpense')}
        </button>
      </form>
      {!items.length ? (
        <p className="budget-empty">{w(lang, 'noExpenses')}</p>
      ) : (
        <div className="expense-list">
          {items.map((item) => (
            <article className="expense-row" key={item.id}>
              <label>
                {w(lang, 'name')}
                <input
                  value={draftNames[item.id] ?? item.name}
                  maxLength={120}
                  onChange={(e) => {
                    setDraftNames((v) => ({ ...v, [item.id]: e.target.value }));
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim()) update(item.id, { name: e.target.value.trim() });
                    setDraftNames((v) => {
                      const next = { ...v };
                      delete next[item.id];
                      return next;
                    });
                  }}
                />
              </label>
              <label>
                {w(lang, 'category')}
                <select
                  value={item.category}
                  onChange={(e) =>
                    update(item.id, { category: e.target.value as TripExpense['category'] })
                  }
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {w(lang, c)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {w(lang, 'planned')} (USD)
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  value={item.planned}
                  onChange={(e) => update(item.id, { planned: amount(e.target.value) })}
                />
              </label>
              <label>
                {w(lang, 'paid')} (USD)
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  value={item.paid}
                  onChange={(e) => update(item.id, { paid: amount(e.target.value) })}
                />
              </label>
              <button
                className="icon-button"
                aria-label={`${w(lang, 'remove')} ${item.name}`}
                onClick={() =>
                  setTrip({ ...trip, expenses: items.filter((e) => e.id !== item.id) })
                }
              >
                ×
              </button>
            </article>
          ))}
        </div>
      )}
      {!!items.length && (
        <div className="expense-category-totals">
          <h3>{w(lang, 'totals')}</h3>
          {EXPENSE_CATEGORIES.filter((c) => items.some((e) => e.category === c)).map((c) => (
            <div key={c}>
              <span>{w(lang, c)}</span>
              <strong>
                {money(
                  items
                    .filter((e) => e.category === c)
                    .reduce((n, e) => n + Math.round(e.planned * 100), 0) / 100,
                )}
              </strong>
            </div>
          ))}
        </div>
      )}
      <p className="fine-print">{w(lang, 'limit')}</p>
    </section>
  );
}
