import TravelImage from './components/TravelImage';
import LanguageSelector from './components/LanguageSelector';
import { stateName } from './data/travel';
import { translate, initialLanguage } from './lib/i18n';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Atlas from './components/Atlas';
import Icon, { type IconName } from './components/Icon';
import StateCard from './components/StateCard';
import type { TravelModal } from './components/TravelDialog';
import { Brand, RoadTrips, PlannerBanner, FieldNotes, Footer } from './components/LandingSections';
import {
  STATES,
  local,
  REGION_LABELS,
  INTEREST_LABELS,
  SEASON_LABELS,
  type StateGuide,
  type Language,
  type Interest,
  type Region,
  type Season,
  type TripActivity,
} from './data/travel';
import { readLocal, tripDays, validFavorites } from './lib/storage';
import './styles.css';
import './journey.css';
import CompareDestinations, { validComparison } from './components/CompareDestinations';
import AddPlaceDialog from './components/AddPlaceDialog';
import { useTripHistory } from './lib/useTripHistory';
import './expedition.css';
import { updatePageMetadata } from './lib/pageMetadata';
import { destinationUrl, readDestination } from './lib/destinations';
import { x } from './data/experience-copy';
import { useJourneyLibrary } from './lib/journeyLibrary';
import { useCollections } from './lib/collections';
import type { Trip } from './data/travel';
import './experience.css';

const TripLibrary = lazy(() => import('./components/TripLibrary'));
const TripWizard = lazy(() => import('./components/TripWizard'));
const PlaceDiscovery = lazy(() => import('./components/PlaceDiscovery'));

const SharedTrip = lazy(() => import('./components/SharedTrip'));
const TravelDialog = lazy(() => import('./components/TravelDialog'));
const DestinationPage = lazy(() => import('./components/DestinationPage'));
const TripPlanner = lazy(() => import('./components/TripPlanner'));
const sharedToken = () => new URLSearchParams(location.hash.slice(1)).get('share');

