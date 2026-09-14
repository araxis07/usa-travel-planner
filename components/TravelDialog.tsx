import LanguageSelector from './LanguageSelector';
import { statePlaces } from '../data/travel';
import { translate } from '../lib/i18n';
import Dialog from './Dialog';
import StateDetail from './StateDetail';
import StateCard from './StateCard';
import TripPlanner from './TripPlanner';
import Icon, { type IconName } from './Icon';
import { Brand } from './LandingSections';
import { ITINERARIES, itineraryTrip } from '../data/itineraries';
import { x } from '../data/experience-copy';
import PlaceCollections from './PlaceCollections';
import type { PlaceCollections as Collections } from '../lib/collections';
import { activityName } from '../lib/destinations';
import { MORE_GUIDES } from '../data/fieldNotes';
import {
  STATES,
  GUIDES,
  local,
  stateName,
  type StateGuide,
  type Language,
  type Trip,
} from '../data/travel';

export type TravelModal =
  | { type: 'state'; state: StateGuide }
  | { type: 'trip'; daily?: boolean; code?: string }
  | { type: 'saved' }
  | { type: 'guide'; id: string }
  | { type: 'route'; id: string }
  | { type: 'about' };
interface Props {
  modal: TravelModal;
  setModal: (modal: TravelModal | null) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  trip: Trip;
  setTrip: (trip: Trip) => void;
  favorites: string[];
  onSave: (state: StateGuide) => void;
  onAdd: (state: StateGuide) => void;
  onExplore: () => void;
  onOpenDestination: (state: StateGuide, index?: number) => void;
  storageFailed: boolean;
  notify: (message: string) => void;
  toast: string;
  onCreateTrip: (trip: Trip) => void;
  collections: Collections;
}
export default function TravelDialog({
  modal,
  setModal,
  lang,
  onLanguageChange,
  trip,
  setTrip,
  favorites,
  onSave,
  onAdd,
  onExplore,
  onOpenDestination,
  storageFailed,
  notify,
  toast,
  onCreateTrip,
  collections,
}: Props) {
  const t = (en: string, th: string, values?: Record<string, string | number>) =>
    translate(en, th, lang, values);
  const guide =
    modal.type === 'guide'
      ? [...GUIDES, ...MORE_GUIDES].find((item) => item.id === modal.id)
      : null;
  const route = modal.type === 'route' ? ITINERARIES.find((item) => item.id === modal.id) : null;
  const template = route ? itineraryTrip(route, lang) : null;
  const title =
    modal.type === 'state'
      ? stateName(modal.state, lang)
      : modal.type === 'trip'
        ? t('My trip planner', 'แผนทริปของฉัน')
        : modal.type === 'saved'
          ? t('Saved places', 'สถานที่โปรด')
          : guide
            ? local(guide.title, lang)
            : route
              ? local(route.title, lang)
              : t('About Roam', 'เกี่ยวกับ Roam');
  return (
    <Dialog
      key={modal.type}
      title={title}
      onClose={() => setModal(null)}
      wide={modal.type === 'saved' || modal.type === 'trip'}
      closeLabel={t('Close', 'ปิด')}
    >
      <div className="dialog-language">
        <LanguageSelector lang={lang} onChange={onLanguageChange} />
      </div>
      {modal.type === 'state' && (
        <StateDetail
          state={modal.state}
          lang={lang}
          saved={favorites.includes(modal.state.code)}
          inTrip={trip.stops.some((stop) => stop.code === modal.state.code)}
          onSave={() => onSave(modal.state)}
          onAdd={() => onAdd(modal.state)}
          onOpen={(index) => onOpenDestination(modal.state, index)}
        />
      )}
      {modal.type === 'trip' && (
        <TripPlanner
          trip={trip}
          setTrip={setTrip}
          lang={lang}
          onExplore={onExplore}
          storageFailed={storageFailed}
          notify={notify}
          initialDaily={modal.daily}
          initialCode={modal.code}
        />
      )}
      {modal.type === 'saved' && (
        <div className="saved-content">
          <span className="eyebrow">
            <span className="red-dot" />
            {t('YOUR SOMEDAY LIST', 'รายการที่อยากไปสักวัน')}
          </span>
          <h2>
            {t('Places to', 'จุดหมายที่')} <em>{t('fall for.', 'ตกหลุมรัก')}</em>
          </h2>
          <p>
            {t(
              'A little collection of places calling your name.',
              'เก็บสถานที่ที่ชอบ รอวันออกเดินทาง',
            )}
          </p>
          <PlaceCollections collections={collections} lang={lang} onOpen={onOpenDestination} />
          {storageFailed && (
            <p className="storage-warning">
              {t(
                'Browser storage is unavailable. Saved places will be lost when you leave.',
                'เบราว์เซอร์บันทึกข้อมูลไม่ได้ รายการโปรดจะหายเมื่อออกจากหน้านี้',
              )}
            </p>
          )}
          {favorites.length ? (
            <div className="saved-grid">
              {STATES.filter((state) => favorites.includes(state.code)).map((state) => (
                <StateCard
                  key={state.code}
                  state={state}
                  lang={lang}
                  saved
                  onSave={() => onSave(state)}
                  onSelect={() => setModal({ type: 'state', state })}
                  onOpen={() => onOpenDestination(state)}
                />
              ))}
            </div>
          ) : (
            <div className="planner-empty">
              <Icon name="heart" size={40} />
              <h3>{t('Your next favorite is out there.', 'สถานที่โปรดแห่งต่อไปรออยู่')}</h3>
              <p>
                {t(
                  'Tap a heart on any state to keep it here.',
                  'แตะหัวใจบนการ์ดรัฐเพื่อเก็บไว้ที่นี่',
                )}
              </p>
              <button className="button button-red" onClick={onExplore}>
                {t('Find a place to love', 'ค้นหาจุดหมายที่ชอบ')}
                <Icon name="arrow" size={17} />
              </button>
            </div>
          )}
        </div>
      )}
      {guide && (
        <article className="guide-detail">
          <span className="eyebrow">{local(guide.category, lang)}</span>
          <span className="guide-detail-icon">
            <Icon name={guide.icon as IconName} size={38} />
          </span>
          <h2>{local(guide.title, lang)}</h2>
          <p className="guide-intro">{local(guide.intro, lang)}</p>
          {guide.sections.map((section, i) => (
            <section key={i}>
              <span className="guide-section-number">0{i + 1}</span>
              <div>
                <h3>{local(section.title, lang)}</h3>
                <p>{local(section.text, lang)}</p>
              </div>
            </section>
          ))}
          <div className="guide-sources">
            <h3>{t('Keep the official details close', 'ตรวจรายละเอียดจากแหล่งทางการ')}</h3>
            {guide.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                {source.name}
                <Icon name="external" size={14} />
              </a>
            ))}
          </div>
          <button className="button button-navy" onClick={() => setModal({ type: 'trip' })}>
            {t('Put it into a plan', 'เริ่มวางแผนเที่ยว')}
            <Icon name="arrow" size={17} />
          </button>
        </article>
      )}
      {route && (
        <div className="route-detail">
          <div
            className={`route-detail-cover ${route.image ? '' : 'route-autumn'}`}
            style={
              route.image
                ? {
                    backgroundImage: `linear-gradient(0deg,rgba(16,35,42,.8),rgba(16,35,42,.1)),url(/images/${route.image}.jpg)`,
                  }
                : undefined
            }
          >
            <span className="eyebrow">{local(route.label, lang)}</span>
            <h2>{local(route.title, lang)}</h2>
            <p>{local(route.subtitle, lang)}</p>
          </div>
          <div className="detail-content">
            <div className="route-detail-stats">
              <span>
                <Icon name="calendar" size={17} />
                {route.days.reduce((a, b) => a + b, 0)} {t('suggested days', 'วันแนะนำ')}
              </span>
              <span>
                <Icon name="map" size={17} />
                {route.codes.length} {t('states to explore', 'รัฐให้ค้นพบ')}
              </span>
            </div>
            <ol className="route-stop-preview">
              {route.codes.map((code, index) => {
                const state = STATES.find((item) => item.code === code)!;
                return (
                  <li key={code}>
                    <span>0{index + 1}</span>
                    <div>
                      <h3>
                        {stateName(state, lang)}
                        <small>
                          {route.days[index]} {t('days', 'วัน')}
                        </small>
                      </h3>
                      <p>{statePlaces(state, lang).join(' · ')}</p>
                      <p className="route-tip">{local(state.tip, lang)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            {template && (
              <details className="template-schedule" open>
                <summary>{x(lang, 'suggested')}</summary>
                {template.stops.map((stop) => (
                  <section key={stop.code}>
                    <h3>
                      {stateName(
                        STATES.find((s) => s.code === stop.code)!,
                        lang,
                      )}
                    </h3>
                    {Array.from({ length: stop.days }, (_, i) => (
                      <div className="template-day" key={i}>
                        <strong>
                          {t('Day', 'วันที่')} {i + 1}
                        </strong>
                        <ul>
                          {stop.activities
                            ?.filter((a) => a.day === i + 1)
                            .map((a) => (
                              <li key={a.id}>
                                <time>{a.startTime}</time>
                                {activityName(a, lang)}
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </section>
                ))}
              </details>
            )}
            <p className="fine-print">
              {x(lang, 'templateNote')} {x(lang, 'preserveTrip')}
            </p>
            {template && (
              <button className="button button-navy" onClick={() => onCreateTrip(template)}>
                {x(lang, 'usePlan')}
              </button>
            )}
            <button
              className="button button-red"
              onClick={() => {
                const newStops = template!.stops.filter(
                  (candidate) => !trip.stops.some((stop) => stop.code === candidate.code),
                );
                if (
                  trip.stops.reduce((n, s) => n + (s.activities?.length ?? 0), 0) +
                    newStops.reduce((n, s) => n + (s.activities?.length ?? 0), 0) >
                  200
                ) {
                  notify(
                    t(
                      'A trip can hold up to 200 activities.',
                      'หนึ่งทริปเพิ่มกิจกรรมได้สูงสุด 200 รายการ',
                    ),
                  );
                  return;
                }
                setTrip({
                  ...trip,
                  name: trip.name || local(route.title, lang),
                  stops: [...trip.stops, ...newStops],
                });
                setModal({ type: 'trip' });
                notify(
                  newStops.length
                    ? t(
                        'Route added. Make it your own!',
                        'เพิ่มเส้นทางแล้ว ปรับเป็นทริปของคุณได้เลย',
                      )
                    : t(
                        'These states are already in your trip.',
                        'รัฐเหล่านี้อยู่ในทริปของคุณแล้ว',
                      ),
                );
              }}
            >
              <Icon name="plus" size={18} />
              {t('Make this my adventure', 'เพิ่มเส้นทางนี้ในทริป')}
            </button>
          </div>
        </div>
      )}
      {modal.type === 'about' && (
        <div className="about-content">
          <Brand />
          <h2>
            {t('A big country.', 'ประเทศกว้างใหญ่')}
            <br />
            <em>{t('A little more connection.', 'ที่มีเรื่องราวให้ค้นพบ')}</em>
          </h2>
          <p>
            {t(
              'Roam America is an independent travel inspiration and planning project for discovering all 50 U.S. states. Our guides are starting points for your own research, with links to official tourism and park information.',
              'Roam America เป็นโปรเจกต์อิสระสำหรับค้นหาแรงบันดาลใจและวางแผนเที่ยวครบ 50 รัฐ คู่มือเป็นข้อมูลเริ่มต้นสำหรับค้นคว้าต่อ พร้อมลิงก์หน่วยงานท่องเที่ยวและอุทยานทางการ',
            )}
          </p>
          <h3>{t('Your trip stays with you', 'แผนทริปอยู่กับคุณ')}</h3>
          <p>
            {t(
              'Favorites, language, and itinerary are stored in this browser’s local storage. There is no account or cloud sync. Export a backup to move your trip to another browser or device. Clearing browser data removes saved plans.',
              'รายการโปรด ภาษา และแผนทริปบันทึกในเบราว์เซอร์นี้ ไม่มีบัญชีหรือซิงก์คลาวด์ ส่งออกไฟล์สำรองเพื่อย้ายไปเบราว์เซอร์หรือเครื่องอื่น การล้างข้อมูลเบราว์เซอร์จะลบแผนที่บันทึกไว้',
            )}
          </p>
          <h3>{t('Made with care', 'ใส่ใจในทุกรายละเอียด')}</h3>
          <p>
            {t(
              'Destination photographs from Unsplash and Wikimedia Commons, with individual author and license credits. State map geometry from US Atlas. Roam is not affiliated with U.S. tourism agencies and does not sell travel bookings.',
              'ภาพสถานที่จาก Unsplash และ Wikimedia Commons พร้อมเครดิตผู้ถ่ายและสิทธิ์ใช้งานรายภาพ ข้อมูลรูปร่างรัฐจาก US Atlas โดย Roam ไม่ได้สังกัดหน่วยงานท่องเที่ยวสหรัฐฯ และไม่ได้ขายบริการจองท่องเที่ยว',
            )}
          </p>
          <a className="text-link" href="/credits.txt" target="_blank" rel="noreferrer">
            {t('Sources & image credits', 'แหล่งข้อมูลและเครดิตภาพ')}
            <Icon name="external" size={15} />
          </a>
        </div>
      )}
      {toast && (
        <div className="dialog-toast" role="status" aria-live="polite">
          <Icon name="check" size={16} />
          {toast}
        </div>
      )}
    </Dialog>
  );
}
