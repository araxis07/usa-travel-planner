import { useEffect, useState } from 'react';
import { readShare } from '../lib/cloud';
import { type Language, type Trip } from '../data/travel';
import { translate } from '../lib/i18n';
import TripPrint from './TripPrint';
export default function SharedTrip({
  token,
  lang,
  onCopy,
  onBack,
}: {
  token: string;
  lang: Language;
  onCopy: (trip: Trip) => void;
  onBack: () => void;
}) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [retry, setRetry] = useState(0);
  const t = (en: string, th: string) => translate(en, th, lang);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setTrip(null);
    void readShare(token)
      .then((value) => {
        if (active) setTrip(value?.trip ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, retry]);
  return (
    <main className="shared-trip-page container">
      <button className="text-link" onClick={onBack}>
        {t('All destinations', 'จุดหมายทั้งหมด')}
      </button>
      {loading ? (
        <p role="status">{t('Loading…', 'กำลังโหลด…')}</p>
      ) : trip ? (
        <>
          <div className="share-view-banner">
            <span>{t('A shared copy · view only', 'สำเนาที่แชร์ · ดูได้อย่างเดียว')}</span>
            <button className="button button-navy" onClick={() => setConfirm(true)}>
              {t('Use this itinerary', 'ใช้แผนเที่ยวนี้')}
            </button>
          </div>
          {confirm && (
            <div className="confirm-panel">
              <p>
                {t(
                  'Replace the trip on this browser with this saved copy? Export your current trip first if you want to keep it.',
                  'แทนที่ทริปในเบราว์เซอร์ด้วยสำเนานี้หรือไม่? ส่งออกทริปปัจจุบันก่อนหากต้องการเก็บไว้',
                )}
              </p>
              <button className="button button-red" onClick={() => onCopy(trip)}>
                {t('Replace current trip', 'แทนที่ทริปปัจจุบัน')}
              </button>
              <button className="text-link" onClick={() => setConfirm(false)}>
                {t('Cancel', 'ยกเลิก')}
              </button>
            </div>
          )}
          <TripPrint trip={trip} lang={lang} screen />
        </>
      ) : (
        <div className="planner-empty">
          <h1>{t('This trip is unavailable', 'ไม่สามารถเปิดทริปนี้ได้')}</h1>
          <p>
            {t(
              'The link may have expired or been revoked. Check your connection and try again.',
              'ลิงก์อาจหมดอายุหรือถูกเพิกถอน ตรวจการเชื่อมต่อแล้วลองอีกครั้ง',
            )}
          </p>
          <button className="button button-outline" onClick={() => setRetry((v) => v + 1)}>
            {t('Try again', 'ลองอีกครั้ง')}
          </button>
        </div>
      )}
    </main>
  );
}
