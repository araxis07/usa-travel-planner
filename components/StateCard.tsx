import {
  local,
  stateName,
  statePhoto,
  REGION_LABELS,
  type StateGuide,
  type Language,
} from '../data/travel';
import { translate } from '../lib/i18n';
import Icon from './Icon';

export default function StateCard({
  state,
  lang,
  saved,
  onSave,
  onSelect,
}: {
  state: StateGuide;
  lang: Language;
  saved: boolean;
  onSave: () => void;
  onSelect: () => void;
}) {
  const name = stateName(state, lang);
  const t = (en: string, th: string) => translate(en, th, lang);
  const photo = statePhoto(state);
  return (
    <article className="state-card">
      <div className="state-card-visual">
        <button
          className="card-image-button"
          onClick={onSelect}
          aria-label={`${t('Explore', 'สำรวจ')} ${name}`}
        >
          {photo && (
            <img
              src={photo.src}
              alt={local(state.placeNames[photo.placeIndex], lang)}
              loading="lazy"
              width="600"
              height="700"
            />
          )}
          <span className="card-region">{local(REGION_LABELS[state.region], lang)}</span>
          <div className="card-over-image">
            <span>{state.code} / USA</span>
            <h3>{name}</h3>
          </div>
        </button>
        <button
          className={`save-button ${saved ? 'saved' : ''}`}
          aria-pressed={saved}
          aria-label={`${saved ? t('Unsave', 'เลิกบันทึก') : t('Save', 'บันทึก')} ${name}`}
          onClick={onSave}
        >
          <Icon name="heart" size={19} />
        </button>
      </div>
      <p>{local(state.description, lang)}</p>
      <div className="state-card-bottom">
        <span>
          <Icon name="clock" size={14} />
          {state.days} {t('days to explore', 'วันแนะนำ')}
        </span>
        <button onClick={onSelect} aria-label={`${t('View guide for', 'ดูรายละเอียด')} ${name}`}>
          <Icon name="arrow" size={19} />
        </button>
      </div>
    </article>
  );
}