const interestIcons: Record<Interest, IconName> = {
  Nature: 'mountain',
  Cities: 'city',
  Coast: 'waves',
  Culture: 'book',
};
export default function App() {
  const [comparison, setComparison] = useState<string[]>(() =>
    readLocal<string[]>('roam.compare.v1', [], (value) => (validComparison(value) ? value : [])),
  );
  const [comparing, setComparing] = useState(false);
  const [shareToken, setShareToken] = useState(sharedToken);
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [favorites, setFavorites] = useState<string[]>(() =>
    readLocal('roam.saved.v1', [], validFavorites),
  );
  const { trip, setTrip, canUndo, undo, replaceTrip } = useTripHistory();
  const library = useJourneyLibrary(trip, replaceTrip);
  const collections = useCollections();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [placeView, setPlaceView] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<{ state: StateGuide; index: number } | null>(
    null,
  );
  const [storageFailed, setStorageFailed] = useState(false);
  const [modal, updateModal] = useState<TravelModal | null>(() =>
    new URLSearchParams(location.search).get('view') === 'planner'
      ? { type: 'trip', daily: true }
      : null,
  );
  const setModal = (next: TravelModal | null) => {
    const url = new URL(location.href);
    if (next?.type === 'trip') {
      url.searchParams.set('view', 'planner');
      if (modal?.type !== 'trip') history.pushState({ scrollY: 0 }, '', url);
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.getElementById('planner-title')?.focus();
      });
    } else if (modal?.type === 'trip') {
      url.searchParams.delete('view');
      history.replaceState(history.state, '', url);
    }
    updateModal(next);
    setMobileNav(false);
  };
  const [destination, setDestination] = useState(readDestination);
  const [activeSection, setActiveSection] = useState(location.hash === '#map' ? 'map' : 'discover');
  const [query, setQuery] = useState('');
  const [interest, setInterest] = useState<Interest | 'All'>('All');
  const [region, setRegion] = useState<Region | 'All'>('All');
  const [season, setSeason] = useState<Season | 'All'>('All');
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState('curated');
  const [mobileNav, setMobileNav] = useState(false);
  const [motion, setMotion] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const heroRef = useRef<HTMLElement>(null);
  const t = (en: string, th: string, values?: Record<string, string | number>) =>
    translate(en, th, lang, values);
  const notify = (message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  };
  const createTrip = (next: Trip) => {
    const result = library.create(next);
    if (result !== 'ok') {
      notify(x(lang, result === 'full' ? 'libraryLimit' : 'storageError'));
      return;
    }
    setWizardOpen(false);
    setLibraryOpen(false);
    setModal({ type: 'trip', daily: true });
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => {
    try {
      localStorage.setItem('roam.compare.v1', JSON.stringify(comparison));
      localStorage.setItem('roam.saved.v1', JSON.stringify(favorites));
      localStorage.setItem('roam.trip.v1', JSON.stringify(trip));
      localStorage.setItem('roam.language', JSON.stringify(lang));
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }, [favorites, trip, lang, comparison]);
  useEffect(() => {
    document.documentElement.lang = lang;
    const url = new URL(location.href);
    url.pathname = destination
      ? destinationUrl(destination.state, lang, destination.placeIndex)
      : `/${lang}/`;
    url.searchParams.delete('state');
    url.searchParams.delete('place');
    url.searchParams.set('lang', lang);
    history.replaceState(history.state, '', url);
    updatePageMetadata(lang, destination, modal?.type === 'trip' || !!shareToken);
  }, [lang, destination, modal?.type, shareToken]);
  useEffect(() => {
    const old = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const pop = (event: PopStateEvent) => {
      setDestination(readDestination());
      setShareToken(sharedToken());
      setLang(initialLanguage());
      updateModal(
        new URLSearchParams(location.search).get('view') === 'planner'
          ? { type: 'trip', daily: true }
          : null,
      );
      setMobileNav(false);
      setActiveSection(location.hash === '#map' ? 'map' : 'discover');
      requestAnimationFrame(() =>
        window.scrollTo({ top: event.state?.scrollY ?? 0, behavior: 'instant' }),
      );
    };
    const hash = () => setShareToken(sharedToken());
    window.addEventListener('hashchange', hash);
    window.addEventListener('popstate', pop);
    return () => {
      window.removeEventListener('hashchange', hash);
      window.removeEventListener('popstate', pop);
      history.scrollRestoration = old;
    };
  }, []);
  const openDestination = (state: StateGuide, placeIndex?: number) => {
    history.replaceState({ ...history.state, scrollY: window.scrollY }, '', location.href);
    history.pushState({ scrollY: 0 }, '', destinationUrl(state, lang, placeIndex));
    setDestination({ state, placeIndex });
    setModal(null);
    setMobileNav(false);
    setActiveSection('discover');
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.querySelector<HTMLElement>('.destination-hero h1')?.focus({ preventScroll: true });
    });
  };
  const goSection = (section: string) => {
    if (shareToken) {
      history.pushState({}, '', `/?lang=${lang}`);
      setShareToken(null);
    }
    setModal(null);
    setMobileNav(false);
    setActiveSection(section === 'map' ? 'map' : 'discover');
    if (destination) {
      history.replaceState({ ...history.state, scrollY: window.scrollY }, '', location.href);
      history.pushState(
        { scrollY: 0 },
        '',
        `/${lang}/?lang=${lang}${section ? `#${section}` : ''}`,
      );
      setDestination(null);
    }
    requestAnimationFrame(() => {
      if (section)
        document
          .getElementById(section)
          ?.scrollIntoView({ behavior: motion ? 'smooth' : 'instant' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    });
  };
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setMotion(!preference.matches);
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);
  const saveState = (state: StateGuide) => {
    const saved = favorites.includes(state.code);
    setFavorites((values) =>
      saved ? values.filter((code) => code !== state.code) : [...values, state.code],
    );
    notify(
      saved
        ? t('{name} removed from saved places.', 'นำ{name}ออกจากรายการโปรดแล้ว', {
            name: stateName(state, lang),
          })
        : t('{name} saved for a future adventure.', 'บันทึก{name}ในรายการโปรดแล้ว', {
            name: stateName(state, lang),
          }),
    );
  };
  const explore = () => {
    goSection('destinations');
  };
  const addState = (state: StateGuide) => {
    if (!trip.stops.some((stop) => stop.code === state.code)) {
      setTrip((value) => ({
        ...value,
        stops: [...value.stops, { code: state.code, days: state.days, notes: '' }],
      }));
      notify(
        t('{name} added to your trip.', 'เพิ่ม{name}ในทริปแล้ว', { name: stateName(state, lang) }),
      );
    }
    setModal({ type: 'trip' });
  };
  const resetFilters = () => {
    setQuery('');
    setInterest('All');
    setRegion('All');
    setSeason('All');
    setShowAll(false);
  };
  const addPlace = (state: StateGuide, index: number) => {
    if (trip.stops.reduce((total, stop) => total + (stop.activities?.length ?? 0), 0) >= 200) {
      notify(
        t('A trip can hold up to 200 activities.', 'หนึ่งทริปเพิ่มกิจกรรมได้สูงสุด 200 รายการ'),
      );
      return;
    }
    setPendingPlace({ state, index });
  };
  const confirmPlace = (activity: TripActivity) => {
    if (!pendingPlace) return;
    const { state } = pendingPlace;
    setTrip((value) => {
      const existing = value.stops.some((stop) => stop.code === state.code);
      return {
        ...value,
        stops: existing
          ? value.stops.map((stop) =>
              stop.code === state.code
                ? { ...stop, activities: [...(stop.activities ?? []), activity] }
                : stop,
            )
          : [
              ...value.stops,
              { code: state.code, days: state.days, notes: '', activities: [activity] },
            ],
      };
    });
    setModal({ type: 'trip', daily: true, code: state.code });
    setPendingPlace(null);
    notify(t('Activity added to your day.', 'เพิ่มกิจกรรมในวันนี้แล้ว'));
  };
  const search = query.trim().toLocaleLowerCase();
  const filtered = STATES.filter(
    (state) =>
      (!search ||
        [
          state.name,
          state.thai,
          state.code,
          ...state.names,
          ...state.description,
          ...state.placeNames.flat(),
          ...state.places,
          ...state.food,
          ...state.interests,
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(search)) &&
      (interest === 'All' || state.interests.includes(interest)) &&
      (region === 'All' || state.region === region) &&
      (season === 'All' || state.season.includes(season)),
  );
  const hasFilters = !!search || interest !== 'All' || region !== 'All' || season !== 'All';
  const sorted =
    sort === 'az'
      ? [...filtered].sort((a, b) => stateName(a, lang).localeCompare(stateName(b, lang), lang))
      : filtered;
  const visible = showAll ? sorted : sorted.slice(0, hasFilters ? 8 : 4);
  const nav = [
    { href: '#destinations', label: t('Discover', 'จุดหมาย') },
    { href: '#map', label: t('Explore the map', 'สำรวจแผนที่') },
    { href: '#road-trips', label: t('Road trips', 'โรดทริป') },
    { href: '#guides', label: t('Field notes', 'คู่มือเที่ยว') },
  ];
  return (
    <div
      className="site"
      data-motion={motion ? 'on' : 'paused'}
      onClickCapture={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        const anchor = (event.target as Element).closest('a');
        const href = anchor?.getAttribute('href');
        if (destination && href?.startsWith('#guide-')) {
          event.preventDefault();
          history.replaceState(history.state, '', href);
          document
            .getElementById(href.slice(1))
            ?.scrollIntoView({ behavior: motion ? 'smooth' : 'instant', block: 'start' });
        } else if (destination && href?.startsWith('#') && href !== '#destination-guide') {
          event.preventDefault();
          goSection(href.slice(1));
        } else if (href === '#map' || href === '#destinations') {
          setActiveSection(href === '#map' ? 'map' : 'discover');
        }
      }}
    >
      <a
        className="skip-link"
        href={
          modal?.type === 'trip'
            ? '#planner-page'
            : destination
              ? '#destination-guide'
              : '#destinations'
        }
      >
        {t('Skip to destinations', 'ข้ามไปยังจุดหมาย')}
      </a>
      <div className="announcement">
        <span className="little-flag" aria-hidden="true" />
        <span>
          {t(
            '50 states. A million ways to make them yours.',
            '50 รัฐ หลากล้านประสบการณ์ในแบบของคุณ',
          )}
        </span>
        <span className="announcement-star" aria-hidden="true">
          ✦
        </span>
        <span className="announcement-end">
          {t('LET’S TAKE THE SCENIC ROUTE', 'ออกไปพบเส้นทางที่น่าจดจำ')}
        </span>
      </div>
      <header className="header">
        <div className="header-inner">
          <Brand />
          <nav
            className={`desktop-nav ${mobileNav ? 'mobile-open' : ''}`}
            aria-label={t('Main navigation', 'เมนูหลัก')}
          >
            {nav.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMobileNav(false)}>
                {item.label}
              </a>
            ))}
            <button
              className="mobile-saved-link"
              onClick={() => {
                setMobileNav(false);
                setModal({ type: 'saved' });
              }}
            >
              <Icon name="heart" size={17} />
              {t('Saved places', 'สถานที่โปรด')} ({favorites.length})
            </button>
          </nav>
          <div className="header-actions">
            <button
              className="header-compare icon-button"
              aria-label={t('Compare destinations', 'เปรียบเทียบจุดหมาย')}
              onClick={() => setComparing(true)}
            >
              <Icon name="columns" size={19} />
            </button>
            <LanguageSelector lang={lang} onChange={setLang} />
            <button
              className="header-saved icon-button"
              aria-label={t('Saved places ({count})', 'สถานที่โปรด ({count})', {
                count: favorites.length,
              })}
              onClick={() => setModal({ type: 'saved' })}
            >
              <Icon name="heart" />
              {favorites.length > 0 && <span className="count-dot">{favorites.length}</span>}
            </button>
            <button
              className="button button-navy header-trip"
              onClick={() => setModal({ type: 'trip' })}
            >
              <Icon name="bag" size={17} />
              <span>{t('My trip', 'ทริปของฉัน')}</span>
              <span className="trip-count">{trip.stops.length}</span>
            </button>
            <button
              className="menu-button icon-button"
              aria-label={t('Toggle navigation', 'เปิดหรือปิดเมนู')}
              aria-expanded={mobileNav}
              onClick={() => setMobileNav((value) => !value)}
            >
              <Icon name={mobileNav ? 'close' : 'menu'} />
            </button>
          </div>
        </div>
      </header>
      <Suspense
        fallback={
          <main className="container page-loading" role="status">
            {t('Loading…', 'กำลังโหลด…')}
          </main>
        }
      >
        {shareToken ? (
          <Suspense
            fallback={
              <main className="container shared-trip-page">
                <p role="status">{t('Loading…', 'กำลังโหลด…')}</p>
              </main>
            }
          >
            <SharedTrip
              token={shareToken}
              lang={lang}
              onBack={explore}
              onCopy={(copy) => {
                setTrip(copy);
                setShareToken(null);
                history.replaceState({}, '', `/?lang=${lang}`);
                setModal({ type: 'trip', daily: true });
              }}
            />
          </Suspense>
        ) : modal?.type === 'trip' ? (
          <main id="planner-page" className="planner-page container">
            <div className="planner-page-top">
              <button className="text-link" onClick={explore}>
                {t('All destinations', 'จุดหมายทั้งหมด')}
              </button>
              <h1 id="planner-title" tabIndex={-1}>
                {t('My trip planner', 'แผนทริปของฉัน')}
              </h1>
              <button className="button button-outline" onClick={() => setLibraryOpen(true)}>
                <Icon name="bag" size={17} />
                {x(lang, 'library')}
              </button>
            </div>
            {canUndo && (
              <div className="undo-notice" role="status">
                <span>{t('Removed from your plan.', 'ลบออกจากแผนแล้ว')}</span>
                <button className="text-link" onClick={undo}>
                  {t('Undo', 'เลิกทำ')}
                </button>
              </div>
            )}
            <TripPlanner
              key={library.activeId}
              trip={trip}
              setTrip={setTrip}
              lang={lang}
              onExplore={explore}
              storageFailed={storageFailed || library.error}
              notify={notify}
              initialDaily={modal.daily}
              initialCode={modal.code}
            />
          </main>
        ) : destination ? (
          <DestinationPage
            key={`${destination.state.code}-${destination.placeIndex ?? 'state'}`}
            state={destination.state}
            placeIndex={destination.placeIndex}
            lang={lang}
            saved={favorites.includes(destination.state.code)}
            inTrip={trip.stops.some((stop) => stop.code === destination.state.code)}
            onCompare={() => {
              const id =
                destination.placeIndex === undefined
                  ? destination.state.code
                  : `${destination.state.code}-${destination.placeIndex}`;
              if (!comparison.includes(id) && comparison.length < 3)
                setComparison([...comparison, id]);
              setComparing(true);
            }}
            onSave={() => saveState(destination.state)}
            onAdd={() => addState(destination.state)}
            onAddPlace={(index) => addPlace(destination.state, index)}
            onOpen={openDestination}
            onBack={explore}
            notify={notify}
            collections={collections}
          />
        ) : (
          <main>
            <section
              className="hero"
              ref={heroRef}
              onPointerMove={(event) => {
                if (!motion || event.pointerType === 'touch') return;
                const rect = event.currentTarget.getBoundingClientRect();
                heroRef.current?.style.setProperty(
                  '--pointer-x',
                  `${((event.clientX - rect.left) / rect.width - 0.5) * 13}deg`,
                );
                heroRef.current?.style.setProperty(
                  '--pointer-y',
                  `${((event.clientY - rect.top) / rect.height - 0.5) * -13}deg`,
                );
              }}
              onPointerLeave={() => {
                heroRef.current?.style.setProperty('--pointer-x', '0deg');
                heroRef.current?.style.setProperty('--pointer-y', '0deg');
              }}
            >
              <TravelImage
                sizes="100vw"
                className="hero-image"
                src="/images/hero.jpg"
                alt={t(
                  'Sandstone buttes in Monument Valley Navajo Tribal Park',
                  'ภูเขาหินทรายในอุทยานชนเผ่านาวาโฮ โมนูเมนต์แวลลีย์',
                )}
                fetchPriority="high"
                width="1600"
                height="1060"
              />
              <div className="hero-shade" />
              <div className="hero-content">
                <span className="eyebrow hero-eyebrow">
                  <span />
                  {t('THE GREAT AMERICAN GETAWAY', 'ออกเดินทางสู่ประสบการณ์อเมริกา')}
                </span>
                <h1>
                  {t('Find your', 'ค้นพบอเมริกา')}
                  <br />
                  {t('American', 'ในจังหวะ')}
                  <br />
                  <em>{t('state of mind.', 'ที่เป็นคุณ')}</em>
                </h1>
                <p>
                  {t(
                    'From the places you’ve always dreamed of to the ones you haven’t found yet. Discover America, one unforgettable state at a time.',
                    'จากสถานที่ในฝัน สู่มุมที่คุณยังไม่เคยรู้จัก ออกไปค้นพบอเมริกา ทีละรัฐ ทีละความทรงจำ',
                  )}
                </p>
                <div className="hero-cta">
                  <a className="button button-red" href="#destinations">
                    {t('Find your adventure', 'ค้นหาทริปของคุณ')}
                    <Icon name="arrow" size={18} />
                  </a>
                  <a className="hero-map-link" href="#map">
                    <Icon name="map" size={18} />
                    {t('Explore the map', 'สำรวจแผนที่')}
                  </a>
                </div>
                <div className="hero-footnote">
                  <span className="three-stars">✦ ✦ ✦</span>
                  {t(
                    'A big country. A journey that’s uniquely yours.',
                    'ประเทศกว้างใหญ่ การเดินทางในแบบของคุณ',
                  )}
                </div>
              </div>
              <div className="hero-stamp" aria-hidden="true">
                <div className="stamp-edge" />
                <div className="stamp-face">
                  <svg viewBox="0 0 180 180">
                    <defs>
                      <path
                        id="stamp-circle"
                        d="M90,90m-65,0a65,65 0 1,1 130,0a65,65 0 1,1-130,0"
                      />
                    </defs>
                    <text>
                      <textPath href="#stamp-circle" textLength="400">
                        FIFTY STATES · ENDLESS POSSIBILITIES ·{' '}
                      </textPath>
                    </text>
                    <path
                      className="stamp-star"
                      d="m90 40 10 36 37 14-37 10-10 40-11-39-38-11 37-12Z"
                    />
                  </svg>
                </div>
              </div>
              <button
                className="hero-location"
                onClick={() =>
                  setModal({ type: 'state', state: STATES.find((state) => state.code === 'AZ')! })
                }
              >
                <span className="location-icon">
                  <Icon name="pin" size={23} />
                </span>
                <span>
                  <small>{t('SOMEWHERE WORTH GETTING LOST', 'หนึ่งสถานที่ที่ควรออกไปพบ')}</small>
                  <strong>Monument Valley</strong>
                  <span>{t('Arizona & Utah', 'แอริโซนาและยูทาห์')}</span>
                </span>
                <Icon name="arrow" size={18} />
              </button>
              <button
                className="motion-button"
                onClick={() => setMotion((value) => !value)}
                aria-label={
                  motion
                    ? t('Pause animations', 'หยุดแอนิเมชัน')
                    : t('Enable animations', 'เปิดแอนิเมชัน')
                }
                aria-pressed={!motion}
              >
                <Icon name={motion ? 'pause' : 'play'} size={13} />
              </button>
              <span className="hero-image-number" aria-hidden="true">
                01 — 50
              </span>
            </section>
            <section className="journey-launchpad section-shell" aria-label={x(lang, 'start')}>
              <div>
                <span className="eyebrow">01 / ROAM AMERICA</span>
                <h2>{x(lang, 'start')}</h2>
              </div>
              <a href="#destinations">
                <Icon name="compass" />
                <strong>{x(lang, 'explore')}</strong>
                <span>50 · {x(lang, 'states')}</span>
                <Icon name="arrow" size={16} />
              </a>
              <a href="#road-trips">
                <Icon name="route" />
                <strong>{x(lang, 'templates')}</strong>
                <span>8 · {x(lang, 'suggested')}</span>
                <Icon name="arrow" size={16} />
              </a>
              <button
                onClick={() =>
                  trip.stops.length ? setModal({ type: 'trip', daily: true }) : setWizardOpen(true)
                }
              >
                <Icon name="bag" />
                <strong>{x(lang, trip.stops.length ? 'resume' : 'wizard')}</strong>
                <span>{trip.name || x(lang, 'localOnly')}</span>
                <Icon name="arrow" size={16} />
              </button>
            </section>
            <div className="search-shell">
              <form
                className="adventure-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  explore();
                }}
              >
                <label className="search-destination">
                  <Icon name="pin" size={23} />
                  <span>
                    <span className="search-label">{t('WHERE TO?', 'อยากไปที่ไหน?')}</span>
                    <input
                      aria-label={t('Search destinations', 'ค้นหาจุดหมาย')}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={t(
                        'A state, a city, a little inspiration…',
                        'ชื่อรัฐ เมือง หรือแรงบันดาลใจ…',
                      )}
                    />
                  </span>
                </label>
                <label className="search-select">
                  <Icon name="compass" size={22} />
                  <span>
                    <span className="search-label">
                      {t('YOUR KIND OF ADVENTURE', 'เที่ยวแบบที่คุณชอบ')}
                    </span>
                    <select
                      aria-label={t('Experience', 'รูปแบบการเที่ยว')}
                      value={interest}
                      onChange={(event) => setInterest(event.target.value as Interest | 'All')}
                    >
                      <option value="All">{t('A little of everything', 'ลองทุกประสบการณ์')}</option>
                      {(Object.keys(INTEREST_LABELS) as Interest[]).map((key) => (
                        <option key={key} value={key}>
                          {local(INTEREST_LABELS[key], lang)}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
                <label className="search-select search-season">
                  <Icon name="sun" size={22} />
                  <span>
                    <span className="search-label">
                      {t('WHEN ARE YOU GOING?', 'อยากเดินทางช่วงไหน?')}
                    </span>
                    <select
                      aria-label={t('Season', 'ฤดูกาล')}
                      value={season}
                      onChange={(event) => setSeason(event.target.value as Season | 'All')}
                    >
                      <option value="All">
                        {t('Any time is a good time', 'ทุกช่วงเวลามีสิ่งดี ๆ')}
                      </option>
                      {(Object.keys(SEASON_LABELS) as Season[]).map((key) => (
                        <option key={key} value={key}>
                          {local(SEASON_LABELS[key], lang)}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
                <button type="submit" className="button button-red search-submit">
                  <Icon name="search" size={19} />
                  {t('Let’s explore', 'ออกไปสำรวจ')}
                </button>
              </form>
              <div className="search-caption">
                <span>
                  {t(
                    'YOUR NEXT “I’VE ALWAYS WANTED TO GO THERE” STARTS HERE.',
                    'จุดหมายที่คุณเคยบอกว่า “อยากไปสักครั้ง” เริ่มต้นที่นี่',
                  )}
                </span>
                <span>
                  <Icon name="compass" size={13} />
                  {t(
                    'Thoughtfully curated. Freely explored.',
                    'คัดสรรด้วยความตั้งใจ ออกไปเที่ยวได้ในแบบคุณ',
                  )}
                </span>
              </div>
            </div>
            <section id="destinations" className="destinations section-shell section-anchor">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    <span className="red-dot" />
                    {t('SO MANY PLACES. SO MANY POSSIBILITIES.', 'หลายจุดหมาย หลากความเป็นไปได้')}
                  </span>
                  <h2>
                    {t('Where will you', 'ทริปต่อไป')} <em>{t('go next?', 'จะไปที่ไหนดี?')}</em>
                  </h2>
                  <p>
                    {t(
                      'Iconic for a reason. Unexpected in the best way. Find a state that speaks to you.',
                      'ทั้งสถานที่ในฝันและมุมที่คาดไม่ถึง ค้นพบรัฐที่ตรงกับสไตล์ของคุณ',
                    )}
                  </p>
                </div>
                <a className="text-link heading-link" href="#map">
                  {t('See the whole picture', 'ดูภาพรวมทั้งประเทศ')}
                  <Icon name="arrow" size={18} />
                </a>
              </div>
              <div className="destination-controls">
                <div
                  className="interest-tabs"
                  aria-label={t('Filter by experience', 'กรองตามประสบการณ์')}
                >
                  <button
                    className={interest === 'All' ? 'active' : ''}
                    aria-pressed={interest === 'All'}
                    onClick={() => setInterest('All')}
                  >
                    <Icon name="compass" size={16} />
                    {t('All experiences', 'ทุกประสบการณ์')}
                  </button>
                  {(Object.keys(INTEREST_LABELS) as Interest[]).map((key) => (
                    <button
                      key={key}
                      className={interest === key ? 'active' : ''}
                      aria-pressed={interest === key}
                      onClick={() => setInterest(key)}
                    >
                      <Icon name={interestIcons[key]} size={16} />
                      {local(INTEREST_LABELS[key], lang)}
                    </button>
                  ))}
                </div>
                <label className="region-filter">
                  <Icon name="map" size={15} />
                  <select
                    aria-label={t('Filter by region', 'กรองตามภูมิภาค')}
                    value={region}
                    onChange={(event) => setRegion(event.target.value as Region | 'All')}
                  >
                    <option value="All">{t('All regions', 'ทุกภูมิภาค')}</option>
                    {(Object.keys(REGION_LABELS) as Region[]).map((key) => (
                      <option key={key} value={key}>
                        {local(REGION_LABELS[key], lang)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="discovery-view-bar">
                <div className="segmented">
                  <button aria-pressed={!placeView} onClick={() => setPlaceView(false)}>
                    {x(lang, 'states')}
                  </button>
                  <button aria-pressed={placeView} onClick={() => setPlaceView(true)}>
                    {x(lang, 'places')} · 150
                  </button>
                </div>
                <button className="text-link" onClick={() => setWizardOpen(true)}>
                  {x(lang, 'wizard')}
                  <Icon name="arrow" size={16} />
                </button>
              </div>
              {hasFilters && (
                <div className="active-filters">
                  <span>
                    {t('Exploring', 'กำลังค้นหา')}: {query.trim() && `“${query.trim()}” `}
                    {season !== 'All' && local(SEASON_LABELS[season], lang)}
                  </span>
                  <button onClick={resetFilters}>
                    {t('Reset filters', 'ล้างตัวกรอง')}
                    <Icon name="close" size={13} />
                  </button>
                </div>
              )}
              {placeView && (
                <Suspense fallback={<p role="status">{t('Loading…', 'กำลังโหลด…')}</p>}>
                  <PlaceDiscovery
                    lang={lang}
                    query={query}
                    region={region}
                    interest={interest}
                    season={season}
                    collections={collections}
                    onOpen={openDestination}
                    onAdd={addPlace}
                    onCompare={(id) => {
                      if (!comparison.includes(id) && comparison.length < 3)
                        setComparison([...comparison, id]);
                      setComparing(true);
                    }}
                  />
                </Suspense>
              )}
              <div hidden={placeView}>
                <div className="destination-grid">
                  {visible.map((state) => (
                    <StateCard
                      key={state.code}
                      state={state}
                      lang={lang}
                      saved={favorites.includes(state.code)}
                      onSave={() => saveState(state)}
                      onSelect={() => setModal({ type: 'state', state })}
                      onOpen={() => openDestination(state)}
                    />
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div className="empty-results">
                    <Icon name="compass" size={40} />
                    <h3>{t('A little detour?', 'ลองเปลี่ยนเส้นทางค้นหา')}</h3>
                    <p>
                      {t(
                        'No states match this combination. Try another place, season, or experience.',
                        'ยังไม่มีรัฐที่ตรงกับตัวกรองนี้ ลองชื่อสถานที่ ฤดูกาล หรือประสบการณ์อื่น',
                      )}
                    </p>
                    <button className="button button-navy" onClick={resetFilters}>
                      {t('Show all destinations', 'ดูจุดหมายทั้งหมด')}
                    </button>
                  </div>
                )}
                <div className="destination-footer">
                  <span aria-live="polite">
                    {visible.length} {t('of', 'จาก')} {filtered.length}{' '}
                    {t('state guides', 'คู่มือรัฐ')}
                  </span>
                  {filtered.length > (hasFilters ? 8 : 4) && (
                    <button
                      className="button button-outline"
                      onClick={() => setShowAll((value) => !value)}
                    >
                      {showAll
                        ? t('Show fewer places', 'แสดงน้อยลง')
                        : hasFilters
                          ? t('Explore all {count} matches', 'ดูทั้ง {count} รัฐที่พบ', {
                              count: filtered.length,
                            })
                          : t('Explore all 50 states', 'สำรวจครบ 50 รัฐ')}
                      <Icon name={showAll ? 'minus' : 'arrow'} size={17} />
                    </button>
                  )}
                  <select
                    aria-label={t('Sort destinations', 'เรียงลำดับจุดหมาย')}
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    <option value="curated">{t('Curated picks', 'ลำดับแนะนำ')}</option>
                    <option value="az">{t('Name: A to Z', 'ชื่อตาม A–Z')}</option>
                  </select>
                </div>
              </div>
            </section>
            <div className="adventure-ribbon" aria-hidden="true">
              <span>TAKE THE LONG WAY HOME</span>
              <span>✦</span>
              <span>COLLECT MOMENTS, NOT MILES</span>
              <span>✦</span>
              <span>STAY A LITTLE CURIOUS</span>
              <span>✦</span>
              <span>TAKE THE LONG WAY HOME</span>
            </div>
            <Atlas
              lang={lang}
              motion={motion}
              tripCodes={trip.stops.map((s) => s.code)}
              onSelect={(state) => setModal({ type: 'state', state })}
            />
            <RoadTrips lang={lang} onRoute={(id) => setModal({ type: 'route', id })} />
            <PlannerBanner
              lang={lang}
              hasTrip={trip.stops.length > 0}
              onPlan={() => setModal({ type: 'trip' })}
            />
            <FieldNotes lang={lang} onGuide={(id) => setModal({ type: 'guide', id })} />
          </main>
        )}
      </Suspense>
      <Footer
        lang={lang}
        motion={motion}
        onPlan={() => setModal({ type: 'trip' })}
        onSaved={() => setModal({ type: 'saved' })}
        onAbout={() => setModal({ type: 'about' })}
      />
      {modal && modal.type !== 'trip' && (
        <Suspense
          fallback={
            <p className="floating-loading" role="status">
              {t('Loading…', 'กำลังโหลด…')}
            </p>
          }
        >
          <TravelDialog
            modal={modal}
            onLanguageChange={setLang}
            setModal={setModal}
            lang={lang}
            trip={trip}
            setTrip={setTrip}
            favorites={favorites}
            onSave={saveState}
            onAdd={addState}
            onExplore={explore}
            onOpenDestination={openDestination}
            storageFailed={storageFailed}
            notify={notify}
            toast={toast}
            onCreateTrip={createTrip}
            collections={collections}
          />
        </Suspense>
      )}
      {(libraryOpen || wizardOpen) && (
        <Suspense
          fallback={
            <p className="floating-loading" role="status">
              {t('Loading…', 'กำลังโหลด…')}
            </p>
          }
        >
          {libraryOpen && (
            <TripLibrary
              library={library}
              collections={{ groups: collections.groups, visited: collections.visited }}
              favorites={favorites}
              onRestore={(value) => {
                library.applyRestored(value.library);
                collections.restore(value.collections);
                setFavorites(value.favorites);
              }}
              lang={lang}
              notify={notify}
              onClose={() => setLibraryOpen(false)}
              onOpen={() => {
                setLibraryOpen(false);
                setModal({ type: 'trip', daily: true });
              }}
            />
          )}
          {wizardOpen && (
            <TripWizard
              lang={lang}
              onClose={() => setWizardOpen(false)}
              onCreate={createTrip}
              onOpen={(state, index) => {
                setWizardOpen(false);
                openDestination(state, index);
              }}
            />
          )}
        </Suspense>
      )}
      {comparing && (
        <CompareDestinations
          selected={comparison}
          onChange={setComparison}
          lang={lang}
          onClose={() => setComparing(false)}
          onOpen={openDestination}
          onAdd={(state, index) => (index === undefined ? addState(state) : addPlace(state, index))}
        />
      )}
      {pendingPlace && (
        <AddPlaceDialog
          state={pendingPlace.state}
          index={pendingPlace.index}
          days={
            trip.stops.find((s) => s.code === pendingPlace.state.code)?.days ??
            pendingPlace.state.days
          }
          lang={lang}
          onClose={() => setPendingPlace(null)}
          onAdd={confirmPlace}
        />
      )}
      <nav className="bottom-nav" aria-label={t('Quick navigation', 'เมนูด่วน')}>
        <button
          aria-current={!modal && activeSection === 'discover' ? 'page' : undefined}
          onClick={() => goSection('destinations')}
        >
          <Icon name="compass" size={21} />
          <span>{t('Discover', 'จุดหมาย')}</span>
        </button>
        <button
          aria-current={!modal && activeSection === 'map' ? 'page' : undefined}
          onClick={() => goSection('map')}
        >
          <Icon name="map" size={21} />
          <span>{t('Map', 'แผนที่')}</span>
        </button>
        <button
          aria-current={modal?.type === 'saved' ? 'page' : undefined}
          onClick={() => setModal({ type: 'saved' })}
        >
          <span className="bottom-nav-icon">
            <Icon name="heart" size={21} />
            {!!favorites.length && <small>{favorites.length}</small>}
          </span>
          <span>{t('Saved', 'บันทึกแล้ว')}</span>
        </button>
        <button
          aria-current={modal?.type === 'trip' ? 'page' : undefined}
          onClick={() => setModal({ type: 'trip', daily: trip.stops.length > 0 })}
        >
          <span className="bottom-nav-icon">
            <Icon name="bag" size={21} />
            {!!trip.stops.length && <small>{trip.stops.length}</small>}
          </span>
          <span>{t('My trip', 'ทริปของฉัน')}</span>
        </button>
      </nav>
      <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            <Icon name="check" size={18} />
            <span>{toast}</span>
            <button
              aria-label={t('Dismiss notification', 'ปิดแจ้งเตือน')}
              onClick={() => setToast('')}
            >
              <Icon name="close" size={15} />
            </button>
          </>
        )}
      </div>
      {trip.stops.length > 0 && !modal && (
        <button className="floating-trip" onClick={() => setModal({ type: 'trip' })}>
          <Icon name="bag" size={18} />
          {t('My trip', 'ทริปของฉัน')}
          <span>
            {tripDays(trip)} {t('days', 'วัน')}
          </span>
          <Icon name="arrow" size={17} />
        </button>
      )}
    </div>
  );
}
