import { translate } from '../lib/i18n';
import { lazy, Suspense, useState, type CSSProperties } from 'react';
import { x } from '../data/experience-copy';
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
const LandmarkScene = lazy(() => import('./LandmarkScene'));

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
  tripCodes = [],
}: {
  lang: Language;
  onSelect: (state: StateGuide) => void;
  motion: boolean;
  tripCodes?: string[];
}) {
  const [region, setRegion] = useState<Region | 'All'>('All');
  const [active, setActive] = useState('CA');
  const [dimension, setDimension] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(-7);
  const [center, setCenter] = useState([487.5, 320]);
  const focusRegion = (value: Region | 'All') => {
    setRegion(value);
    if (value === 'All') {
      setZoom(1);
      setCenter([487.5, 320]);
      return;
    }
    const members = shapes.filter(
      (shape) => STATES.find((s) => s.name === shape.name)?.region === value,
    );
    const left = Math.min(...members.map((s) => s.bounds[0])),
      top = Math.min(...members.map((s) => s.bounds[1]));
    const right = Math.max(...members.map((s) => s.bounds[0] + s.bounds[2])),
      bottom = Math.max(...members.map((s) => s.bounds[1] + s.bounds[3]));
    setCenter([(left + right) / 2, (top + bottom) / 2]);
    setZoom(
      Math.min(2.8, Math.max(1, Math.min(950 / (right - left + 60), 620 / (bottom - top + 60)))),
    );
  };
  const routePoints = tripCodes.flatMap((code) => {
    const state = STATES.find((s) => s.code === code);
    const shape = shapes.find((s) => s.name === state?.name);
    return shape
      ? [
          {
            code,
            x: shape.bounds[0] + shape.bounds[2] / 2,
            y: shape.bounds[1] + shape.bounds[3] / 2,
          },
        ]
      : [];
  });
  const selected = STATES.find((state) => state.code === active)!;
  const t = (en: string, th: string, values?: Record<string, string | number>) =>
    translate(en, th, lang, values);
  const regions = Object.keys(REGION_LABELS) as Region[];
  return (
    <section className="atlas-section">
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
              onClick={() => focusRegion('All')}
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
                  focusRegion(item);
                  setActive(STATES.find((state) => state.region === item)!.code);
                }}
              >
                <span className="region-dot" style={{ background: regionColors[item] }} />
                {local(REGION_LABELS[item], lang)}
                <span>{STATES.filter((state) => state.region === item).length}</span>
              </button>
            ))}
          </div>
          <Suspense fallback={<div className="landmark-placeholder" aria-hidden="true" />}>
            <LandmarkScene lang={lang} motion={motion} state={selected} />
          </Suspense>
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
          <div className="atlas-navigation" role="group" aria-label={x(lang, 'map')}>
            <button
              className="icon-button"
              aria-label={x(lang, 'zoomIn')}
              disabled={zoom >= 4}
              onClick={() => setZoom(Math.min(4, zoom + 0.5))}
            >
              <Icon name="plus" size={18} />
            </button>
            <button
              className="icon-button"
              aria-label={x(lang, 'zoomOut')}
              disabled={zoom <= 1}
              onClick={() => setZoom(Math.max(1, zoom - 0.5))}
            >
              <Icon name="minus" size={18} />
            </button>
            <button
              className="button button-outline"
              onClick={() => setRotation(rotation === -7 ? 7 : -7)}
              disabled={!dimension}
            >
              {x(lang, 'rotate')}
            </button>
            <button
              className="text-link"
              onClick={() => {
                focusRegion('All');
                setRotation(-7);
              }}
            >
              {x(lang, 'reset')}
            </button>
          </div>
          <div
            className={`map-perspective ${dimension ? 'is-3d' : ''} ${motion ? '' : 'still'}`}
            style={{ '--atlas-rotation': `${rotation}deg` } as CSSProperties}
          >
            <svg
              className="usa-map"
              viewBox={`${center[0] - 527.5 / zoom} ${center[1] - 360 / zoom} ${1055 / zoom} ${720 / zoom}`}
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
                    className={`map-state ${active === state.code ? 'selected' : ''} ${dimmed ? 'dimmed' : ''} ${tripCodes.includes(state.code) ? 'in-trip' : ''}`}
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
              {routePoints.length > 0 && (
                <g className="atlas-trip-route" aria-hidden="true">
                  <polyline points={routePoints.map((p) => `${p.x},${p.y}`).join(' ')} />
                  {routePoints.map((p, i) => (
                    <g key={p.code} transform={`translate(${p.x} ${p.y})`}>
                      <circle r="15" />
                      <text textAnchor="middle" dy="5">
                        {i + 1}
                      </text>
                    </g>
                  ))}
                </g>
              )}
              <text x="170" y="570" className="map-inset-label">
                AK
              </text>
              <text x="360" y="575" className="map-inset-label">
                HI
              </text>
              <text x="75" y="300" className="map-ocean" transform="rotate(-70 75 300)">
                {x(lang, 'pacific')}
              </text>
              <text x="840" y="410" className="map-ocean" transform="rotate(-55 840 410)">
                {x(lang, 'atlantic')}
              </text>
            </svg>
          </div>
          {routePoints.length > 0 && <p className="atlas-route-caption">{x(lang, 'routeLine')}</p>}
          <div className="map-preview" aria-live="polite">
            <img
              className="atlas-preview-photo"
              src={selected.photos[selected.cover].src}
              alt=""
              width="90"
              height="70"
              loading="lazy"
            />
            <span className="map-state-code" style={{ background: regionColors[selected.region] }}>
              {selected.code}
            </span>
            <div>
              <span>{local(REGION_LABELS[selected.region], lang)}</span>
              <strong>{stateName(selected, lang)}</strong>
              <small>{selected.placeNames.map((p) => local(p, lang)).join(' · ')}</small>
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
                const state = STATES.find((s) => s.code === event.target.value)!;
                const shape = shapes.find((s) => s.name === state.name)!;
                setCenter([
                  shape.bounds[0] + shape.bounds[2] / 2,
                  shape.bounds[1] + shape.bounds[3] / 2,
                ]);
                setZoom(2.5);
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
