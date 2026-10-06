import content from '../content/city-guides.json' with { type: 'json' };
import { languageIndex, LOCALES, translate, type Language } from '../lib/i18n';
import { useMemo, useState } from 'react';
import { starterTrip } from '../data/itineraries';
import { x } from '../data/experience-copy';
import type { Trip, TripActivity } from '../data/travel';

export const cityCopy = content.copy;
export const findCityGuide = (id?: string) => content.guides.find((guide) => guide.placeId === id);
type City = NonNullable<ReturnType<typeof findCityGuide>>;

export function cityGuideTrip(guide: City, days: number, lang: Language): Trip {
  if (guide.placeId !== 'PA-0' || !Number.isInteger(days) || days < 1 || days > 3)
    throw new Error('Invalid city plan');
  const l = languageIndex(lang);
  const trip = starterTrip(guide.placeId, days, lang);
  trip.name = x(lang, 'cityPlanName', { city: trip.name, days });
  const stop = trip.stops[0];
  stop.notes = x(lang, 'cityPlanNote');
  stop.activities = Array.from({ length: days }, (_, i) => {
    const [visit, meal, rest] = stop.activities!.filter((a) => a.day === i + 1);
    visit.title = guide.days[i].title[l];
    visit.minutes = 180;
    visit.notes = `${guide.days[i].text[l]}\n${cityCopy.alternative[l]}: ${guide.days[i].alternative[l]}`;
    // ponytail: neighborhood visits stay unmapped until individual entrances are source-checked.
    delete visit.placeId;
    meal.title = guide.food.stops[i].title[l];
    meal.notes = guide.food.stops[i].text[l];
    const activities: TripActivity[] = [
      {
        id: crypto.randomUUID(),
        day: i + 1,
        period: 'morning' as const,
        title: x(lang, 'cityRoute'),
        minutes: 30,
        bufferMinutes: 15,
        notes: x(lang, 'cityTransferNote'),
      },
      visit,
      meal,
      rest,
    ];
    activities.forEach((activity) => delete activity.startTime);
    return activities;
  }).flat();
  return trip;
}

