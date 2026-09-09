import { translate } from '../lib/i18n';
import { useState } from 'react';
import {
  local,
  stateName,
  REGION_LABELS,
  SEASON_LABELS,
  type StateGuide,
  type Language,
} from '../data/travel';
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
  const t = (en: string, th: string, values?: Record<string, string | number>) =>
    translate(en, th, lang, values);
  const [selectedPhoto, setSelectedPhoto] = useState(state.cover);
  const photo = state.photos[selectedPhoto] ?? state.photos[0];
  return (
    <div className="state-detail">
      <div className="detail-cover">
        <img src={photo.src} alt={local(state.placeNames[photo.placeIndex], lang)} />
        <div>
          <span className="eyebrow">
            {local(REGION_LABELS[state.region], lang)} · {state.code}
          </span>
          <h2>{stateName(state, lang)}</h2>
        </div>
      </div>
      <div className="detail-content">
        <div className="photo-gallery" aria-label={t('Photo gallery', 'แกลเลอรีภาพ')}>
          {state.photos.map((item, index) => (
            <button
              key={item.src}
              aria-pressed={index === selectedPhoto}
              onClick={() => setSelectedPhoto(index)}
              aria-label={`${t('View photo', 'ดูภาพ')} ${local(state.placeNames[item.placeIndex], lang)}`}
            >
              <img src={item.src} alt="" loading="lazy" />
              <span>{local(state.placeNames[item.placeIndex], lang)}</span>
            </button>
          ))}
        </div>
        <p className="photo-credit">
          {local(state.placeNames[photo.placeIndex], lang)} ·{' '}
          <a href={photo.source} target="_blank" rel="noreferrer">
            {photo.author}
          </a>{' '}
          ·{' '}
          <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
            {photo.license}
          </a>{' '}
          · {t('Resized for display', 'ปรับขนาดเพื่อแสดงผล')}
        </p>
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
              <span>
                {local(state.placeNames[i], lang)}
                {lang !== 'en' && (
                  <small className="place-original" lang="en">
                    {place}
                  </small>
                )}
              </span>
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
        {state.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="text-link source-link"
          >
            {source.name === 'Visit The USA'
              ? t('Official state guide on Visit The USA', 'คู่มือรัฐจาก Visit The USA')
              : source.name}
            <Icon name="external" size={14} />
          </a>
        ))}
        <p className="content-date">
          {t('Content updated', 'ปรับปรุงเนื้อหา')} · {state.updatedAt}
        </p>
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
