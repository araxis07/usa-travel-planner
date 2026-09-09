import LanguageSelector from './components/LanguageSelector';
import { stateName } from './data/travel';
import { translate, initialLanguage } from './lib/i18n';
import { useEffect, useRef, useState } from 'react';
import Atlas from './components/Atlas';
import Icon, { type IconName } from './components/Icon';
import StateCard from './components/StateCard';
import TravelDialog, { type TravelModal } from './components/TravelDialog';
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
  type Trip,
} from './data/travel';
import { loadTrip, readLocal, tripDays, validFavorites } from './lib/storage';
import './styles.css';

const interestIcons: Record<Interest, IconName> = {
  Nature: 'mountain',
  Cities: 'city',
  Coast: 'waves',
  Culture: 'book',
};
export default function App() {
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [favorites, setFavorites] = useState<string[]>(() =>
    readLocal('roam.saved.v1', [], validFavorites),
  );
  const [trip, setTrip] = useState<Trip>(loadTrip);
  const [storageFailed, setStorageFailed] = useState(false);
  const [modal, setModal] = useState<TravelModal | null>(null);
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
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => {
    try {
      localStorage.setItem('roam.saved.v1', JSON.stringify(favorites));
      localStorage.setItem('roam.trip.v1', JSON.stringify(trip));
      localStorage.setItem('roam.language', JSON.stringify(lang));
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }, [favorites, trip, lang]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translate(
      'Roam America — 50 states. Endless possibilities.',
      'Roam America — วางแผนเที่ยวอเมริกาครบ 50 รัฐ',
      lang,
    );
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
  }, [lang]);
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
    setModal(null);
    setMobileNav(false);
    requestAnimationFrame(() =>
      document
        .getElementById('destinations')
        ?.scrollIntoView({ behavior: motion ? 'smooth' : 'instant' }),
    );
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
    <div className="site" data-motion={motion ? 'on' : 'paused'}>
      <a className="skip-link" href="#destinations">
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
          <img
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
                  <path id="stamp-circle" d="M90,90m-65,0a65,65 0 1,1 130,0a65,65 0 1,1-130,0" />
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
          <div className="destination-grid">
            {visible.map((state) => (
              <StateCard
                key={state.code}
                state={state}
                lang={lang}
                saved={favorites.includes(state.code)}
                onSave={() => saveState(state)}
                onSelect={() => setModal({ type: 'state', state })}
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
              {visible.length} {t('of', 'จาก')} {filtered.length} {t('state guides', 'คู่มือรัฐ')}
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
      <Footer
        lang={lang}
        motion={motion}
        onPlan={() => setModal({ type: 'trip' })}
        onSaved={() => setModal({ type: 'saved' })}
        onAbout={() => setModal({ type: 'about' })}
      />
      {modal && (
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
          storageFailed={storageFailed}
          notify={notify}
          toast={toast}
        />
      )}
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
