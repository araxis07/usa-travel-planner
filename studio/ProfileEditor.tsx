import { local, type PlaceProfile, type LocalText } from '../data/travel';
import type { Catalog } from '../lib/content';
import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../lib/i18n';
export default function ProfileEditor({
  state,
  language,
  onChange,
}: {
  state: Catalog['states'][number];
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
            <label className="studio-check">
              <input
                type="checkbox"
                checked={!!p.advisory}
                onChange={(e) =>
                  change(index, {
                    advisory: e.target.checked
                      ? {
                          text: ['', '', '', '', ''],
                          source: p.officialUrl,
                          checkedAt: new Date().toISOString().slice(0, 10),
                        }
                      : undefined,
                  })
                }
              />
              มีประกาศที่ต้องตรวจการเดินทาง
            </label>
            {p.advisory && (
              <>
                <label>
                  ประกาศ · {LANGUAGE_NAMES[language]}
                  <textarea
                    maxLength={4000}
                    value={local(p.advisory.text, language)}
                    onChange={(e) => {
                      const texts = [...p.advisory!.text];
                      texts[languageIndex] = e.target.value;
                      change(index, {
                        advisory: { ...p.advisory!, text: texts as unknown as LocalText },
                        translationsReviewed: p.translationsReviewed.map((v, i) =>
                          i === languageIndex ? false : v,
                        ),
                      });
                    }}
                  />
                </label>
                <label>
                  แหล่งประกาศ (HTTPS)
                  <input
                    type="url"
                    value={p.advisory.source}
                    onChange={(e) =>
                      change(index, { advisory: { ...p.advisory!, source: e.target.value } })
                    }
                  />
                </label>
                <label>
                  วันที่ตรวจประกาศ
                  <input
                    type="date"
                    value={p.advisory.checkedAt}
                    onChange={(e) =>
                      change(index, { advisory: { ...p.advisory!, checkedAt: e.target.value } })
                    }
                  />
                </label>
              </>
            )}
            {p.planning && (
              <>
                <label>
                  การเดินทาง
                  <select
                    value={p.planning.transport}
                    onChange={(e) =>
                      change(index, {
                        planning: {
                          ...p.planning!,
                          transport: e.target.value as NonNullable<
                            PlaceProfile['planning']
                          >['transport'],
                        },
                      })
                    }
                  >
                    <option value="transit">ฐานขนส่งสาธารณะ</option>
                    <option value="car">รถหรือรถรับส่ง</option>
                    <option value="boat">เรือหรือข้ามเกาะ</option>
                  </select>
                </label>
                <label>
                  ประเภทกิจกรรม
                  <select
                    value={p.planning.interest}
                    onChange={(e) =>
                      change(index, {
                        planning: {
                          ...p.planning!,
                          interest: e.target.value as NonNullable<
                            PlaceProfile['planning']
                          >['interest'],
                        },
                      })
                    }
                  >
                    {['Cities', 'Nature', 'Coast', 'Culture'].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  สภาพแวดล้อม
                  <select
                    value={p.planning.setting}
                    onChange={(e) =>
                      change(index, {
                        planning: {
                          ...p.planning!,
                          setting: e.target.value as 'indoors' | 'outdoors',
                        },
                      })
                    }
                  >
                    <option value="indoors">มีตัวเลือกในร่ม</option>
                    <option value="outdoors">กลางแจ้ง</option>
                  </select>
                </label>
                <label>
                  รูปแบบการเดิน
                  <select
                    value={p.planning.walking}
                    onChange={(e) =>
                      change(index, {
                        planning: { ...p.planning!, walking: e.target.value as 'easy' | 'varied' },
                      })
                    }
                  >
                    <option value="easy">เลือกเที่ยวช่วงสั้นได้</option>
                    <option value="varied">ตรวจเส้นทางหรือสถานที่</option>
                  </select>
                </label>
                <fieldset>
                  <legend>เดือนแนะนำเบื้องต้น</legend>
                  {Array.from({ length: 12 }, (_, i) => (
                    <label key={i}>
                      <input
                        type="checkbox"
                        checked={p.planning!.months.includes(i + 1)}
                        onChange={() => {
                          const months = p.planning!.months.includes(i + 1)
                            ? p.planning!.months.filter((m) => m !== i + 1)
                            : [...p.planning!.months, i + 1].sort((a, b) => a - b);
                          if (months.length)
                            change(index, { planning: { ...p.planning!, months } });
                        }}
                      />
                      {i + 1}
                    </label>
                  ))}
                </fieldset>
              </>
            )}
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
