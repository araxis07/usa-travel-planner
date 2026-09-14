import { STATES, stateName, type Trip, type Language } from '../data/travel';
import { translate, LOCALES } from '../lib/i18n';
import { activityName, sortedActivities } from '../lib/destinations';
import { tripDays } from '../lib/storage';
import { x } from '../data/experience-copy';
import { dayTimeline, clockLabel } from '../lib/timeline';
import { checklistItems, checklistLabel } from './TripChecklist';
import { budgetTotals } from '../lib/budget';
import { w } from '../data/workspace-copy';
export default function TripPrint({
  trip,
  lang,
  screen = false,
}: {
  trip: Trip;
  lang: Language;
  screen?: boolean;
}) {
  const t = (en: string, th: string) => translate(en, th, lang);
  let offset = 0;
  return (
    <article
      className={screen ? 'shared-itinerary' : 'print-itinerary'}
      aria-label={t('Complete itinerary', 'แผนเที่ยวทั้งหมด')}
    >
      <span className="eyebrow">ROAM AMERICA</span>
      <h1>{trip.name || t('My American adventure', 'ทริปอเมริกาของฉัน')}</h1>
      <p>
        {tripDays(trip)} {t('days', 'วัน')} · {trip.travelers} {t('travelers', 'คน')}{' '}
        {trip.startDate && `· ${trip.startDate}`}
      </p>
      <p>
        {t('Planning estimate', 'งบประมาณเบื้องต้น')}:{' '}
        {new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'USD' }).format(
          budgetTotals(trip).estimate,
        )}
      </p>
      {trip.stops.map((stop) => {
        const start = offset;
        offset += stop.days;
        const state = STATES.find((s) => s.code === stop.code)!;
        return (
          <section key={stop.code} className="print-state">
            <h2>
              {stateName(state, lang)} · {t('Day', 'วันที่')} {start + 1}–{offset}
            </h2>
            {stop.notes && <p className="preserve-lines">{stop.notes}</p>}
            {Array.from({ length: stop.days }, (_, i) => {
              const date = trip.startDate ? new Date(`${trip.startDate}T12:00:00`) : null;
              date?.setDate(date.getDate() + start + i);
              const activities = sortedActivities(
                (stop.activities ?? []).filter((a) => a.day === i + 1),
              );
              return (
                <section key={i} className="print-day">
                  <h3>
                    {t('Day', 'วันที่')} {start + i + 1}{' '}
                    {date &&
                      `· ${new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'medium' }).format(date)}`}
                  </h3>
                  {!activities.length && (
                    <p>{t('Leave some room for discovery.', 'เว้นที่ว่างให้การค้นพบใหม่ ๆ')}</p>
                  )}
                  <ol>
                    {dayTimeline(activities).map(({ activity: a, start, end }) => (
                      <li key={a.id}>
                        <strong>
                          {a.period === 'morning'
                            ? t('Morning', 'เช้า')
                            : a.period === 'afternoon'
                              ? t('Afternoon', 'บ่าย')
                              : t('Evening', 'เย็น')}{' '}
                          · {activityName(a, lang)} · {clockLabel(start)}–{clockLabel(end)}
                        </strong>
                        <span>
                          {' '}
                          · {a.minutes} {t('minutes', 'นาที')}
                        </span>
                        {a.notes && <p className="preserve-lines">{a.notes}</p>}
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </section>
        );
      })}
      {!!trip.expenses?.length && (
        <section className="print-budget">
          <h2>{w(lang, 'budget')} · USD</h2>
          <table>
            <thead>
              <tr>
                <th>{w(lang, 'name')}</th>
                <th>{w(lang, 'category')}</th>
                <th>{w(lang, 'planned')}</th>
                <th>{w(lang, 'paid')}</th>
              </tr>
            </thead>
            <tbody>
              {trip.expenses.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{w(lang, e.category)}</td>
                  <td>{e.planned.toFixed(2)}</td>
                  <td>{e.paid.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            {w(lang, 'totals')}: {budgetTotals(trip).planned.toFixed(2)} · {w(lang, 'paid')}:{' '}
            {budgetTotals(trip).paid.toFixed(2)} · {w(lang, 'unpaid')}:{' '}
            {budgetTotals(trip).remaining.toFixed(2)}
          </p>
        </section>
      )}
      {!!trip.checklist?.length && (
        <section className="print-checklist">
          <h2>{x(lang, 'checklist')}</h2>
          <ul>
            {checklistItems(trip).map((item) => (
              <li key={item.id}>
                {item.done ? '☑' : '☐'} {checklistLabel(item, lang)}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="fine-print">
        {t(
          'Verify travel times, opening hours and reservations before departure. Maps and current alerts need an internet connection.',
          'ตรวจเวลาเดินทาง เวลาเปิด และการจองก่อนออกเดินทาง แผนที่และประกาศล่าสุดต้องเชื่อมต่ออินเทอร์เน็ต',
        )}
      </p>
    </article>
  );
}
