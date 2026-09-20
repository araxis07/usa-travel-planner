import TravelImage from './TravelImage';
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
import { destinationUrl } from '../lib/destinations';

export default function StateCard({
  state,
  lang,
  saved,
  onSave,
  onSelect,
  onOpen,
}: {
  state: StateGuide;
  lang: Language;
  saved: boolean;
  onSave: () => void;
  onSelect: () => void;
  onOpen?: () => void;
}) {
  const name = stateName(state, lang);
  const t = (en: string, th: string) => translate(en, th, lang);
  const photo = statePhoto(state);
  return (
    <article className="state-card">
      <div className="state-card-visual">
        <a
          className="card-image-button card-full-guide"
          href={destinationUrl(state, lang)}
          onClick={(event) => {
            if (
              onOpen &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.shiftKey &&
              !event.altKey &&
              event.button === 0
            ) {
              event.preventDefault();
              onOpen();
            }
          }}
          aria-label={`${t('Open full guide', 'เปิดคู่มือเต็มหน้า')} ${name}`}
        >
          {photo && (
            <TravelImage
              src={photo.src}
              alt={local(state.placeNames[photo.placeIndex], lang)}
              loading="lazy"
              sizes="(max-width: 1100px) calc((100vw - 64px) / 2), 25vw"
              width="600"
              height="700"
            />
          )}
          <span className="card-region">{local(REGION_LABELS[state.region], lang)}</span>
          <div className="card-over-image">
            <span>{state.code} / USA</span>
            <h3>{name}</h3>
          </div>
        </a>
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
        <button
          className="card-quick-view"
          onClick={onSelect}
          aria-label={`${t('Quick view', 'ดูตัวอย่าง')} ${name}`}
        >
          {t('Quick view', 'ดูตัวอย่าง')}
          <Icon name="plus" size={16} />
        </button>
      </div>
    </article>
  );
}
