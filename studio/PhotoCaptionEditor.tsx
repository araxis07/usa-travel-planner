import type { Photo, LocalText } from '../data/travel';
import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../lib/i18n';
export default function PhotoCaptionEditor({
  photo,
  language,
  onChange,
}: {
  photo: Photo;
  language: Language;
  onChange: (photo: Photo) => void;
}) {
  const index = LANGUAGES.indexOf(language);
  return (
    <div className="studio-photo-captions">
      <label>
        คำบรรยายภาพ · {LANGUAGE_NAMES[language]}
        <textarea
          lang={language}
          rows={2}
          maxLength={2000}
          value={photo.displayCaption?.[index] ?? ''}
          onChange={(e) => {
            const texts = [...(photo.displayCaption ?? ['', '', '', '', ''])];
            texts[index] = e.target.value;
            const reviewed = [...(photo.captionReviewed ?? Array(5).fill(false))];
            reviewed[index] = false;
            onChange({
              ...photo,
              displayCaption: texts as unknown as LocalText,
              captionReviewed: reviewed,
            });
          }}
        />
      </label>
      <label className="studio-check">
        <input
          type="checkbox"
          checked={photo.captionReviewed?.[index] ?? false}
          onChange={(e) => {
            const reviewed = [...(photo.captionReviewed ?? Array(5).fill(false))];
            reviewed[index] = e.target.checked;
            onChange({ ...photo, captionReviewed: reviewed });
          }}
        />
        เจ้าของภาษาตรวจคำบรรยายและความตรงกับภาพแล้ว
      </label>
    </div>
  );
}
