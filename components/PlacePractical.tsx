import { useEffect, useState } from 'react';
import { local, type PlaceProfile, type Language } from '../data/travel';
import { translate, LOCALES } from '../lib/i18n';
import { x } from '../data/experience-copy';
interface Park {
  id: string;
  url: string;
  name: string;
  directions: string;
  directionsUrl: string;
  fees: { title: string; cost: string; description: string }[];
  hours: { name: string; description: string }[];
  alerts: { id: string; title: string; category: string; description: string; url: string }[];
}
interface Snapshot {
  checkedAt: string;
  parks: Park[];
}
let snapshot: Promise<Snapshot> | null = null;
const secure = (url: string, fallback: string) => (/^https:\/\/[^/]+\//.test(url) ? url : fallback);
export default function PlacePractical({
  profile,
  lang,
  overviewShown = false,
}: {
  profile: PlaceProfile;
  lang: Language;
  overviewShown?: boolean;
}) {
  const t = (en: string, th: string) => translate(en, th, lang);
  const [facts, setFacts] = useState<Snapshot | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    snapshot ??= fetch('/data/parks.json')
      .then(async (r) => {
        if (!r.ok) throw Error();
        const value = await r.json();
        if (!Array.isArray(value.parks) || !Number.isFinite(Date.parse(value.checkedAt)))
          throw Error();
        return value;
      })
      .catch((error) => {
        snapshot = null;
        throw error;
      });
    void snapshot
      .then((value) => {
        if (active) setFacts(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const park = facts?.parks.find((p) => p.id === profile.id);
  const stale = facts ? Date.now() - Date.parse(facts.checkedAt) > 7 * 86400000 : false;
  const date = (value: string) =>
    new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'medium', timeZone: 'UTC' }).format(
      new Date(value),
    );
  return (
    <section className="place-practical" id="guide-practical">
      <h3>{t('Plan the practical details', 'วางแผนรายละเอียดที่จำเป็น')}</h3>
      {!overviewShown && profile.advisory && (
        <aside className="day-warning">
          <p>{local(profile.advisory.text, lang)}</p>
          <a href={profile.advisory.source} target="_blank" rel="noreferrer">
            {t('Official visitor information', 'ข้อมูลจากหน่วยงานท่องเที่ยว')} ·{' '}
            {date(profile.advisory.checkedAt)}
          </a>
        </aside>
      )}
      <dl className="practical-grid">
        <div>
          <dt>{t('Getting around', 'การเดินทางในพื้นที่')}</dt>
          <dd>{local(profile.access, lang)}</dd>
        </div>
        <div>
          <dt>{t('Where to look for a stay', 'บริเวณที่พักให้ลองสำรวจ')}</dt>
          <dd>{local(profile.stay, lang)}</dd>
        </div>
      </dl>
      <div className="practical-links">
        <a
          className="button button-outline"
          href={profile.officialUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t('Official visitor information', 'ข้อมูลจากหน่วยงานท่องเที่ยว')}
        </a>
        {profile.bookingUrl && (
          <a className="text-link" href={profile.bookingUrl} target="_blank" rel="noreferrer">
            {t('Fees & reservations', 'ค่าธรรมเนียมและการจอง')}
          </a>
        )}
      </div>
      <details className="guide-details">
        <summary>{x(lang, 'guideDetails')}</summary>
        {profile.planning && (
          <div className="place-planning-facts">
            {!overviewShown && (
              <div>
                <span>{x(lang, 'transport')}</span>
                <strong>{x(lang, profile.planning.transport)}</strong>
              </div>
            )}
            <div>
              <span>{x(lang, 'walking')}</span>
              <strong>{x(lang, profile.planning.walking)}</strong>
            </div>
            <div>
              <span>{x(lang, 'setting')}</span>
              <strong>{x(lang, profile.planning.setting)}</strong>
            </div>
            {!overviewShown && (
              <div>
                <span>{x(lang, 'months')}</span>
                <strong>
                  {profile.planning.months
                    .map((m) =>
                      new Intl.DateTimeFormat(LOCALES[lang], { month: 'short' }).format(
                        new Date(2026, m - 1, 1),
                      ),
                    )
                    .join(' · ')}
                </strong>
              </div>
            )}
          </div>
        )}
        <p className="fine-print">{x(lang, 'editorial')}</p>
        <p className="fine-print">{x(lang, 'accessNote')}</p>
        <dl className="practical-reference">
          {!overviewShown && (
            <div>
              <dt>{t('Suggested time', 'เวลาแนะนำ')}</dt>
              <dd>
                {profile.visitMinutes} {t('minutes', 'นาที')}
                <small>
                  {t(
                    'An editorial starting point; adjust for your activities.',
                    'แนวทางจากผู้จัดทำ ปรับตามกิจกรรมที่เลือก',
                  )}
                </small>
              </dd>
            </div>
          )}
          <div>
            <dt>
              {profile.locationKind === 'area'
                ? t('Area reference', 'ตำแหน่งพื้นที่โดยประมาณ')
                : profile.locationKind === 'visitor-center'
                  ? t('Visitor center reference', 'ตำแหน่งศูนย์บริการนักท่องเที่ยว')
                  : t('Entrance / parking', 'ทางเข้า / ที่จอดรถ')}
            </dt>
            <dd>
              {local(profile.locationLabel, lang)}
              <small>{profile.coordinates.map((n) => n.toFixed(5)).join(', ')}</small>
              <a href={profile.locationSource} target="_blank" rel="noreferrer">
                {t('Location reference', 'แหล่งอ้างอิงตำแหน่ง')} · {date(profile.locationCheckedAt)}
              </a>
            </dd>
          </div>
        </dl>
      </details>
      {park && facts ? (
        <div className="park-snapshot">
          <div className="park-snapshot-heading">
            <h4>{t('Official park snapshot', 'ข้อมูลอุทยานจากแหล่งทางการ')}</h4>
            <span>
              {t('Retrieved', 'ดึงข้อมูลเมื่อ')} {date(facts.checkedAt)}
            </span>
          </div>
          <p>
            {t(
              'Official source text is shown in English. This is a saved snapshot, not a live status check.',
              'ข้อความจากแหล่งทางการแสดงเป็นภาษาอังกฤษ นี่คือข้อมูลที่บันทึกไว้ ไม่ใช่การตรวจสถานะสด',
            )}
          </p>
          {stale && (
            <p className="day-warning">
              {t(
                'This snapshot is over 7 days old. Check the official site for current conditions.',
                'ข้อมูลชุดนี้เก่ากว่า 7 วัน ตรวจสภาพล่าสุดที่เว็บไซต์ทางการ',
              )}
            </p>
          )}
          <details>
            <summary>{t('Hours & access', 'เวลาเปิดและการเข้าถึง')}</summary>
            <div lang="en">
              {park.hours.map((h, i) => (
                <section key={i}>
                  <h5>{h.name}</h5>
                  <p>{h.description}</p>
                </section>
              ))}
              <p>{park.directions}</p>
            </div>
            <a href={secure(park.directionsUrl, park.url)} target="_blank" rel="noreferrer">
              {t('Confirm access with the park', 'ตรวจการเข้าถึงกับอุทยาน')}
            </a>
          </details>
          <details>
            <summary>{t('Entrance fees', 'ค่าธรรมเนียมเข้าชม')}</summary>
            <p>
              {t(
                'Fees may depend on residency, age, vehicle and passes. Read the full conditions; these are not a total trip price.',
                'ค่าธรรมเนียมอาจขึ้นกับถิ่นพำนัก อายุ ยานพาหนะ และบัตรผ่าน อ่านเงื่อนไขทั้งหมด ตัวเลขนี้ไม่ใช่ราคารวมทริป',
              )}
            </p>
            <dl lang="en">
              {park.fees.map((f, i) => (
                <div key={i}>
                  <dt>
                    {f.title} · USD {f.cost}
                  </dt>
                  <dd>{f.description}</dd>
                </div>
              ))}
            </dl>
            {!park.fees.length && (
              <p>
                {t(
                  'No fee details were supplied in this snapshot. Check with the park.',
                  'ข้อมูลชุดนี้ไม่มีรายละเอียดค่าธรรมเนียม กรุณาตรวจกับอุทยาน',
                )}
              </p>
            )}
            <a
              href="https://www.nps.gov/aboutus/nonresident-fees.htm"
              target="_blank"
              rel="noreferrer"
            >
              {t(
                'NPS nonresident fee information',
                'ข้อมูลค่าธรรมเนียม NPS สำหรับผู้ไม่มีถิ่นพำนักในสหรัฐฯ',
              )}
            </a>
          </details>
          <details>
            <summary>
              {t('Alerts & closures', 'ประกาศและการปิดพื้นที่')} · {park.alerts.length}
            </summary>
            {park.alerts.length ? (
              park.alerts.map((a) => (
                <article key={a.id} lang="en">
                  <span>{a.category}</span>
                  <h5>{a.title}</h5>
                  <p>{a.description}</p>
                  <a href={secure(a.url, park.url)} target="_blank" rel="noreferrer">
                    {t('Official notice', 'ประกาศทางการ')}
                  </a>
                </article>
              ))
            ) : (
              <p>
                {t(
                  'No alerts were returned in this snapshot. This does not confirm that every road or facility is open.',
                  'ไม่มีประกาศในข้อมูลชุดนี้ แต่ไม่ได้ยืนยันว่าถนนหรือสิ่งอำนวยความสะดวกทุกจุดเปิดอยู่',
                )}
              </p>
            )}
          </details>
        </div>
      ) : (
        <p className="fine-print">
          {failed
            ? t(
                'Park updates could not load. Use the official visitor link above.',
                'โหลดข้อมูลอุทยานไม่ได้ ใช้ลิงก์ทางการด้านบน',
              )
            : t(
                'Confirm opening hours, admission and any required reservations with each venue before departure.',
                'ตรวจเวลาเปิด ค่าเข้าชม และการจองที่จำเป็นกับแต่ละแห่งก่อนเดินทาง',
              )}
        </p>
      )}
      <p className="content-attribution">
        {t(
          'Adapted from Wikipedia contributors and Roam editorial notes.',
          'เรียบเรียงจากผู้เขียนวิกิพีเดียและคำแนะนำของ Roam',
        )}{' '}
        <a
          href={profile.summarySources[['en', 'th', 'zh', 'ja', 'ko'].indexOf(lang)]}
          target="_blank"
          rel="noreferrer"
        >
          {t('Read the source', 'อ่านต้นฉบับ')}
        </a>{' '}
        ·{' '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">
          {profile.summaryLicense}
        </a>{' '}
        · {t('Reviewed', 'ตรวจข้อมูลเมื่อ')} {date(profile.reviewedAt)}
      </p>
    </section>
  );
}
