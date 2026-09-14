import TravelImage from './TravelImage';
import { lazy, Suspense, useEffect, useState } from 'react';
import {
  STATES,
  local,
  stateName,
  type Language,
  type StateGuide,
  type Region,
  type Interest,
  type Season,
} from '../data/travel';
import { x } from '../data/experience-copy';
import { translate } from '../lib/i18n';
import type { PlaceCollections } from '../lib/collections';
import { readLocal } from '../lib/storage';
import Icon from './Icon';
const RouteMap = lazy(() => import('./RouteMap'));
export default function PlaceDiscovery({
  lang,
  query,
  region,
  interest,
  season,
  collections,
  onOpen,
  onAdd,
  onCompare,
}: {
  lang: Language;
  query: string;
  region: Region | 'All';
  interest: Interest | 'All';
  season: Season | 'All';
  collections: PlaceCollections;
  onOpen: (state: StateGuide, index: number) => void;
  onAdd: (state: StateGuide, index: number) => void;
  onCompare: (id: string) => void;
}) {
  const [transport, setTransport] = useState(() =>
    readLocal('roam.place-filter.v1', 'any', (v) =>
      ['any', 'transit', 'car', 'boat'].includes(String(v)) ? String(v) : 'any',
    ),
  );
  const [setting, setSetting] = useState('any');
  const [map, setMap] = useState(false);
  const [limit, setLimit] = useState(9);
  const [selected, setSelected] = useState<string | null>(null);
  const t = (en: string, th: string) => translate(en, th, lang);
  useEffect(() => {
    try {
      localStorage.setItem('roam.place-filter.v1', JSON.stringify(transport));
    } catch {
      /* Optional view preference. */
    }
  }, [transport]);
  useEffect(() => setLimit(9), [query, region, interest, season, transport, setting]);
  const search = query.trim().toLocaleLowerCase();
  const months: Record<Season, number[]> = {
    Spring: [3, 4, 5],
    Summer: [6, 7, 8],
    Fall: [9, 10, 11],
    Winter: [12, 1, 2],
  };
  const matches = STATES.flatMap((state) =>
    state.destinations.map((profile, index) => ({ state, profile, index })),
  ).filter(
    ({ state, profile, index }) =>
      (!search ||
        [...state.names, state.code, ...state.placeNames[index]].some((v) =>
          v.toLocaleLowerCase().includes(search),
        )) &&
      (region === 'All' || state.region === region) &&
      (interest === 'All' || profile.planning?.interest === interest) &&
      (season === 'All' || profile.planning?.months.some((m) => months[season].includes(m))) &&
      (transport === 'any' || profile.planning?.transport === transport) &&
      (setting === 'any' || profile.planning?.setting === setting),
  );
  const shown = matches.slice(0, limit);
  return (
    <div className="place-discovery">
      <div className="place-filter-row">
        <label>
          {x(lang, 'transport')}
          <select value={transport} onChange={(e) => setTransport(e.target.value)}>
            {(['any', 'transit', 'car', 'boat'] as const).map((v) => (
              <option key={v} value={v}>
                {x(lang, v)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {x(lang, 'interest')}
          <select value={setting} onChange={(e) => setSetting(e.target.value)}>
            {(['any', 'indoors', 'outdoors'] as const).map((v) => (
              <option key={v} value={v}>
                {x(lang, v)}
              </option>
            ))}
          </select>
        </label>
        <div className="segmented">
          <button aria-pressed={!map} onClick={() => setMap(false)}>
            {x(lang, 'list')}
          </button>
          <button aria-pressed={map} onClick={() => setMap(true)}>
            {x(lang, 'map')}
          </button>
        </div>
      </div>
      <p aria-live="polite" className="fine-print">
        {matches.length} {x(lang, 'places')}
      </p>
      {map && (
        <Suspense
          fallback={
            <div className="map-loading" role="status">
              {t('Loading…', 'กำลังโหลด…')}
            </div>
          }
        >
          <RouteMap
            lang={lang}
            points={matches.map((p) => ({
              id: p.profile.id,
              name: local(p.state.placeNames[p.index], lang),
              coordinates: p.profile.coordinates,
            }))}
            selectedId={selected}
            onSelect={(id) => {
              setSelected(id);
              const index = matches.findIndex((p) => p.profile.id === id);
              if (index >= limit) setLimit(index + 1);
              requestAnimationFrame(() =>
                document
                  .getElementById(`place-${id}`)
                  ?.scrollIntoView({ block: 'nearest', behavior: 'instant' }),
              );
            }}
          />
        </Suspense>
      )}
      <div className="place-discovery-grid">
        {shown.map(({ state, profile, index }) => (
          <article
            id={`place-${profile.id}`}
            className={`discovery-place ${selected === profile.id ? 'selected' : ''}`}
            key={profile.id}
          >
            <button
              className="discovery-photo"
              onClick={() => onOpen(state, index)}
              aria-label={local(state.placeNames[index], lang)}
            >
              <TravelImage
                src={state.photos.find((p) => p.placeIndex === index)!.src}
                alt=""
                width="480"
                height="320"
                loading="lazy"
              />
              <span className="place-postmark">
                {state.code}
                <small>USA</small>
              </span>
            </button>
            <div className="discovery-place-body">
              <span className="eyebrow">{stateName(state, lang)}</span>
              <h3>
                <button onClick={() => onOpen(state, index)}>
                  {local(state.placeNames[index], lang)}
                </button>
              </h3>
              <p>{local(profile.summary, lang)}</p>
              <div className="place-tags">
                <span>
                  {profile.visitMinutes} {t('minutes', 'นาที')}
                </span>
                {profile.planning && <span>{x(lang, profile.planning.transport)}</span>}
              </div>
              <div className="discovery-actions">
                <button className="button button-navy" onClick={() => onAdd(state, index)}>
                  <Icon name="plus" size={16} />
                  {t('Add to my trip', 'เพิ่มในทริปของฉัน')}
                </button>
                <button
                  className="icon-button"
                  aria-label={`${x(lang, 'savePlace')} ${local(state.placeNames[index], lang)}`}
                  aria-pressed={collections.groups[0].places.includes(profile.id)}
                  onClick={() => collections.toggle(profile.id)}
                >
                  <Icon name="heart" size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`${t('Compare destinations', 'เปรียบเทียบจุดหมาย')} ${local(state.placeNames[index], lang)}`}
                  onClick={() => onCompare(profile.id)}
                >
                  <Icon name="columns" size={18} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!matches.length && <p className="empty-results">{x(lang, 'noMatches')}</p>}
      {matches.length > limit && (
        <button className="button button-outline more-places" onClick={() => setLimit(limit + 12)}>
          {t('Show all destinations', 'ดูจุดหมายทั้งหมด')} ({matches.length - limit})
          <Icon name="arrow" size={17} />
        </button>
      )}
    </div>
  );
}
