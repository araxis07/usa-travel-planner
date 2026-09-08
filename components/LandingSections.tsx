import Icon, { type IconName } from './Icon';
import { ROUTES, GUIDES, local, type Language } from '../data/travel';

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a href="#" className={`brand ${footer ? 'brand-light' : ''}`} aria-label="Roam America home">
      <span className="brand-symbol">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M20 0 24 15 40 20 25 24 20 40 16 25 0 20 15 16Z" fill="currentColor" />
          <path d="m20 10 2 8 8 2-8 2-2 8-2-8-8-2 8-2Z" fill={footer ? '#162e3c' : '#fbf9f5'} />
        </svg>
      </span>
      <span>
        roam<span className="brand-period">.</span>
        <small>AMERICA, YOUR WAY</small>
      </span>
    </a>
  );
}

export function RoadTrips({ lang, onRoute }: { lang: Language; onRoute: (id: string) => void }) {
  const t = (en: string, th: string) => (lang === 'th' ? th : en);
  return (
    <section id="road-trips" className="road-trips section-shell section-anchor">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <span className="red-dot" />
            {t('THE JOURNEY IS HALF THE STORY', 'ระหว่างทางคือครึ่งหนึ่งของเรื่องราว')}
          </span>
          <h2>
            {t('Good roads.', 'ถนนดี ๆ')} <em>{t('Great stories.', 'เรื่องราวดี ๆ')}</em>
          </h2>
          <p>
            {t(
              'A few thoughtfully chosen routes. A whole lot of freedom to make them your own.',
              'เส้นทางที่คัดสรรเป็นจุดเริ่มต้น พร้อมอิสระให้ปรับเป็นการเดินทางของคุณ',
            )}
          </p>
        </div>
        <span className="roadtrip-handwriting">
          {t('Windows down. Wonder up.', 'เปิดหน้าต่างรับโลกกว้าง')}
          <svg viewBox="0 0 90 40" aria-hidden="true">
            <path d="M2 3c5 35 60 15 72 26m-12-1 13 3-3-12" />
          </svg>
        </span>
      </div>
      <div className="route-grid">
        {ROUTES.map((item, index) => (
          <button
            key={item.id}
            className={`route-card route-card-${index}`}
            onClick={() => onRoute(item.id)}
          >
            {item.image && <img src={`/images/${item.image}.jpg`} alt="" loading="lazy" />}
            {!item.image && (
              <div className="autumn-art" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <svg viewBox="0 0 400 320">
                  <path d="M170 330C360 210 25 190 235 10" />
                </svg>
              </div>
            )}
            <span className="route-days">
              <Icon name="clock" size={14} />
              {item.days.reduce((a, b) => a + b, 0)} {t('days', 'วัน')}
            </span>
            <div className="route-card-content">
              <span className="eyebrow">{local(item.label, lang)}</span>
              <h3>{local(item.title, lang)}</h3>
              <p>{item.codes.join(' → ')}</p>
              <span className="route-explore">
                {t('Take this route', 'ดูเส้นทางนี้')}
                <span>
                  <Icon name="arrow" size={17} />
                </span>
              </span>
            </div>
          </button>
        ))}
      </div>
      <p className="routes-footnote">
        <Icon name="route" size={15} />
        {t(
          'Starting points for your itinerary. Adjust the days, pick your stops, and check current road conditions.',
          'ใช้เป็นจุดเริ่มต้น ปรับวัน เลือกเมืองที่จะแวะ และตรวจสภาพถนนปัจจุบันก่อนเดินทาง',
        )}
      </p>
    </section>
  );
}

export function PlannerBanner({
  lang,
  hasTrip,
  onPlan,
}: {
  lang: Language;
  hasTrip: boolean;
  onPlan: () => void;
}) {
  const t = (en: string, th: string) => (lang === 'th' ? th : en);
  return (
    <section className="planner-banner section-shell">
      <div className="planner-banner-inner">
        <div className="passport-scene" aria-hidden="true">
          <div className="ticket">
            <span>BOARDING PASS</span>
            <strong>
              YOU <small>✈</small> USA
            </strong>
            <div>DESTINATION: YOUR NEXT ADVENTURE</div>
            <div className="ticket-barcode" />
          </div>
          <div className="passport">
            <span>THE AMERICAN</span>
            <strong>
              adventure
              <br />
              passport
            </strong>
            <Icon name="globe" size={58} />
            <small>FIFTY STATES. YOUR STORY.</small>
            <span className="passport-roam">roam.</span>
          </div>
          <div className="passport-sticker">
            LET’S
            <br />
            GET
            <br />
            <em>lost.</em>
          </div>
        </div>
        <div className="planner-banner-copy">
          <span className="eyebrow">
            {t('LESS PLANNING. MORE POSSIBILITY.', 'วางแผนง่ายขึ้น ออกเที่ยวได้มากขึ้น')}
          </span>
          <h2>
            {t('Your someday trip.', 'ทริปที่ฝันไว้')}
            <br />
            <em>{t('Let’s make it a plan.', 'ถึงเวลาออกเดินทาง')}</em>
          </h2>
          <p>
            {t(
              'Save the places you love. Connect the dots. Build a little adventure that feels a lot like you.',
              'บันทึกสถานที่ที่ชอบ เชื่อมจุดหมายเข้าด้วยกัน แล้วสร้างการเดินทางในแบบที่เป็นคุณ',
            )}
          </p>
          <button className="button button-cream" onClick={onPlan}>
            {hasTrip
              ? t('Continue my trip', 'วางแผนทริปต่อ')
              : t('Start planning — it’s free', 'เริ่มวางแผนได้ฟรี')}
            <Icon name="arrow" size={18} />
          </button>
          <span className="no-signup">
            <Icon name="check" size={13} />
            {t(
              'No account needed. Just a sense of adventure.',
              'ไม่ต้องสมัครสมาชิก แค่มีใจอยากเดินทาง',
            )}
          </span>
        </div>
        <span className="banner-star star-one" aria-hidden="true">
          ✦
        </span>
        <span className="banner-star star-two" aria-hidden="true">
          ✦
        </span>
      </div>
    </section>
  );
}

