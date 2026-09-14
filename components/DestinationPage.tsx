import TravelImage from './TravelImage';
import { useEffect, useState } from 'react';
import {
  local,
  stateName,
  statePhoto,
  REGION_LABELS,
  SEASON_LABELS,
  type Language,
  type StateGuide,
} from '../data/travel';
import { translate } from '../lib/i18n';
import { destinationUrl, findPlace, placeId } from '../lib/destinations';
import PhotoLightbox from './PhotoLightbox';
import RouteMap from './RouteMap';
import Icon from './Icon';
import PlacePractical from './PlacePractical';
import { x } from '../data/experience-copy';
import type { PlaceCollections } from '../lib/collections';

export default function DestinationPage({
  state,
  placeIndex,
  lang,
  saved,
  inTrip,
  onSave,
  onCompare,
  onAdd,
  onAddPlace,
  onOpen,
  onBack,
  notify,
  collections,
}: {
  state: StateGuide;
  placeIndex?: number;
  lang: Language;
  saved: boolean;
  inTrip: boolean;
  onSave: () => void;
  onCompare: () => void;
  onAdd: () => void;
  onAddPlace: (index: number) => void;
  onOpen: (state: StateGuide, index?: number) => void;
  onBack: () => void;
  notify: (message: string) => void;
  collections: PlaceCollections;
}) {
  const t = (en: string, th: string) => translate(en, th, lang);
  const [gallery, setGallery] = useState<number | null>(null);
  const [shareFallback, setShareFallback] = useState(false);
  useEffect(() => {
    document.querySelector<HTMLElement>('.destination-hero h1')?.focus({ preventScroll: true });
  }, []);
  const photo =
    placeIndex === undefined
      ? statePhoto(state)
      : (state.photos.find((item) => item.placeIndex === placeIndex) ?? statePhoto(state));
  const title =
    placeIndex === undefined ? stateName(state, lang) : local(state.placeNames[placeIndex], lang);
  const indices = placeIndex === undefined ? [0, 1, 2] : [placeIndex];
  const points = indices.flatMap((index) => {
    const p = findPlace(placeId(state, index));
    return p?.coordinates
      ? [
          {
            id: p.id,
            name: local(state.placeNames[index], lang),
            coordinates: p.coordinates as [number, number],
          },
        ]
      : [];
  });
  async function share() {
    const url = new URL(destinationUrl(state, lang, placeIndex), location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        notify(t('Guide link copied.', 'คัดลอกลิงก์คู่มือแล้ว'));
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setShareFallback(true);
    }
  }
  const open = (event: React.MouseEvent<HTMLAnchorElement>, index?: number) => {
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) {
      event.preventDefault();
      onOpen(state, index);
    }
  };
  const galleryPhotos = state.photos.filter(
    (p) => placeIndex === undefined || p.placeIndex === placeIndex,
  );
  return (
    <main className="destination-page" id="destination-guide">
      <div className="guide-breadcrumb container">
        <button className="text-link" onClick={onBack}>
          <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} />
          {t('All destinations', 'จุดหมายทั้งหมด')}
        </button>
        <span>/</span>
        {placeIndex === undefined ? (
          <span>{stateName(state, lang)}</span>
        ) : (
          <a href={destinationUrl(state, lang)} onClick={(event) => open(event)}>
            {stateName(state, lang)}
          </a>
        )}
      </div>
      <section className="destination-hero">
        <TravelImage
          src={photo.src}
          sizes="100vw"
          alt={local(state.placeNames[photo.placeIndex], lang)}
          fetchPriority="high"
        />
        <div className="destination-hero-shade" />
        <div className="destination-hero-copy container">
          <span className="eyebrow">
            {local(REGION_LABELS[state.region], lang)} · {state.code} / USA
          </span>
          <h1 tabIndex={-1}>{title}</h1>
          {lang !== 'en' && (
            <span className="destination-original" lang="en">
              {placeIndex === undefined ? state.name : state.places[placeIndex]}
            </span>
          )}
          <div className="destination-hero-actions">
            <button
              className="button button-red hero-primary-action"
              onClick={() => (placeIndex === undefined ? onAdd() : onAddPlace(placeIndex))}
            >
              {t('Add to my trip', 'เพิ่มในทริปของฉัน')}
            </button>
            <button
              className="button gallery-open"
              onClick={() => setGallery(state.photos.indexOf(photo))}
            >
              <Icon name="search" size={16} />
              {t('View fullscreen', 'ดูเต็มจอ')} · {galleryPhotos.length}
            </button>
          </div>
        </div>
      </section>
      <p className="destination-hero-credit container photo-credit">
        <a href={photo.source} target="_blank" rel="noreferrer">
          {photo.author}
        </a>{' '}
        ·{' '}
        <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
          {photo.license}
        </a>{' '}
        · {t('Resized for display', 'ปรับขนาดเพื่อแสดงผล')}
      </p>
      <div className="container compare-guide-link">
        <button className="text-link" onClick={onCompare}>
          {t('Compare destinations', 'เปรียบเทียบจุดหมาย')}
        </button>
      </div>
      <nav className="guide-toc container" aria-label={x(lang, 'practical')}>
        <a href="#guide-story">{x(lang, 'story')}</a>
        {placeIndex !== undefined && <a href="#guide-practical">{x(lang, 'practical')}</a>}
        <a href="#guide-photos">{x(lang, 'photos')}</a>
        <a href="#guide-map">{x(lang, 'directions')}</a>
      </nav>
      <div className="destination-layout container">
        <article className="destination-story" id="guide-story">
          <span className="eyebrow">{t('A LITTLE FURTHER', 'ออกไปค้นพบอีกนิด')}</span>
          <h2>
            {placeIndex === undefined
              ? t('Find your kind of adventure.', 'ค้นพบการเดินทางในแบบคุณ')
              : t('Make time for this place.', 'เผื่อเวลาให้จุดหมายนี้')}
          </h2>
          <p className="destination-intro">
            {local(
              placeIndex === undefined ? state.description : state.destinations[placeIndex].summary,
              lang,
            )}
          </p>
          {placeIndex !== undefined && (
            <PlacePractical profile={state.destinations[placeIndex]} lang={lang} />
          )}
          <div className="detail-facts">
            <div>
              <Icon name="sun" />
              <span>{t('Good seasons to explore', 'ฤดูกาลน่าเที่ยว')}</span>
              <strong>{state.season.map((s) => local(SEASON_LABELS[s], lang)).join(' · ')}</strong>
            </div>
            <div>
              <Icon name="calendar" />
              <span>{t('Suggested days in this state', 'จำนวนวันแนะนำในรัฐนี้')}</span>
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
          <div className="guide-section-heading">
            <h2>
              {placeIndex === undefined ? t('Three places to start', 'สามจุดหมายเริ่มต้น') : title}
            </h2>
            <span className="eyebrow">{state.code} — 01 / 03</span>
          </div>
          <div className="place-story-list" id="guide-photos">
            {indices.map((index) => {
              const item = state.photos.find((p) => p.placeIndex === index) ?? photo;
              const record = findPlace(placeId(state, index));
              return (
                <section className="place-story" key={index}>
                  <button
                    className="place-story-image"
                    onClick={() => setGallery(state.photos.indexOf(item))}
                    aria-label={`${t('View photo', 'ดูภาพ')} ${local(state.placeNames[index], lang)}`}
                  >
                    <TravelImage
                      src={item.src}
                      alt={local(state.placeNames[index], lang)}
                      loading="lazy"
                    />
                    <span>0{index + 1}</span>
                  </button>
                  <div>
                    <h3>
                      <a
                        href={destinationUrl(state, lang, index)}
                        onClick={(event) => open(event, index)}
                      >
                        {local(state.placeNames[index], lang)}
                      </a>
                    </h3>
                    {placeIndex === undefined && (
                      <p>{local(state.destinations[index].summary, lang)}</p>
                    )}
                    <div className="place-gallery-strip">
                      {state.photos
                        .filter((p) => p.placeIndex === index)
                        .map((p) => (
                          <button
                            key={p.src}
                            onClick={() => setGallery(state.photos.indexOf(p))}
                            aria-label={`${t('View photo', 'ดูภาพ')} ${local(state.placeNames[index], lang)} ${state.photos.indexOf(p) + 1}`}
                          >
                            <TravelImage
                              src={p.src}
                              alt={local(state.placeNames[index], lang)}
                              loading="lazy"
                            />
                          </button>
                        ))}
                    </div>
                    <div className="place-story-actions">
                      <button className="text-link" onClick={() => onAddPlace(index)}>
                        <Icon name="plus" size={16} />
                        {t('Add to daily plan', 'เพิ่มในแผนรายวัน')}
                      </button>
                      <button
                        className="text-link"
                        aria-pressed={collections.groups[0].places.includes(
                          `${state.code}-${index}`,
                        )}
                        onClick={() => collections.toggle(`${state.code}-${index}`)}
                      >
                        <Icon name="heart" size={16} />
                        {x(
                          lang,
                          collections.groups[0].places.includes(`${state.code}-${index}`)
                            ? 'savedPlace'
                            : 'savePlace',
                        )}
                      </button>
                      <a
                        className="text-link"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${state.places[index]}, ${state.name}, USA`)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('Open in Maps', 'เปิดในแผนที่')}
                        <Icon name="external" size={14} />
                      </a>
                      {placeIndex === undefined && (
                        <a
                          className="text-link"
                          href={destinationUrl(state, lang, index)}
                          onClick={(event) => open(event, index)}
                        >
                          {t('Open full guide', 'เปิดคู่มือเต็มหน้า')}
                          <Icon name="arrow" size={14} />
                        </a>
                      )}
                    </div>
                    <p className="photo-credit">
                      <a href={item.source} target="_blank" rel="noreferrer">
                        {item.author}
                      </a>{' '}
                      ·{' '}
                      <a href={item.licenseUrl} target="_blank" rel="noreferrer">
                        {item.license}
                      </a>{' '}
                      · {t('Resized for display', 'ปรับขนาดเพื่อแสดงผล')}
                    </p>
                    {record && (
                      <a
                        className="coordinate-source"
                        href={record.source}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('Location reference', 'แหล่งอ้างอิงตำแหน่ง')} · {record.title}
                      </a>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
          <div id="guide-map">
            <RouteMap points={points} lang={lang} />
          </div>
          <div className="destination-notes">
            <section>
              <span className="eyebrow">{t('A TASTE OF THE STATE', 'รสชาติประจำรัฐ')}</span>
              <h3>{t('Leave room for local flavors.', 'เผื่อใจให้รสชาติท้องถิ่น')}</h3>
              <p>{local(state.food, lang)}</p>
            </section>
            <section>
              <span className="eyebrow">{t('GOOD TO KNOW', 'รู้ไว้ก่อนเดินทาง')}</span>
              <h3>{t('Before you set off.', 'ก่อนออกเดินทาง')}</h3>
              <p>{local(state.tip, lang)}</p>
            </section>
          </div>
          <section className="planning-sources">
            <h3>{t('Check before you book', 'ตรวจสอบก่อนจอง')}</h3>
            <p>
              {t(
                'Check opening hours, admission, timed-entry reservations, transport, and seasonal access with official sources. The duration and seasons here are editorial starting points.',
                'ตรวจเวลาเปิด ค่าเข้า การจองรอบ การเดินทาง และทางเข้าตามฤดูกาลจากแหล่งทางการ จำนวนวันและฤดูกาลในหน้านี้เป็นข้อเสนอแนะเบื้องต้น',
              )}
            </p>
            {state.sources.map((source) => (
              <a
                key={source.url}
                className="text-link"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                {source.name}
                <Icon name="external" size={14} />
              </a>
            ))}
            <p className="content-date">
              {t('Content updated', 'ปรับปรุงเนื้อหา')} · {state.updatedAt}
            </p>
          </section>
        </article>
        <aside className="destination-aside">
          <div className="guide-plan-card">
            <span className="eyebrow">{t('YOUR NEXT CHAPTER', 'การเดินทางบทต่อไป')}</span>
            <h3>{t('Put it on the itinerary.', 'เก็บจุดหมายนี้ไว้ในแผน')}</h3>
            <p>
              {t(
                'Build a day-by-day plan with places, personal notes, and time to explore.',
                'จัดแผนเที่ยวรายวัน พร้อมสถานที่ โน้ตส่วนตัว และเวลาเที่ยว',
              )}
            </p>
            <button
              className="button button-red"
              onClick={placeIndex === undefined ? onAdd : () => onAddPlace(placeIndex)}
            >
              <Icon name="plus" size={17} />
              {placeIndex !== undefined
                ? t('Add to daily plan', 'เพิ่มในแผนรายวัน')
                : inTrip
                  ? t('View my trip', 'ดูทริปของฉัน')
                  : t('Add to my trip', 'เพิ่มในทริปของฉัน')}
            </button>
            <button className="button button-outline" aria-pressed={saved} onClick={onSave}>
              <Icon name="heart" size={17} />
              {saved ? t('Saved', 'บันทึกแล้ว') : t('Save this state', 'บันทึกรัฐนี้')}
            </button>
            <button className="text-link" onClick={share}>
              <Icon name="external" size={15} />
              {t('Share this guide', 'แชร์คู่มือนี้')}
            </button>
            {shareFallback && (
              <label>
                {t('Copy this link', 'คัดลอกลิงก์นี้')}
                <input
                  readOnly
                  value={new URL(destinationUrl(state, lang, placeIndex), location.origin).href}
                  onFocus={(event) => event.target.select()}
                />
              </label>
            )}
            <div className="postcard-stamp" aria-hidden="true">
              ROAM
              <br />
              {state.code}
              <small>AMERICA</small>
            </div>
          </div>
          {placeIndex !== undefined && (
            <div className="nearby-guides">
              <h3>{t('More in this state', 'จุดหมายอื่นในรัฐนี้')}</h3>
              {[0, 1, 2]
                .filter((i) => i !== placeIndex)
                .map((i) => (
                  <a
                    key={i}
                    href={destinationUrl(state, lang, i)}
                    onClick={(event) => open(event, i)}
                  >
                    {local(state.placeNames[i], lang)}
                    <Icon name="arrow" size={16} />
                  </a>
                ))}
            </div>
          )}
        </aside>
      </div>
      {gallery !== null && (
        <PhotoLightbox
          state={{ ...state, photos: galleryPhotos }}
          lang={lang}
          initialIndex={Math.max(
            0,
            galleryPhotos.findIndex((p) => p.src === state.photos[gallery].src),
          )}
          onClose={() => setGallery(null)}
        />
      )}
    </main>
  );
}
