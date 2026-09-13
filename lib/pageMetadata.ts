import { local, stateName, type Language } from '../data/travel';
import { destinationUrl, type readDestination } from './destinations';
import { translate } from './i18n';

// The build supplies the real public origin. Local development never invents a canonical host.
export function updatePageMetadata(
  lang: Language,
  destination: ReturnType<typeof readDestination>,
  privatePage: boolean,
) {
  const state = destination?.state;
  const index = destination?.placeIndex;
  const profile = state && index !== undefined ? state.destinations[index] : undefined;
  const name = state
    ? index === undefined
      ? stateName(state, lang)
      : local(state.placeNames[index], lang)
    : 'Roam America';
  const title = state
    ? `${name} — Roam America`
    : translate(
        'Roam America — 50 states. Endless possibilities.',
        'Roam America — วางแผนเที่ยวอเมริกาครบ 50 รัฐ',
        lang,
      );
  const description = profile
    ? local(profile.summary, lang)
    : state
      ? local(state.description, lang)
      : translate(
          'Explore all 50 states, save your favorite places, and build your own American adventure.',
          'สำรวจครบ 50 รัฐ บันทึกสถานที่โปรด และวางแผนเที่ยวอเมริกาในแบบคุณ',
          lang,
        );
  const origin = document.querySelector<HTMLMetaElement>('meta[name="roam:site-origin"]')?.content;
  const meta = (key: string, content: string, property = false) => {
    const attribute = property ? 'property' : 'name';
    const element =
      document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`) ??
      document.createElement('meta');
    element.setAttribute(attribute, key);
    element.content = content;
    document.head.append(element);
  };
  document.title = title;
  meta('description', description);
  meta('og:title', title, true);
  meta('og:description', description, true);
  meta('robots', privatePage ? 'noindex, nofollow' : 'index, follow');
  document
    .querySelectorAll(
      'link[rel="canonical"],link[rel="alternate"][hreflang],script[type="application/ld+json"],meta[property="og:url"],meta[property="og:image"],meta[property="og:image:alt"]',
    )
    .forEach((el) => el.remove());
  if (privatePage || !origin) return;
  const path = (code: Language) => (state ? destinationUrl(state, code, index) : `/${code}/`);
  const link = (rel: string, href: string, language?: string) => {
    const el = document.createElement('link');
    el.rel = rel;
    el.href = href;
    if (language) el.hreflang = language;
    document.head.append(el);
  };
  link('canonical', origin + path(lang));
  for (const code of ['en', 'th', 'zh', 'ja', 'ko'] as Language[])
    link('alternate', origin + path(code), code);
  link('alternate', origin + path('en'), 'x-default');
  const photo = state
    ? index === undefined
      ? state.photos[state.cover]
      : state.photos.find((p) => p.placeIndex === index)
    : undefined;
  meta('og:url', origin + path(lang), true);
  meta('og:image', origin + (photo?.src || '/images/hero.jpg'), true);
  meta('og:image:alt', name, true);
  if (state) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': profile ? 'TouristAttraction' : 'TouristDestination',
      name,
      description,
      url: origin + path(lang),
      ...(photo ? { image: origin + photo.src } : {}),
      ...(profile
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: profile.coordinates[0],
              longitude: profile.coordinates[1],
            },
          }
        : {}),
    });
    document.head.append(script);
  }
}