export function FieldNotes({ lang, onGuide }: { lang: Language; onGuide: (id: string) => void }) {
  const t = (en: string, th: string) => (lang === 'th' ? th : en);
  return (
    <>
      <section id="guides" className="guides section-shell section-anchor">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              <span className="red-dot" />
              {t('A FEW NOTES FOR THE ROAD', 'เกร็ดเล็กน้อยก่อนออกเดินทาง')}
            </span>
            <h2>
              {t('A little insight.', 'เตรียมรู้อีกนิด')}{' '}
              <em>{t('A better adventure.', 'เที่ยวได้ดีขึ้น')}</em>
            </h2>
          </div>
          <span className="guide-label">
            <Icon name="book" size={17} />
            {t('The Roam field notes', 'บันทึกนักเดินทาง Roam')}
          </span>
        </div>
        <div className="guide-grid">
          {GUIDES.map((item, index) => (
            <button className="guide-card" key={item.id} onClick={() => onGuide(item.id)}>
              <div className={`guide-illustration guide-illustration-${index}`}>
                <Icon name={item.icon as IconName} size={54} />
                <span className="guide-number">0{index + 1}</span>
                <span className="guide-doodle" aria-hidden="true">
                  ✦
                </span>
              </div>
              <span className="eyebrow">{local(item.category, lang)}</span>
              <h3>{local(item.title, lang)}</h3>
              <span className="text-link">
                {t('Read the field note', 'อ่านคู่มือ')}
                <Icon name="arrow" size={16} />
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="closing-note section-shell">
        <span className="closing-star" aria-hidden="true">
          ✦
        </span>
        <p>
          {t('The best stories rarely start with', 'เรื่องราวดี ๆ มักเริ่มต้นเมื่อ')}
          <br />
          <em>{t('“I stayed home.”', 'เราออกไปพบโลกกว้าง')}</em>
        </p>
        <a href="#destinations" className="text-link">
          {t('Go find yours.', 'ออกไปค้นหาเรื่องราวของคุณ')}
          <Icon name="arrow" size={18} />
        </a>
      </section>
    </>
  );
}

export function Footer({
  lang,
  motion,
  onPlan,
  onSaved,
  onAbout,
}: {
  lang: Language;
  motion: boolean;
  onPlan: () => void;
  onSaved: () => void;
  onAbout: () => void;
}) {
  const t = (en: string, th: string) => (lang === 'th' ? th : en);
  return (
    <footer className="footer">
      <div className="section-shell">
        <div className="footer-top">
          <div>
            <Brand footer />
            <p>
              {t(
                'For the places. For the people. For the feeling of being somewhere new.',
                'เพื่อสถานที่ ผู้คน และความรู้สึกดี ๆ เมื่อได้ค้นพบสิ่งใหม่',
              )}
            </p>
            <span className="footer-flag">
              <span className="little-flag" />
              {t('Made for your American adventure.', 'เพื่อการเดินทางในอเมริกาของคุณ')}
            </span>
          </div>
          <div className="footer-links">
            <span>{t('GO SOMEWHERE', 'ออกเดินทาง')}</span>
            <a href="#destinations">{t('Discover destinations', 'ค้นหาจุดหมาย')}</a>
            <a href="#map">{t('Explore the map', 'สำรวจแผนที่')}</a>
            <a href="#road-trips">{t('Road trips', 'โรดทริป')}</a>
          </div>
          <div className="footer-links">
            <span>{t('MAKE IT HAPPEN', 'เริ่มต้นได้เลย')}</span>
            <button onClick={onPlan}>{t('My trip planner', 'แผนทริปของฉัน')}</button>
            <button onClick={onSaved}>{t('Saved places', 'สถานที่โปรด')}</button>
            <a href="#guides">{t('Travel field notes', 'คู่มือท่องเที่ยว')}</a>
          </div>
          <div className="footer-links">
            <span>{t('A LITTLE ABOUT US', 'รู้จักเราอีกนิด')}</span>
            <button onClick={onAbout}>{t('About Roam', 'เกี่ยวกับ Roam')}</button>
            <a href="https://www.visittheusa.com/" target="_blank" rel="noreferrer">
              Visit The USA <Icon name="external" size={12} />
            </a>
            <a href="https://www.nps.gov/planyourvisit/index.htm" target="_blank" rel="noreferrer">
              National Park Service <Icon name="external" size={12} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Roam America.{' '}
            {t('Stay curious. Travel thoughtfully.', 'เที่ยวด้วยความใส่ใจ และเปิดรับสิ่งใหม่')}
          </span>
          <span>
            {t(
              'Independent travel inspiration · English / ไทย',
              'แรงบันดาลใจท่องเที่ยวอิสระ · ไทย / English',
            )}
          </span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'instant' })}
          >
            {t('Back to top', 'กลับด้านบน')}
            <Icon name="arrow-up" size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
}