export default function CityGuide({
  guide,
  lang,
  onCreateTrip,
}: {
  guide: City;
  lang: Language;
  onCreateTrip: (trip: Trip) => void;
}) {
  const l = languageIndex(lang);
  const [days, setDays] = useState(3);
  const plan = useMemo(
    () => (guide.placeId === 'PA-0' ? cityGuideTrip(guide, days, lang) : null),
    [guide, days, lang],
  );
  const food = 'food' in guide ? guide.food : undefined;
  const money = (amount: number) =>
    new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'USD' }).format(amount);
  const map = (query: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return (
    <section className="city-guide" id="guide-city" aria-labelledby="city-guide-title">
      <h2 id="city-guide-title">{cityCopy.title[l]}</h2>
      <p>{guide.intro[l]}</p>
      {plan && (
        <details className="guide-details city-plan-preview">
          <summary>{x(lang, 'cityPlan')}</summary>
          <div className="city-plan-duration">
            <label htmlFor="city-plan-days">{x(lang, 'cityPlanDays')}</label>
            <select
              id="city-plan-days"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              {[1, 2, 3].map((day) => (
                <option key={day} value={day}>
                  {x(lang, 'cityPlanDuration', { days: day })}
                </option>
              ))}
            </select>
          </div>
          <p>{x(lang, 'cityPlanNote')}</p>
          {Array.from({ length: days }, (_, i) => (
            <div className="template-day" key={i}>
              <strong>{cityCopy.day[l].replace('{day}', String(i + 1))}</strong>
              <ul>
                {plan.stops[0]
                  .activities!.filter((a) => a.day === i + 1)
                  .map((a) => (
                    <li key={a.id}>
                      {a.title} · {a.minutes} {translate('minutes', 'นาที', lang)}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <button className="button button-navy" onClick={() => onCreateTrip(plan)}>
            {x(lang, 'usePlan')}
          </button>
        </details>
      )}
      <h3>{cityCopy.areas[l]}</h3>
      {guide.areas.map((area) => (
        <details className="guide-details" key={area.mapQuery}>
          <summary>{area.title[l]}</summary>
          <p>{area.text[l]}</p>
          <div className="city-guide-links">
            <a href={map(area.mapQuery)} target="_blank" rel="noreferrer">
              {cityCopy.map[l]} · {area.title[l]}
            </a>
            <a href={area.source.url} target="_blank" rel="noreferrer">
              {area.source.name}
            </a>
          </div>
        </details>
      ))}
      <h3>{cityCopy.days[l]}</h3>
      <p>{cityCopy.pace[l]}</p>
      {guide.days.map((day, index) => (
        <details className="guide-details city-day" key={index} open={index === 0}>
          <summary>
            {cityCopy.day[l].replace('{day}', String(index + 1))} · {day.title[l]}
          </summary>
          <p>{day.text[l]}</p>
          <p>
            <strong>{cityCopy.alternative[l]}: </strong>
            {day.alternative[l]}
          </p>
          {'source' in day && (
            <div className="city-guide-links">
              <a href={day.source.url} target="_blank" rel="noreferrer">
                {day.source.name}
              </a>
            </div>
          )}
        </details>
      ))}
      <section id="guide-airport" aria-labelledby="city-airport-title">
        <h3 id="city-airport-title">
          {cityCopy.airport[l]} · {guide.airport.code}
        </h3>
        <ol className="city-airport-steps">
          {guide.airport.steps.map((step, index) => (
            <li key={index}>{step[l]}</li>
          ))}
        </ol>
        <p>
          <strong>{cityCopy.fares[l]}: </strong>
          {guide.airport.fare[l]}
        </p>
        <p>{guide.airport.note[l]}</p>
        <div className="city-guide-links">
          {guide.airport.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.name}
            </a>
          ))}
        </div>
        <p className="content-date">
          {cityCopy.checked[l]} · <time dateTime={guide.checkedAt}>{guide.checkedAt}</time>
          {' · '}
          {cityCopy.review[l]} · <time dateTime={guide.reviewAfter}>{guide.reviewAfter}</time>
        </p>
        {Date.now() >= Date.parse(guide.reviewAfter + 'T00:00:00Z') && (
          <p className="day-warning">{cityCopy.stale[l]}</p>
        )}
      </section>
      <section id="guide-city-budget" aria-labelledby="city-budget-title">
        <h3 id="city-budget-title">{cityCopy.budget[l]}</h3>
        <p>{cityCopy.assumptions[l]}</p>
        {cityCopy.tiers.map((tier, index) => {
          const total = guide.budget.amounts.reduce((sum, row) => sum + row[index], 0);
          return (
            <details className="guide-details city-budget" key={tier[0]}>
              <summary>
                {tier[l]} · {money(total)}
              </summary>
              <dl>
                {cityCopy.rows.map((label, row) => (
                  <div key={label[0]}>
                    <dt>{label[l]}</dt>
                    <dd>{money(guide.budget.amounts[row][index])}</dd>
                  </div>
                ))}
                <div className="city-budget-total">
                  <dt>{cityCopy.total[l]}</dt>
                  <dd>{money(total)}</dd>
                </div>
                <div>
                  <dt>{cityCopy.perPerson[l]}</dt>
                  <dd>{money(total / 2)}</dd>
                </div>
              </dl>
            </details>
          );
        })}
        <p>{guide.budget.note[l]}</p>
      </section>
      {food && (
        <section id="guide-food" aria-labelledby="city-food-title">
          <h3 id="city-food-title">{cityCopy.food[l]}</h3>
          <p>{food.intro[l]}</p>
          <p>{cityCopy.foodAssumptions[l]}</p>
          <p>
            <strong>{cityCopy.vegetarian[l]}: </strong>
            {food.vegetarian[l]}
          </p>
          {food.stops.map((stop, index) => (
            <details className="guide-details city-food-stop" key={stop.day} open={index === 0}>
              <summary>
                {cityCopy.day[l].replace('{day}', String(stop.day))} · {stop.title[l]}
              </summary>
              <p>{stop.text[l]}</p>
              <p className="city-meal-allowance">
                <strong>{cityCopy.mealAllowance[l]}: </strong>
                {money(stop.allowance[0])}–{money(stop.allowance[1])}
              </p>
              <div className="city-guide-links">
                <a href={map(stop.mapQuery)} target="_blank" rel="noreferrer">
                  {cityCopy.map[l]} · {stop.title[l]}
                </a>
                <a href={stop.source.url} target="_blank" rel="noreferrer">
                  {stop.source.name}
                </a>
              </div>
            </details>
          ))}
          <p className="content-date">
            {cityCopy.checked[l]} · <time dateTime={food.checkedAt}>{food.checkedAt}</time>
            {' · '}
            {cityCopy.review[l]} · <time dateTime={food.reviewAfter}>{food.reviewAfter}</time>
          </p>
          {Date.now() >= Date.parse(food.reviewAfter + 'T00:00:00Z') && (
            <p className="day-warning">{cityCopy.foodStale[l]}</p>
          )}
        </section>
      )}
    </section>
  );
}
