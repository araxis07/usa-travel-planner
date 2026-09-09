import { translate } from '../lib/i18n';
import { useState } from 'react';
import shapes from '../data/map-paths.json';
import {
  STATES,
  REGION_LABELS,
  local,
  stateName,
  type StateGuide,
  type Language,
  type Region,
} from '../data/travel';
import Icon from './Icon';

export const regionColors: Record<Region, string> = {
  West: '#c99772',
  Southwest: '#d67b69',
  Midwest: '#b7bba0',
  Southeast: '#d9b867',
  Northeast: '#819baa',
};
export function StateShape({ state, className = '' }: { state: StateGuide; className?: string }) {
  const shape = shapes.find((item) => item.name === state.name);
  if (!shape) return null;
  const [x, y, width, height] = shape.bounds;
  return (
    <svg
      className={`state-shape ${className}`}
      viewBox={`${x - 8} ${y - 8} ${width + 16} ${height + 16}`}
      aria-hidden="true"
    >
      <path d={shape.path} fill="currentColor" />
    </svg>
  );
}

export default function Atlas({
  lang,
  onSelect,
  motion,
}: {
  lang: Language;
  onSelect: (state: StateGuide) => void;
  motion: boolean;
}) {
  const [region, setRegion] = useState<Region | 'All'>('All');
  const [active, setActive] = useState('CA');
  const [dimension, setDimension] = useState(true);
  const selected = STATES.find((state) => state.code === active)!;
  const t = (en: string, th: string, values?: Record<string, string | number>) =>
    translate(en, th, lang, values);
  const regions = Object.keys(REGION_LABELS) as Region[];
  return (
    <section id="map" className="atlas-section section-anchor">
      <div className="section-shell atlas-layout">
        <div className="atlas-copy">
          <span className="eyebrow">
            <span className="red-dot" />
            {t('A LITTLE CURIOSITY GOES A LONG WAY', 'เริ่มต้นด้วยความอยากรู้อีกนิด')}
          </span>
          <h2>
            {t('One country.', 'หนึ่งประเทศ')}
            <br />
            <em>{t('A world to discover.', 'หลากโลกให้ค้นพบ')}</em>
          </h2>
          <p>
            {t(
              'Mountains or main streets? Ocean air or desert skies? There’s a corner of America that feels like you. Find it on the map.',
              'จะภูเขาหรือถนนในเมือง ลมทะเลหรือท้องฟ้าทะเลทราย อเมริกามีมุมที่เข้ากับคุณ ลองค้นหาบนแผนที่',
            )}
          </p>
          <div className="region-buttons" aria-label={t('Map region', 'ภูมิภาคบนแผนที่')}>
            <button
              className={region === 'All' ? 'active' : ''}
              aria-pressed={region === 'All'}
              onClick={() => setRegion('All')}
            >
              {t('All of America', 'ทุกภูมิภาค')}
              <span>50</span>
            </button>
            {regions.map((item) => (
              <button
                key={item}
                className={region === item ? 'active' : ''}
                aria-pressed={region === item}
                onClick={() => {
                  setRegion(item);
                  setActive(STATES.find((state) => state.region === item)!.code);
                }}
              >
                <span className="region-dot" style={{ background: regionColors[item] }} />
                {local(REGION_LABELS[item], lang)}
                <span>{STATES.filter((state) => state.region === item).length}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="atlas-display">
          <div className="atlas-toolbar">
            <span>
              <Icon name="compass" size={15} />
              {t('YOUR NEXT CHAPTER STARTS HERE', 'บทต่อไปของคุณเริ่มที่นี่')}
            </span>
            <button
              className={dimension ? 'dimension active' : 'dimension'}
              onClick={() => setDimension((value) => !value)}
              aria-pressed={dimension}
            >
              {dimension ? '3D' : '2D'}
              <Icon name="map" size={15} />
            </button>
          </div>
          <div className={`map-perspective ${dimension ? 'is-3d' : ''} ${motion ? '' : 'still'}`}>
            <svg
              className="usa-map"
              viewBox="-40 -40 1055 720"
              aria-label={t(
                'Interactive map of all 50 United States',
                'แผนที่แบบโต้ตอบของ 50 รัฐในอเมริกา',
              )}
            >
              <g className="map-depth" aria-hidden="true">
                {shapes.map((shape) => (
                  <path key={shape.name} d={shape.path} />
                ))}
              </g>
              {shapes.map((shape) => {
                const state = STATES.find((item) => item.name === shape.name)!;
                const dimmed = region !== 'All' && state.region !== region;
                return (
                  <path
                    key={shape.name}
                    d={shape.path}
                    role="button"
                    tabIndex={0}
                    aria-label={stateName(state, lang)}
                    aria-pressed={active === state.code}
                    className={`map-state ${active === state.code ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}`}
                    style={{ fill: regionColors[state.region] }}
                    onMouseEnter={() => setActive(state.code)}
                    onFocus={() => setActive(state.code)}
                    onClick={() => onSelect(state)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelect(state);
                      }
                    }}
                  >
                    <title>{stateName(state, lang)}</title>
                  </path>
                );
              })}
              <text x="170" y="570" className="map-inset-label">
                AK
              </text>
              <text x="360" y="575" className="map-inset-label">
                HI
              </text>
              <text x="75" y="300" className="map-ocean" transform="rotate(-70 75 300)">
                PACIFIC OCEAN
              </text>
              <text x="840" y="410" className="map-ocean" transform="rotate(-55 840 410)">
                ATLANTIC OCEAN
              </text>
            </svg>
          </div>
          <div className="map-preview" aria-live="polite">
            <span className="map-state-code" style={{ background: regionColors[selected.region] }}>
              {selected.code}
            </span>
            <div>
              <span>{local(REGION_LABELS[selected.region], lang)}</span>
              <strong>{stateName(selected, lang)}</strong>
            </div>
            <button onClick={() => onSelect(selected)} className="map-preview-button">
              {t('Explore state', 'สำรวจรัฐ')}
              <Icon name="arrow" size={18} />
            </button>
          </div>
          <label className="map-select">
            <span>{t('Jump to a state', 'เลือกรัฐโดยตรง')}</span>
            <select
              value={active}
              onChange={(event) => {
                setActive(event.target.value);
                setRegion('All');
              }}
            >
              {[...STATES]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((state) => (
                  <option key={state.code} value={state.code}>
                    {stateName(state, lang)}
                  </option>
                ))}
            </select>
          </label>
          <span className="map-note">
            {t(
              'Select a state to explore · Alaska & Hawaii shown as insets',
              'เลือกรัฐเพื่อดูข้อมูล · อะแลสกาและฮาวายแสดงในกรอบย่อ',
            )}
          </span>
        </div>
      </div>
    </section>
  );
}
