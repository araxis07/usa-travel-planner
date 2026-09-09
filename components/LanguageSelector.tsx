import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../lib/i18n';
import Icon from './Icon';
export default function LanguageSelector({
  lang,
  onChange,
}: {
  lang: Language;
  onChange: (lang: Language) => void;
}) {
  return (
    <label className="language-selector">
      <Icon name="globe" size={16} />
      <span className="language-short" aria-hidden="true">
        {lang.toUpperCase()}
      </span>
      <span className="sr-only">Language / ภาษา</span>
      <select
        aria-label="Language / ภาษา"
        value={lang}
        onChange={(e) => onChange(e.target.value as Language)}
      >
        {LANGUAGES.map((code) => (
          <option key={code} value={code} lang={code}>
            {LANGUAGE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
