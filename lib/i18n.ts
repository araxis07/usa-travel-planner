import translations from '../content/translations.json' with { type: 'json' };
export const LANGUAGES = ['en', 'th', 'zh', 'ja', 'ko'] as const;
export type Language = (typeof LANGUAGES)[number];
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  th: 'ไทย',
  zh: '简体中文',
  ja: '日本語',
  ko: '한국어',
};
export const LOCALES: Record<Language, string> = {
  en: 'en-US',
  th: 'th-TH',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
};
export const languageIndex = (lang: Language) => LANGUAGES.indexOf(lang);
export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.includes(value as Language);
const dictionary: Record<string, string[]> = translations;
export function translate(
  en: string,
  th: string,
  lang: Language,
  values: Record<string, string | number> = {},
) {
  const text =
    lang === 'en' ? en : lang === 'th' ? th : (dictionary[en]?.[languageIndex(lang) - 2] ?? en);
  return text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
export function initialLanguage(): Language {
  const query = new URLSearchParams(location.search).get('lang');
  if (isLanguage(query)) return query;
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('roam.language') || 'null');
    if (isLanguage(saved)) return saved;
  } catch {
    /* Browser storage may be disabled. */
  }
  const browser = navigator.language.split('-')[0];
  return isLanguage(browser) ? browser : 'en';
}
