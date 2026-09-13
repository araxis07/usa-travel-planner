import { useState } from 'react';
import Dialog from './Dialog';
import {
  local,
  type DayPeriod,
  type Language,
  type StateGuide,
  type TripActivity,
} from '../data/travel';
import { translate } from '../lib/i18n';
import { PERIODS, placeId } from '../lib/destinations';

export default function AddPlaceDialog({
  state,
  index,
  days,
  lang,
  onClose,
  onAdd,
}: {
  state: StateGuide;
  index: number;
  days: number;
  lang: Language;
  onClose: () => void;
  onAdd: (activity: TripActivity) => void;
}) {
  const [day, setDay] = useState(1);
  const [period, setPeriod] = useState<DayPeriod>('morning');
  const [minutes, setMinutes] = useState(state.destinations?.[index]?.visitMinutes ?? 120);
  const t = (en: string, th: string) => translate(en, th, lang);
  return (
    <Dialog
      closeLabel={t('Close', 'ปิด')}
      onClose={onClose}
      title={t('Add to daily plan', 'เพิ่มในแผนรายวัน')}
    >
      <div className="add-place-sheet">
        <span className="eyebrow">{t('MAKE TIME FOR IT', 'จัดเวลาให้จุดหมายนี้')}</span>
        <h2>{local(state.placeNames[index], lang)}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAdd({
              id: crypto.randomUUID(),
              day,
              period,
              minutes,
              placeId: placeId(state, index),
              title: state.places[index],
              notes: '',
            });
          }}
        >
          <label>
            {t('Day in this state', 'วันที่ในรัฐนี้')}
            <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {Array.from({ length: days }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Time of day', 'ช่วงเวลา')}
            <select value={period} onChange={(e) => setPeriod(e.target.value as DayPeriod)}>
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p === 'morning'
                    ? t('Morning', 'เช้า')
                    : p === 'afternoon'
                      ? t('Afternoon', 'บ่าย')
                      : t('Evening', 'เย็น')}
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
              required
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>
          <button className="button button-red" type="submit">
            {t('Add activity', 'เพิ่มกิจกรรม')}
          </button>
        </form>
      </div>
    </Dialog>
  );
}
