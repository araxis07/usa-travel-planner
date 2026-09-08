import {
  local,
  stateName,
  tourismUrl,
  REGION_LABELS,
  SEASON_LABELS,
  type StateGuide,
  type Language,
} from '../data/travel';
import { StateShape, regionColors } from './Atlas';
import Icon from './Icon';

export default function StateDetail({
  state,
  lang,
  saved,
  inTrip,
  onSave,
  onAdd,
}: {
  state: StateGuide;
  lang: Language;
  saved: boolean;
  inTrip: boolean;
  onSave: () => void;
  onAdd: () => void;
}) {
  const t = (en: string, th: string) => (lang === 'th' ? th : en);
  return (
    <div className="state-detail">
      <div
        className={`detail-cover ${state.image ? '' : 'detail-illustrated'}`}
        style={{ backgroundColor: regionColors[state.region] }}
      >
        {state.image ? (
          <img src={`/images/${state.image}.jpg`} alt={state.name} />
        ) : (
          <StateShape state={state} />
        )}
        <div>
          <span className="eyebrow">
            {local(REGION_LABELS[state.region], lang)} · {state.code}
          </span>
          <h2>{stateName(state, lang)}</h2>
        </div>
      </div>
      <div className="detail-content">
        <p className="detail-description">{local(state.description, lang)}</p>
        <div className="detail-facts">
          <div>
            <Icon name="sun" />
            <span>{t('Good seasons to explore', 'ฤดูกาลน่าเที่ยว')}</span>
            <strong>
              {state.season.map((season) => local(SEASON_LABELS[season], lang)).join(' · ')}
            </strong>
          </div>
          <div>
            <Icon name="calendar" />
            <span>{t('Suggested starting point', 'ระยะเวลาเริ่มต้นที่แนะนำ')}</span>
            <strong>
              {state.days} {t('days', 'วัน')}
            </strong>
          </div>
          <div>
            <Icon name="compass" />
            <span>{t('Gateway airports', 'สนามบินหลัก')}</span>
            <strong>{state.hub}</strong>
          </div>
        </div>
        <h3>{t('Three places to start', 'สามจุดหมายเริ่มต้น')}</h3>
        <div className="places-list">
          {state.places.map((place, i) => (
            <a
              key={place}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, ${state.name}, USA`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="place-number">0{i + 1}</span>
              <span>{place}</span>
              <Icon name="external" size={16} />
            </a>
          ))}
        </div>
        <div className="detail-extra">
          <div>
            <span className="eyebrow">{t('A TASTE OF THE STATE', 'รสชาติประจำรัฐ')}</span>
            <p>{local(state.food, lang)}</p>
          </div>
          <div>
            <span className="eyebrow">{t('GOOD TO KNOW', 'รู้ไว้ก่อนเดินทาง')}</span>
            <p>{local(state.tip, lang)}</p>
          </div>
        </div>
        <a
          href={tourismUrl(state)}
          target="_blank"
          rel="noreferrer"
          className="text-link source-link"
        >
          {t('Official state guide on Visit The USA', 'คู่มือรัฐจาก Visit The USA')}
          <Icon name="external" size={14} />
        </a>
        <p className="fine-print">
          {t(
            'Season and duration are editorial suggestions. Check current opening times, weather, reservations, and access with the destination before traveling.',
            'ฤดูกาลและจำนวนวันเป็นข้อเสนอแนะเบื้องต้น ควรตรวจเวลาเปิด อากาศ การจอง และการเข้าถึงกับสถานที่ก่อนเดินทาง',
          )}
        </p>
        <div className="detail-actions">
          <button className="button button-red" onClick={onAdd}>
            <Icon name={inTrip ? 'check' : 'plus'} size={18} />
            {inTrip
              ? t('In your trip · View plan', 'อยู่ในทริปแล้ว · ดูแผน')
              : t('Add to my trip', 'เพิ่มในทริปของฉัน')}
          </button>
          <button
            className={`button button-outline ${saved ? 'is-saved' : ''}`}
            onClick={onSave}
            aria-pressed={saved}
          >
            <Icon name="heart" size={18} />
            {saved ? t('Saved', 'บันทึกแล้ว') : t('Save for later', 'เก็บไว้ก่อน')}
          </button>
        </div>
      </div>
    </div>
  );
}
