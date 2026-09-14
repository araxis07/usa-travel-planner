import { useState } from 'react';
import {
  STATES,
  local,
  stateName,
  statePhoto,
  SEASON_LABELS,
  INTEREST_LABELS,
  type StateGuide,
  type Language,
} from '../data/travel';
import { translate } from '../lib/i18n';
import { findPlace } from '../lib/destinations';
import Dialog from './Dialog';
import { x } from '../data/experience-copy';
export const validComparison = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= 3 &&
  new Set(value).size === value.length &&
  value.every(
    (id) => typeof id === 'string' && (STATES.some((s) => s.code === id) || !!findPlace(id)),
  );
export default function CompareDestinations({
  selected,
  onChange,
  lang,
  onClose,
  onOpen,
  onAdd,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  lang: Language;
  onClose: () => void;
  onOpen: (state: StateGuide, index?: number) => void;
  onAdd: (state: StateGuide, index?: number) => void;
}) {
  const [search, setSearch] = useState('');
  const t = (en: string, th: string) => translate(en, th, lang);
  const options = STATES.flatMap((state) => [
    {
      id: state.code,
      name: stateName(state, lang),
      search: state.names.join(' '),
      state,
      index: undefined as number | undefined,
    },
    ...state.placeNames.map((names, index) => ({
      id: `${state.code}-${index}`,
      name: local(names, lang),
      search: names.join(' '),
      state,
      index,
    })),
  ]);
  const columns = selected.flatMap((id) => {
    const option = options.find((o) => o.id === id);
    return option ? [option] : [];
  });
  return (
    <Dialog
      title={t('Compare destinations', 'เปรียบเทียบจุดหมาย')}
      closeLabel={t('Close', 'ปิด')}
      wide
      onClose={onClose}
    >
      <section className="compare-panel">
        <span className="eyebrow">{t('FIND YOUR FIT', 'เลือกจุดหมายที่ใช่')}</span>
        <h2>{t('Compare destinations', 'เปรียบเทียบจุดหมาย')}</h2>
        <p>
          {t(
            'Choose up to 3 states or places to compare side by side.',
            'เลือกรัฐหรือสถานที่ได้สูงสุด 3 แห่งเพื่อเทียบกัน',
          )}
        </p>
        <label className="compare-search">
          {t('Search places', 'ค้นหาสถานที่')}
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className="compare-search">
          {t('Add a destination to compare', 'เพิ่มจุดหมายเพื่อเปรียบเทียบ')}
          <select
            value=""
            disabled={selected.length === 3}
            onChange={(e) => {
              if (e.target.value) onChange([...selected, e.target.value]);
            }}
          >
            <option value="">{t('Choose a destination', 'เลือกจุดหมาย')}</option>
            {options
              .filter(
                (o) =>
                  !selected.includes(o.id) &&
                  o.search.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()),
              )
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.index === undefined ? '' : ` · ${stateName(o.state, lang)}`}
                </option>
              ))}
          </select>
        </label>
        {!!columns.length && (
          <div
            className="comparison-scroll"
            tabIndex={0}
            role="region"
            aria-label={t('Destination comparison', 'ตารางเปรียบเทียบจุดหมาย')}
          >
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col">{t('Destination', 'จุดหมาย')}</th>
                  {columns.map((c) => (
                    <th scope="col" key={c.id}>
                      <img
                        src={
                          (c.index === undefined
                            ? statePhoto(c.state)
                            : c.state.photos.find((p) => p.placeIndex === c.index))!.src
                        }
                        alt=""
                      />
                      <strong>{c.name}</strong>
                      <button
                        className="text-link"
                        onClick={() => onChange(selected.filter((id) => id !== c.id))}
                      >
                        {t('Remove', 'ลบ')} {c.name}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['transport', 'walking', 'setting'] as const).map((field) => (
                  <tr key={field}>
                    <th scope="row">{x(lang, field === 'setting' ? 'interest' : field)}</th>
                    {columns.map((c) => (
                      <td key={c.id}>
                        {c.index === undefined
                          ? '—'
                          : c.state.destinations[c.index].planning
                            ? x(lang, c.state.destinations[c.index].planning![field])
                            : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">{t('State travel styles', 'สไตล์การเที่ยวในรัฐ')}</th>
                  {columns.map((c) => (
                    <td key={c.id}>
                      {c.state.interests.map((i) => local(INTEREST_LABELS[i], lang)).join(' · ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t('State travel seasons', 'ฤดูกาลน่าเที่ยวในรัฐ')}</th>
                  {columns.map((c) => (
                    <td key={c.id}>
                      {c.state.season.map((s) => local(SEASON_LABELS[s], lang)).join(' · ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t('Suggested time', 'เวลาแนะนำ')}</th>
                  {columns.map((c) => (
                    <td key={c.id}>
                      {c.index === undefined
                        ? `${c.state.days} ${t('days in this state', 'วันในรัฐนี้')}`
                        : `${c.state.destinations[c.index].visitMinutes} ${t('minutes', 'นาที')}`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t('State gateway airports', 'สนามบินหลักของรัฐ')}</th>
                  {columns.map((c) => (
                    <td key={c.id}>{c.state.hub}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t('What to expect', 'สิ่งที่จะได้พบ')}</th>
                  {columns.map((c) => (
                    <td key={c.id}>
                      {local(
                        c.index === undefined
                          ? c.state.description
                          : c.state.destinations[c.index].summary,
                        lang,
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t('Next step', 'ขั้นตอนถัดไป')}</th>
                  {columns.map((c) => (
                    <td key={c.id}>
                      <button
                        className="button button-navy"
                        onClick={() => {
                          onClose();
                          onAdd(c.state, c.index);
                        }}
                      >
                        {t('Add to my trip', 'เพิ่มในทริปของฉัน')}
                      </button>
                      <button
                        className="text-link"
                        onClick={() => {
                          onClose();
                          onOpen(c.state, c.index);
                        }}
                      >
                        {t('Open full guide', 'เปิดคู่มือเต็มหน้า')}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="fine-print">
          {t(
            'Suggested times and seasons are starting points. Actual conditions and costs depend on your route and travel dates.',
            'เวลาและฤดูกาลเป็นแนวทางเบื้องต้น สภาพพื้นที่และค่าใช้จ่ายขึ้นอยู่กับเส้นทางและวันเดินทาง',
          )}
        </p>
      </section>
    </Dialog>
  );
}
