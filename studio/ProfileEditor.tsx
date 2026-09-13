import { local, type StateGuide, type PlaceProfile, type LocalText } from '../data/travel';
import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../lib/i18n';
export default function ProfileEditor({
  state,
  language,
  onChange,
}: {
  state: StateGuide;
  language: Language;
  onChange: (profiles: PlaceProfile[]) => void;
}) {
  const languageIndex = LANGUAGES.indexOf(language);
  const change = (index: number, fields: Partial<PlaceProfile>) =>
    onChange(state.destinations.map((p, i) => (i === index ? { ...p, ...fields } : p)));
  const text = (
    index: number,
    field: 'summary' | 'access' | 'stay' | 'locationLabel',
    value: string,
  ) => {
    const p = state.destinations[index];
    const next = [...p[field]];
    next[languageIndex] = value;
    change(index, {
      [field]: next as unknown as LocalText,
      translationsReviewed: p.translationsReviewed.map((v, i) => (i === languageIndex ? false : v)),
    });
  };
  return (
    <section>
      <div className="studio-section-heading">
        <span>05</span>
        <div>
          <h3>รายละเอียดและจุดเข้าถึงรายสถานที่</h3>
          <p>
            บันทึกพร้อมเนื้อหา ภาพ และคำแปลในชุดเดียว · วันที่ตรวจสอบต้องยืนยันหลังตรวจแหล่งจริง
          </p>
        </div>
      </div>
      {state.destinations.map((p, index) => (
        <details className="studio-profile" key={p.id}>
          <summary>
            {state.places[index]} · {p.reviewAfter}
          </summary>
          {(['summary', 'access', 'stay', 'locationLabel'] as const).map((field, i) => (
            <label key={field}>
              {
                [
                  'เรื่องราวและจุดเด่น',
                  'การเดินทางและทางเข้า',
                  'บริเวณที่พักที่แนะนำ',
                  'ชื่อหมุดหรือทางเข้า',
                ][i]
              }{' '}
              · {LANGUAGE_NAMES[language]}
              <textarea
                lang={language}
                rows={field === 'summary' ? 5 : 2}
                maxLength={4000}
                value={local(p[field], language)}
                onChange={(e) => text(index, field, e.target.value)}
              />
            </label>
          ))}
          <div className="studio-facts">
            <label>
              เวลาเที่ยวแนะนำ (นาที)
              <input
                type="number"
                min={15}
                max={720}
                value={p.visitMinutes}
                onChange={(e) => change(index, { visitMinutes: Number(e.target.value) })}
              />
            </label>
            <label>
              ประเภทหมุด
              <select
                value={p.locationKind}
                onChange={(e) =>
                  change(index, { locationKind: e.target.value as PlaceProfile['locationKind'] })
                }
              >
                <option value="area">พื้นที่โดยประมาณ</option>
                <option value="entrance">ทางเข้าหรือที่จอดรถที่ตรวจแล้ว</option>
                <option value="visitor-center">ศูนย์บริการนักท่องเที่ยว</option>
              </select>
            </label>
          </div>
          <div className="studio-facts">
            <label>
              ละติจูด
              <input
                type="number"
                min={18}
                max={72}
                step="any"
                value={p.coordinates[0]}
                onChange={(e) =>
                  change(index, { coordinates: [Number(e.target.value), p.coordinates[1]] })
                }
              />
            </label>
            <label>
              ลองจิจูด
              <input
                type="number"
                min={-180}
                max={-60}
                step="any"
                value={p.coordinates[1]}
                onChange={(e) =>
                  change(index, { coordinates: [p.coordinates[0], Number(e.target.value)] })
                }
              />
            </label>
          </div>
          {(['officialUrl', 'bookingUrl', 'locationSource'] as const).map((field, i) => (
            <label key={field}>
              {
                [
                  'เว็บไซต์ผู้ดูแลหรือการท่องเที่ยวทางการ',
                  'ลิงก์ค่าธรรมเนียมหรือการจอง',
                  'แหล่งอ้างอิงตำแหน่ง',
                ][i]
              }
              <input
                type="url"
                maxLength={2000}
                value={p[field]}
                onChange={(e) => change(index, { [field]: e.target.value })}
              />
            </label>
          ))}
          <label>
            แหล่งอ้างอิงเนื้อหาภาษานี้
            <input
              type="url"
              value={p.summarySources[languageIndex]}
              onChange={(e) =>
                change(index, {
                  summarySources: p.summarySources.map((v, i) =>
                    i === languageIndex ? e.target.value : v,
                  ),
                })
              }
            />
          </label>
          <label>
            สัญญาอนุญาตเนื้อหา
            <input
              value={p.summaryLicense}
              maxLength={150}
              onChange={(e) => change(index, { summaryLicense: e.target.value })}
            />
          </label>
          <div className="studio-facts">
            {(['reviewedAt', 'reviewAfter', 'locationCheckedAt'] as const).map((field, i) => (
              <label key={field}>
                {['ตรวจเนื้อหาล่าสุด', 'กำหนดตรวจครั้งถัดไป', 'ตรวจพิกัดล่าสุด'][i]}
                <input
                  type="date"
                  value={p[field]}
                  onChange={(e) => change(index, { [field]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <label className="studio-check">
            <input
              type="checkbox"
              checked={p.translationsReviewed[languageIndex]}
              onChange={(e) =>
                change(index, {
                  translationsReviewed: p.translationsReviewed.map((v, i) =>
                    i === languageIndex ? e.target.checked : v,
                  ),
                })
              }
            />
            ตรวจทานภาษา {LANGUAGE_NAMES[language]} แล้ว
          </label>
        </details>
      ))}
    </section>
  );
}
