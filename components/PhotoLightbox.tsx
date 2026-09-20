import { useEffect, useRef, useState } from 'react';
import { local, type StateGuide, type Language } from '../data/travel';
import { translate } from '../lib/i18n';
import Icon from './Icon';
import { x } from '../data/experience-copy';
import { photoDetails } from '../data/photo-details';

export default function PhotoLightbox({
  state,
  lang,
  initialIndex,
  onClose,
}: {
  state: StateGuide;
  lang: Language;
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const photo = photoDetails(state.photos[index] ?? state.photos[0]);
  const t = (en: string, th: string) => translate(en, th, lang);
  function move(delta: number) {
    setIndex((value) => (value + delta + state.photos.length) % state.photos.length);
    setZoom(false);
    setFailed(false);
  }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const dialog = ref.current;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="photo-lightbox"
      aria-label={t('Fullscreen gallery', 'แกลเลอรีเต็มจอ')}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          event.stopPropagation();
          move(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
    >
      <header className="lightbox-toolbar">
        <span aria-live="polite">
          {index + 1} / {state.photos.length} · {local(state.placeNames[photo.placeIndex], lang)}
        </span>
        <button
          className="icon-button"
          aria-pressed={zoom}
          aria-label={t('Zoom photo', 'ซูมภาพ')}
          onClick={() => setZoom((value) => !value)}
        >
          <Icon name={zoom ? 'minus' : 'plus'} />
        </button>
        <button
          autoFocus
          className="icon-button"
          aria-label={t('Close gallery', 'ปิดแกลเลอรี')}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      <div
        className={`lightbox-stage ${zoom ? 'is-zoomed' : ''}`}
        onTouchStart={(event) => {
          const point = event.touches[0];
          touch.current = { x: point.clientX, y: point.clientY };
        }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          if (!start || zoom) return;
          const end = event.changedTouches[0];
          const dx = end.clientX - start.x;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(end.clientY - start.y))
            move(dx > 0 ? -1 : 1);
        }}
      >
        {failed ? (
          <p role="status">
            {t(
              'Photo unavailable. Try another image or open the source below.',
              'โหลดภาพไม่ได้ ลองภาพอื่นหรือเปิดแหล่งภาพด้านล่าง',
            )}
          </p>
        ) : (
          <img
            key={photo.src}
            src={photo.src}
            alt={local(state.placeNames[photo.placeIndex], lang)}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <footer className="lightbox-footer">
        <button
          className="icon-button"
          aria-label={t('Previous photo', 'ภาพก่อนหน้า')}
          onClick={() => move(-1)}
        >
          <Icon name="arrow" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <p>
          <span className="photo-caption">
            {photo.displayCaption
              ? local(photo.displayCaption, lang)
              : x(lang, 'photoOf', {
                  place: local(state.placeNames[photo.placeIndex], lang),
                  number: index + 1,
                })}
          </span>
          <br />
          {photo.caption && (
            <>
              <span className="source-photo-caption">
                <small>{x(lang, 'sourceCaption')}: </small>
                {photo.caption}
              </span>
              <br />
            </>
          )}
          <a href={photo.source} target="_blank" rel="noreferrer">
            {photo.author}
          </a>{' '}
          ·{' '}
          <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
            {photo.license}
          </a>
          <br />
          {t('Resized for display', 'ปรับขนาดเพื่อแสดงผล')}
        </p>
        <button
          className="icon-button"
          aria-label={t('Next photo', 'ภาพถัดไป')}
          onClick={() => move(1)}
        >
          <Icon name="arrow" />
        </button>
      </footer>
    </dialog>
  );
}
