import { local, stateName, REGION_LABELS, type StateGuide, type Language } from '../data/travel';
import { StateShape, regionColors } from './Atlas';
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
  return (
    <article className="state-card">
      <div
        className={`state-card-visual ${state.image ? '' : 'illustrated-state'}`}
        style={{ '--state-color': regionColors[state.region] } as React.CSSProperties}
      >
        <button
          className="card-image-button"
          onClick={onSelect}
          aria-label={`${lang === 'th' ? 'สำรวจ' : 'Explore'} ${name}`}
        >
          {state.image ? (
            <img
              src={`/images/${state.image}.jpg`}
              alt={
                state.name === 'California'
                  ? 'Golden Gate Bridge, San Francisco'
                  : state.name === 'New York'
                    ? 'New York City skyline'
                    : state.name === 'Arizona'
                      ? 'Horseshoe Bend near Page, Arizona'
                      : 'Hawaiian coast'
              }
              loading="lazy"
              width="600"
              height="700"
            />
          ) : (
            <>
              <span className="state-illustration-grid" />
              <StateShape state={state} />
              <span className="state-illustration-code">{state.code}</span>
              <span className="state-illustration-caption">THE AMERICAN ATLAS</span>
            </>
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
          aria-label={`${saved ? (lang === 'th' ? 'เลิกบันทึก' : 'Unsave') : lang === 'th' ? 'บันทึก' : 'Save'} ${name}`}
          onClick={onSave}
        >
          <Icon name="heart" size={19} />
        </button>
      </div>
      <p>{local(state.description, lang)}</p>
      <div className="state-card-bottom">
        <span>
          <Icon name="clock" size={14} />
          {state.days} {lang === 'th' ? 'วันแนะนำ' : 'days to explore'}
        </span>
        <button
          onClick={onSelect}
          aria-label={`${lang === 'th' ? 'ดูรายละเอียด' : 'View guide for'} ${name}`}
        >
          <Icon name="arrow" size={19} />
        </button>
      </div>
    </article>
  );
}
