import { useState } from 'react';
import {
  STATES,
  local,
  stateName,
  type Language,
  type Trip,
  type TripActivity,
  type DayPeriod,
} from '../data/travel';
import { translate, LOCALES } from '../lib/i18n';
import { activityName, findPlace, PERIODS, placeId, sortedActivities } from '../lib/destinations';
import RouteMap from './RouteMap';
import Icon from './Icon';

export default function DailyPlanner({
  trip,
  setTrip,
  lang,
  initialCode,
  notify,
}: {
  trip: Trip;
  setTrip: (trip: Trip) => void;
  lang: Language;
  initialCode?: string;
  notify: (text: string) => void;
}) {
  const [code, setCode] = useState(initialCode ?? trip.stops[0]?.code ?? '');
  const stop = trip.stops.find((s) => s.code === code) ?? trip.stops[0];
  const [selectedDay, setDay] = useState(1);
  const day = Math.min(selectedDay, stop?.days ?? 1);
  const [period, setPeriod] = useState<DayPeriod>('morning');
  const [selection, setSelection] = useState(`${stop?.code ?? 'CA'}-0`);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState(
    () => findPlace(`${stop?.code ?? 'CA'}-0`)?.profile.visitMinutes ?? 120,
  );
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const t = (en: string, th: string) => translate(en, th, lang);
  const periodName = (p: DayPeriod) =>
    p === 'morning'
      ? t('Morning', 'เช้า')
      : p === 'afternoon'
        ? t('Afternoon', 'บ่าย')
        : t('Evening', 'เย็น');
  if (!stop)
    return <p>{t('Add a state to start planning your days.', 'เพิ่มรัฐเพื่อเริ่มวางแผนรายวัน')}</p>;
  const activities = stop.activities ?? [];
  const today = sortedActivities(activities.filter((a) => a.day === day));
  const globalOffset = trip.stops
    .slice(0, trip.stops.indexOf(stop))
    .reduce((total, s) => total + s.days, 0);
  const date = trip.startDate ? new Date(`${trip.startDate}T12:00:00`) : null;
  date?.setDate(date.getDate() + globalOffset + day - 1);
  const update = (items: TripActivity[]) =>
    setTrip({
      ...trip,
      stops: trip.stops.map((s) => (s.code === stop.code ? { ...s, activities: items } : s)),
    });
  const edit = (id: string, fields: Partial<TripActivity>) =>
    update(activities.map((a) => (a.id === id ? { ...a, ...fields } : a)));
  function add() {
    if (trip.stops.reduce((count, s) => count + (s.activities?.length ?? 0), 0) >= 200) {
      notify(
        t('A trip can hold up to 200 activities.', 'หนึ่งทริปเพิ่มกิจกรรมได้สูงสุด 200 รายการ'),
      );
      return;
    }
    const p = findPlace(selection);
    if (!p && !title.trim()) return;
    update([
      ...activities,
      {
        id: crypto.randomUUID(),
        day,
        period,
        title: p ? p.state.places[p.index] : title.trim(),
        minutes,
        notes: '',
        ...(p ? { placeId: p.id } : {}),
      },
    ]);
    setTitle('');
    setAdding(false);
    notify(t('Activity added to your day.', 'เพิ่มกิจกรรมในวันนี้แล้ว'));
  }
  function reorder(id: string, beforeId: string) {
    const item = activities.find((a) => a.id === id),
      target = activities.find((a) => a.id === beforeId);
    if (!item || !target || id === beforeId) return;
    const next = activities.filter((a) => a.id !== id);
    next.splice(
      next.findIndex((a) => a.id === beforeId),
      0,
      { ...item, day: target.day, period: target.period },
    );
    update(next);
  }
  function move(id: string, offset: number) {
    const item = activities.find((a) => a.id === id)!;
    const group = today.filter((a) => a.period === item.period);
    const other = group[group.findIndex((a) => a.id === id) + offset];
    if (!other) return;
    const next = [...activities];
    const a = next.findIndex((v) => v.id === id),
      b = next.findIndex((v) => v.id === other.id);
    [next[a], next[b]] = [next[b], next[a]];
    update(next);
  }
  const points = today.flatMap((a) => {
    const p = a.placeId ? findPlace(a.placeId) : undefined;
    return p?.coordinates
      ? [{ id: a.id, name: activityName(a, lang), coordinates: p.coordinates as [number, number] }]
      : [];
  });
  const total = today.reduce((sum, a) => sum + a.minutes, 0);
  const matchingPlaces = (value: string) =>
    STATES.flatMap((s) =>
      s.places.map((_, i) => ({ state: s, index: i, id: placeId(s, i) })),
    ).filter((p) =>
      [...p.state.names, ...p.state.placeNames[p.index]].some((n) =>
        n.toLocaleLowerCase().includes(value.toLocaleLowerCase().trim()),
      ),
    );
  const choose = (id: string) => {
    setSelection(id);
    const place = findPlace(id);
    if (place) setMinutes(place.profile.visitMinutes);
  };
  return (
    <div className="daily-planner">
      <div className="day-planner-heading">
        <div>
          <span className="eyebrow">{t('ONE DAY AT A TIME', 'ค่อย ๆ วางแผนทีละวัน')}</span>
          <h3>{t('A little structure. Room to roam.', 'มีแผนพอดี มีเวลาให้ค้นพบ')}</h3>
        </div>
        <label>
          {t('Planning state', 'รัฐที่กำลังวางแผน')}
          <select
            value={stop.code}
            onChange={(event) => {
              setCode(event.target.value);
              setDay(1);
              setSearch('');
              choose(`${event.target.value}-0`);
            }}
          >
            {trip.stops.map((s) => (
              <option key={s.code} value={s.code}>
                {stateName(
                  STATES.find((v) => v.code === s.code)!,
                  lang,
                )}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="day-strip" role="group" aria-label={t('Choose a day', 'เลือกวัน')}>
        {Array.from({ length: stop.days }, (_, i) => (
          <button key={i} aria-pressed={day === i + 1} onClick={() => setDay(i + 1)}>
            <span>
              {t('Day', 'วันที่')} {globalOffset + i + 1}
            </span>
            <small>
              {activities.filter((a) => a.day === i + 1).length} {t('activities', 'กิจกรรม')}
            </small>
          </button>
        ))}
      </div>
      <div className="day-summary">
        <strong>
          {t('Day', 'วันที่')} {globalOffset + day}
          {date &&
            ` · ${new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'medium' }).format(date)}`}
        </strong>
        <span>
          {total} {t('minutes planned', 'นาทีที่วางแผนไว้')}
        </span>
      </div>
      {total > 720 && (
        <p role="status" className="day-warning">
          {t(
            'A long day: allow more time or move an activity to another day.',
            'วันนี้แน่นมาก ควรเผื่อเวลาเพิ่มหรือย้ายกิจกรรมไปวันอื่น',
          )}
        </p>
      )}
      <button
        className="button button-red add-activity-toggle"
        onClick={() => setAdding((v) => !v)}
        aria-expanded={adding}
      >
        {adding ? t('Close', 'ปิด') : t('Add activity', 'เพิ่มกิจกรรม')}
      </button>
      {adding && (
        <form
          className="add-activity"
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          <label className="activity-destination">
            {t('Search places', 'ค้นหาสถานที่')}
            <input
              type="search"
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                const matches = matchingPlaces(value);
                if (!matches.some((p) => p.id === selection)) choose(matches[0]?.id ?? 'custom');
              }}
              placeholder={t('Search places', 'ค้นหาสถานที่')}
            />
          </label>
          <label className="activity-destination">
            {t('Choose a place or custom activity', 'เลือกสถานที่หรือกิจกรรมที่ตั้งเอง')}
            <select value={selection} onChange={(event) => choose(event.target.value)}>
              <option value="custom">{t('Custom activity', 'กิจกรรมที่ตั้งเอง')}</option>
              {STATES.map((s) => (
                <optgroup key={s.code} label={stateName(s, lang)}>
                  {s.places
                    .map((_, i) => ({
                      i,
                      matches: [...s.names, ...s.placeNames[i]].some((n) =>
                        n.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()),
                      ),
                    }))
                    .filter((v) => v.matches)
                    .map(({ i }) => (
                      <option key={i} value={placeId(s, i)}>
                        {local(s.placeNames[i], lang)}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          {selection === 'custom' && (
            <label className="activity-destination">
              {t('Activity name', 'ชื่อกิจกรรม')}
              <input
                value={title}
                required
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t(
                  'Coffee, a museum, a slow afternoon…',
                  'กาแฟ พิพิธภัณฑ์ หรือพักผ่อนยามบ่าย…',
                )}
              />
            </label>
          )}
          <label>
            {t('Time of day', 'ช่วงเวลา')}
            <select value={period} onChange={(event) => setPeriod(event.target.value as DayPeriod)}>
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {periodName(p)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Duration in minutes', 'ระยะเวลาเป็นนาที')}
            <input
              type="number"
              min={15}
              max={720}
              step={15}
              value={minutes}
              onChange={(event) =>
                setMinutes(
                  Math.max(15, Math.min(720, Math.round(Number(event.target.value) || 15))),
                )
              }
            />
          </label>
          <button className="button button-red" type="submit">
            <Icon name="plus" size={16} />
            {t('Add activity', 'เพิ่มกิจกรรม')}
          </button>
        </form>
      )}
      <p className="fine-print">
        {t(
          'Drag activities to reorder or move between time slots. Arrow buttons and day selectors also work on touch screens and with a keyboard.',
          'ลากกิจกรรมเพื่อเรียงหรือย้ายช่วงเวลา ใช้ปุ่มลูกศรและตัวเลือกวันบนจอสัมผัสหรือคีย์บอร์ดได้เช่นกัน',
        )}
      </p>
      <div className="day-workspace">
        <div className="day-periods">
          {PERIODS.map((p) => (
            <section
              key={p}
              className={`day-period ${dragging ? 'drop-ready' : ''}`}
              onDragOver={(event) => {
                if (dragging) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData('text/roam-activity');
                if (dragging === id) edit(id, { period: p, day });
                setDragging(null);
              }}
              aria-label={periodName(p)}
            >
              <h4>
                <Icon
                  name={p === 'morning' ? 'sun' : p === 'afternoon' ? 'compass' : 'moon'}
                  size={18}
                />
                {periodName(p)}
                <span>{today.filter((a) => a.period === p).length}</span>
              </h4>
              {today.filter((a) => a.period === p).length === 0 && (
                <p className="period-empty">
                  {t('Leave some room for discovery.', 'เว้นที่ว่างให้การค้นพบใหม่ ๆ')}
                </p>
              )}
              {today
                .filter((a) => a.period === p)
                .map((a, index, group) => (
                  <article
                    className={`day-activity ${selectedActivity === a.id ? 'activity-selected' : ''}`}
                    onFocus={() => setSelectedActivity(a.id)}
                    onClick={() => setSelectedActivity(a.id)}
                    key={a.id}
                    data-activity-id={a.id}
                    onDragOver={(event) => {
                      if (dragging) event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const id = event.dataTransfer.getData('text/roam-activity');
                      if (dragging === id) reorder(id, a.id);
                      setDragging(null);
                    }}
                  >
                    <div className="activity-title">
                      <span
                        className="activity-drag"
                        draggable
                        onDragStart={(event) => {
                          setDragging(a.id);
                          event.dataTransfer.setData('text/roam-activity', a.id);
                          event.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => setDragging(null)}
                        aria-hidden="true"
                      >
                        ⠿
                      </span>
                      <h5>{activityName(a, lang)}</h5>
                      <button
                        className="icon-button"
                        aria-label={`${t('Remove activity', 'ลบกิจกรรม')} ${activityName(a, lang)}`}
                        onClick={() => update(activities.filter((item) => item.id !== a.id))}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                    <div className="activity-edit-row">
                      <label>
                        {t('Day in this state', 'วันที่ในรัฐนี้')}
                        <select
                          aria-label={`${t('Day for', 'วันของ')} ${activityName(a, lang)}`}
                          value={a.day}
                          onChange={(event) => edit(a.id, { day: Number(event.target.value) })}
                        >
                          {Array.from({ length: stop.days }, (_, i) => (
                            <option key={i} value={i + 1}>
                              {globalOffset + i + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        {t('Time of day', 'ช่วงเวลา')}
                        <select
                          aria-label={`${t('Time slot for', 'ช่วงเวลาของ')} ${activityName(a, lang)}`}
                          value={a.period}
                          onChange={(event) =>
                            edit(a.id, { period: event.target.value as DayPeriod })
                          }
                        >
                          {PERIODS.map((v) => (
                            <option key={v} value={v}>
                              {periodName(v)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        {t('Minutes', 'นาที')}
                        <input
                          aria-label={`${t('Duration for', 'ระยะเวลาของ')} ${activityName(a, lang)}`}
                          type="number"
                          min={15}
                          max={720}
                          value={a.minutes}
                          onChange={(event) =>
                            edit(a.id, {
                              minutes: Math.max(
                                15,
                                Math.min(720, Math.round(Number(event.target.value) || 15)),
                              ),
                            })
                          }
                        />
                      </label>
                    </div>
                    {!a.placeId && (
                      <label className="activity-note">
                        {t('Activity name', 'ชื่อกิจกรรม')}
                        <input
                          aria-label={`${t('Rename activity', 'เปลี่ยนชื่อกิจกรรม')} ${activityName(a, lang)}`}
                          key={`${a.id}-${a.title}`}
                          defaultValue={a.title}
                          maxLength={120}
                          onBlur={(event) => {
                            const name = event.target.value.trim() || a.title;
                            event.target.value = name;
                            if (name !== a.title) edit(a.id, { title: name });
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') event.currentTarget.blur();
                          }}
                        />
                      </label>
                    )}
                    <label className="activity-note">
                      {t('Personal notes', 'โน้ตส่วนตัว')}
                      <textarea
                        aria-label={`${t('Activity notes for', 'โน้ตกิจกรรมสำหรับ')} ${activityName(a, lang)}`}
                        rows={2}
                        maxLength={500}
                        value={a.notes}
                        onChange={(event) => edit(a.id, { notes: event.target.value })}
                      />
                    </label>
                    <div className="activity-bottom">
                      <span>
                        {a.minutes} {t('minutes', 'นาที')}
                      </span>
                      <div>
                        <button
                          className="icon-button"
                          disabled={index === 0}
                          aria-label={`${t('Move activity up', 'เลื่อนกิจกรรมขึ้น')} ${activityName(a, lang)}`}
                          onClick={() => move(a.id, -1)}
                        >
                          <Icon name="arrow-up" size={15} />
                        </button>
                        <button
                          className="icon-button"
                          disabled={index === group.length - 1}
                          aria-label={`${t('Move activity down', 'เลื่อนกิจกรรมลง')} ${activityName(a, lang)}`}
                          onClick={() => move(a.id, 1)}
                        >
                          <Icon name="arrow-down" size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
            </section>
          ))}
        </div>
        {!!today.length && (
          <aside className="day-map-aside">
            <h3 className="day-route-heading">{t('Connect the dots', 'เชื่อมจุดหมายของวันนี้')}</h3>
            <RouteMap
              points={points}
              lang={lang}
              routing
              activityMinutes={total}
              selectedId={selectedActivity}
              onSelect={(id) => {
                setSelectedActivity(id);
                const element = document.querySelector<HTMLElement>(
                  `[data-activity-id="${CSS.escape(id)}"]`,
                );
                element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                element?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
              }}
            />
            <ol className="day-directions">
              {points.map((point, i) => (
                <li key={point.id}>
                  <span>{point.name}</span>
                  {i > 0 && (
                    <a
                      className="text-link"
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(points[i - 1].coordinates.join(','))}&destination=${encodeURIComponent(point.coordinates.join(','))}&travelmode=driving`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('Directions from previous stop', 'เส้นทางจากจุดก่อนหน้า')}
                      <Icon name="external" size={14} />
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </div>
  );
}
