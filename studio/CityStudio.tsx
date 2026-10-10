import { useEffect, useRef, useState } from 'react';
import { cityContentIssues, type City, type CityContent } from '../lib/city-content';
import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../lib/i18n';
import CityGuide from '../components/CityGuide';
import '../experience.css';

interface Session {
  content: CityContent;
  revision: string;
  token: string;
  savedDraft: boolean;
}
export default function CityStudio() {
  const [session, setSession] = useState<Session | null>(null);
  const [content, setContent] = useState<CityContent | null>(null);
  const [selected, setSelected] = useState('NY-0');
  const [language, setLanguage] = useState<Language>('th');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const snapshot = useRef('');
  const dirty = !!content && JSON.stringify(content) !== snapshot.current;
  const accept = (data: Session) => {
    snapshot.current = JSON.stringify(data.content);
    setSession(data);
    setContent(data.content);
  };
  async function load() {
    setBusy(true);
    try {
      const response = await fetch('/api/studio/cities');
      if (!response.ok) throw Error('โหลดคู่มือเมืองไม่ได้ เปิดด้วย npm run studio');
      accept(await response.json());
      setMessage('โหลดคู่มือเมืองล่าสุดแล้ว');
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function save(action: 'draft' | 'publish') {
    if (!content || !session) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/studio/cities/${action}`, {
        method: action === 'draft' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Studio-Token': session.token },
        body: JSON.stringify({ content, revision: session.revision }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(
          data.error +
            (data.issues
              ? ' · ' +
                data.issues
                  .slice(0, 5)
                  .map((i: { field: string }) => i.field)
                  .join(' / ')
              : ''),
        );
      accept(data);
      setMessage(
        action === 'draft'
          ? 'บันทึกฉบับร่างเมืองแล้ว'
          : 'เผยแพร่ลง content/city-guides.json แล้ว พร้อมให้ตรวจและ commit',
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  const l = LANGUAGES.indexOf(language);
  const guide = content?.guides.find((g) => g.placeId === selected);
  const issues = content ? cityContentIssues(content) : [];
  const change = (update: (g: City) => void, food = false, languageOnly = false, reset = true) => {
    setContent((value) => {
      if (!value) return value;
      const next = structuredClone(value);
      const g = next.guides.find((g) => g.placeId === selected)!;
      update(g);
      if (reset) {
        const review = food ? g.food : g;
        review.translationsReviewed = review.translationsReviewed.map((v, i) =>
          languageOnly && i !== l ? v : false,
        );
      }
      return next;
    });
  };
  const text = (
    label: string,
    value: string[],
    update: (g: City, text: string) => void,
    food = false,
  ) => (
    <label>
      {label} · {LANGUAGE_NAMES[language]}
      <textarea
        lang={language}
        rows={3}
        maxLength={4000}
        value={value[l]}
        onChange={(e) => change((g) => update(g, e.target.value), food, true)}
      />
    </label>
  );
  const input = (
    label: string,
    value: string,
    update: (g: City, text: string) => void,
    food = false,
  ) => (
    <label>
      {label}
      <input
        maxLength={500}
        value={value}
        onChange={(e) => change((g) => update(g, e.target.value), food)}
      />
    </label>
  );
  const source = (
    value: { name: string; url: string },
    update: (g: City, source: { name: string; url: string }) => void,
    food = false,
  ) => (
    <div className="studio-facts">
      <label>
        ชื่อแหล่งข้อมูล
        <input
          value={value.name}
          maxLength={200}
          onChange={(e) => change((g) => update(g, { ...value, name: e.target.value }), food)}
        />
      </label>
      <label>
        ลิงก์ HTTPS
        <input
          value={value.url}
          maxLength={2000}
          onChange={(e) => change((g) => update(g, { ...value, url: e.target.value }), food)}
        />
      </label>
    </div>
  );
  const review = (food = false) => {
    const value = food ? guide!.food : guide!;
    return (
      <fieldset className="studio-city-review">
        <legend>{food ? 'ตรวจคู่มืออาหาร' : 'ตรวจคู่มือเมือง'}</legend>
        <p>
          ยืนยันวันที่หลังตรวจแหล่งจริงเท่านั้น การแก้ข้อความจะยกเลิกเครื่องหมายตรวจคำแปลของภาษานั้น
        </p>
        <div className="studio-facts">
          {(['checkedAt', 'reviewAfter'] as const).map((key) => (
            <label key={key}>
              {key === 'checkedAt' ? 'ตรวจแหล่งข้อมูลแล้ว' : 'ตรวจครั้งถัดไป'}
              <input
                type="date"
                value={value[key]}
                onChange={(e) =>
                  change(
                    (g) => {
                      (food ? g.food : g)[key] = e.target.value;
                    },
                    food,
                    false,
                    false,
                  )
                }
              />
            </label>
          ))}
        </div>
        <label className="studio-check">
          <input
            type="checkbox"
            checked={value.translationsReviewed[l]}
            onChange={(e) =>
              change(
                (g) => {
                  (food ? g.food : g).translationsReviewed[l] = e.target.checked;
                },
                food,
                false,
                false,
              )
            }
          />
          ผู้ใช้ภาษาคล่องตรวจแล้ว · {LANGUAGE_NAMES[language]}
        </label>
      </fieldset>
    );
  };
  return (
    <>
      <div className="studio-intro">
        <div>
          <h1>คู่มือเมืองและอาหาร</h1>
          <p>6 เมือง · 5 ภาษา · ฉบับร่างแยกจากคู่มือรัฐ วันที่ตรวจเมืองและอาหารแยกกัน</p>
        </div>
        <div className="studio-actions">
          <button
            className="button button-outline"
            disabled={busy}
            onClick={() => {
              if (!dirty || confirm('มีการแก้ไขที่ยังไม่บันทึก โหลดข้อมูลล่าสุดแทนที่หรือไม่?'))
                void load();
            }}
          >
            โหลดเมืองล่าสุด
          </button>
          <button
            className="button button-navy"
            disabled={busy || !content}
            onClick={() => void save('draft')}
          >
            บันทึกฉบับร่างเมือง
          </button>
          <button
            className="button button-red"
            disabled={busy || !content || !!issues.length}
            onClick={() => void save('publish')}
          >
            เผยแพร่คู่มือเมือง
          </button>
        </div>
      </div>
      <div className="studio-status" role="status">
        {busy ? 'กำลังทำงาน…' : message || 'พร้อมทำงาน'}
        <span>
          {dirty
            ? 'มีการแก้ไขที่ยังไม่บันทึก'
            : session?.savedDraft
              ? 'ฉบับร่างเมืองบันทึกแล้ว'
              : 'คู่มือเมืองที่เผยแพร่ล่าสุด'}
        </span>
      </div>
      {content && guide && (
        <div className="studio-workspace studio-city-workspace">
          <aside className="studio-sidebar">
            <nav aria-label="เลือกคู่มือเมือง">
              {content.guides.map((g) => (
                <button
                  key={g.placeId}
                  className={g.placeId === selected ? 'active' : ''}
                  aria-pressed={g.placeId === selected}
                  onClick={() => {
                    setSelected(g.placeId);
                    setPreview(false);
                  }}
                >
                  <span>
                    {g.airport.code} · {g.placeId}
                    <small>{g.areas[0].title[l]}</small>
                  </span>
                  {issues.some((i) => i.code === g.placeId) && (
                    <span className="studio-warning">!</span>
                  )}
                </button>
              ))}
            </nav>
            <p>
              เมือง: {guide.reviewAfter}
              <br />
              อาหาร: {guide.food.reviewAfter}
              <br />
              {issues.length} รายการต้องเติมก่อนเผยแพร่
            </p>
          </aside>
          <main className="studio-editor">
            <div className="studio-editor-title">
              <h2>
                {guide.airport.code} · {guide.placeId}
              </h2>
              <button
                className="button button-outline"
                disabled={!!issues.length && !preview}
                onClick={() => setPreview((v) => !v)}
              >
                {preview ? 'กลับไปแก้คู่มือเมือง' : 'ดูตัวอย่างคู่มือเมือง'}
              </button>
            </div>
            <div className="studio-language-tabs" role="group" aria-label="ภาษาคู่มือเมือง">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  lang={lang}
                  aria-pressed={lang === language}
                  onClick={() => setLanguage(lang)}
                >
                  {LANGUAGE_NAMES[lang]}
                </button>
              ))}
            </div>
            {!!issues.length && (
              <div className="studio-issues">
                <strong>รายการที่ยังต้องเติม ({issues.length})</strong>
                <ul>
                  {issues.map((i, n) => (
                    <li key={n}>
                      {i.code} · {i.field}: {i.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {preview ? (
              <div className="studio-preview" lang={language}>
                <p>ตัวอย่างเท่านั้น ไม่มีการสร้างทริปหรือแก้ข้อมูลนักเดินทาง</p>
                <CityGuide key={selected} guide={guide} lang={language} />
              </div>
            ) : (
              <fieldset disabled={busy} className="studio-fields">
                <legend className="sr-only">แก้คู่มือเมือง {selected}</legend>
                <section>
                  <h3>ภาพรวมและการตรวจทาน</h3>
                  {text('คำแนะนำเมือง', guide.intro, (g, v) => {
                    g.intro[l] = v;
                  })}
                  {review()}
                </section>
                <section>
                  <h3>ย่านและฐานพัก</h3>
                  {guide.areas.map((a, i) => (
                    <details className="studio-profile" key={i} open={i === 0}>
                      <summary>
                        ย่าน {i + 1} · {a.title[l]}
                      </summary>
                      {text('ชื่อย่าน', a.title, (g, v) => {
                        g.areas[i].title[l] = v;
                      })}
                      {text('รายละเอียดฐานพัก', a.text, (g, v) => {
                        g.areas[i].text[l] = v;
                      })}
                      {input('คำค้นแผนที่ย่าน', a.mapQuery, (g, v) => {
                        g.areas[i].mapQuery = v;
                      })}
                      {source(a.source, (g, v) => {
                        g.areas[i].source = v;
                      })}
                    </details>
                  ))}
                </section>
                <section>
                  <h3>แผน 3 วันและทางเลือกตามอากาศ</h3>
                  {guide.days.map((d, i) => (
                    <details className="studio-profile" key={i} open={i === 0}>
                      <summary>
                        วันที่ {i + 1} · {d.title[l]}
                      </summary>
                      {text('ชื่อแผนวัน', d.title, (g, v) => {
                        g.days[i].title[l] = v;
                      })}
                      {text('รายละเอียดกิจกรรม', d.text, (g, v) => {
                        g.days[i].text[l] = v;
                      })}
                      {text('แผนสำรองตามอากาศ', d.alternative, (g, v) => {
                        g.days[i].alternative[l] = v;
                      })}
                      {d.source &&
                        source(d.source, (g, v) => {
                          g.days[i].source = v;
                        })}
                      {!d.source && (
                        <button
                          type="button"
                          onClick={() =>
                            change((g) => {
                              g.days[i].source = { name: '', url: '' };
                            })
                          }
                        >
                          เพิ่มแหล่งข้อมูลของวันนี้
                        </button>
                      )}
                    </details>
                  ))}
                </section>
                <section>
                  <h3>สนามบินและการต่อรถ</h3>
                  {input('รหัสสนามบิน', guide.airport.code, (g, v) => {
                    g.airport.code = v;
                  })}
                  {guide.airport.steps.map((s, i) => (
                    <div key={i}>
                      {text(`ขั้นตอนสนามบิน ${i + 1}`, s, (g, v) => {
                        g.airport.steps[i][l] = v;
                      })}
                    </div>
                  ))}
                  {text('ค่าโดยสารและบัตร', guide.airport.fare, (g, v) => {
                    g.airport.fare[l] = v;
                  })}
                  {text('หมายเหตุสนามบิน', guide.airport.note, (g, v) => {
                    g.airport.note[l] = v;
                  })}
                  {guide.airport.sources.map((s, i) => (
                    <div key={i}>
                      {source(s, (g, v) => {
                        g.airport.sources[i] = v;
                      })}
                    </div>
                  ))}
                </section>
                <section>
                  <h3>งบตัวอย่าง 3 ระดับ · USD</h3>
                  <p>{content.copy.assumptions[1]} เงินนี้ไม่ถูกเพิ่มลงค่าใช้จ่ายทริป</p>
                  {guide.budget.amounts.map((row, i) => (
                    <fieldset className="studio-city-budget" key={i}>
                      <legend>{content.copy.rows[i][1]}</legend>
                      {row.map((n, tier) => (
                        <label key={tier}>
                          {content.copy.tiers[tier][1]}
                          <input
                            type="number"
                            min={0}
                            max={1000000}
                            step={1}
                            value={n}
                            onChange={(e) =>
                              change((g) => {
                                g.budget.amounts[i][tier] = Number(e.target.value);
                              })
                            }
                          />
                        </label>
                      ))}
                    </fieldset>
                  ))}
                  {text('หมายเหตุงบประมาณ', guide.budget.note, (g, v) => {
                    g.budget.note[l] = v;
                  })}
                </section>
                <section>
                  <h3>อาหารและมื้อใกล้ทาง</h3>
                  {text(
                    'คำแนะนำอาหาร',
                    guide.food.intro,
                    (g, v) => {
                      g.food.intro[l] = v;
                    },
                    true,
                  )}
                  {text(
                    'คำแนะนำมังสวิรัติ',
                    guide.food.vegetarian,
                    (g, v) => {
                      g.food.vegetarian[l] = v;
                    },
                    true,
                  )}
                  {review(true)}
                  {guide.food.stops.map((s, i) => (
                    <details className="studio-profile" key={i} open={i === 0}>
                      <summary>
                        มื้อวันที่ {s.day} · {s.title[l]}
                      </summary>
                      {text(
                        'ชื่อมื้ออาหาร',
                        s.title,
                        (g, v) => {
                          g.food.stops[i].title[l] = v;
                        },
                        true,
                      )}
                      {text(
                        'รายละเอียดมื้ออาหาร',
                        s.text,
                        (g, v) => {
                          g.food.stops[i].text[l] = v;
                        },
                        true,
                      )}
                      {input(
                        'คำค้นแผนที่อาหาร',
                        s.mapQuery,
                        (g, v) => {
                          g.food.stops[i].mapQuery = v;
                        },
                        true,
                      )}
                      <div className="studio-facts">
                        {s.allowance.map((n, j) => (
                          <label key={j}>
                            เงินเผื่อมื้อต่อผู้ใหญ่ · {j === 0 ? 'ต่ำสุด' : 'สูงสุด'} (USD)
                            <input
                              type="number"
                              min={0}
                              max={1000000}
                              step={1}
                              value={n}
                              onChange={(e) =>
                                change((g) => {
                                  g.food.stops[i].allowance[j] = Number(e.target.value);
                                }, true)
                              }
                            />
                          </label>
                        ))}
                      </div>
                      {source(
                        s.source,
                        (g, v) => {
                          g.food.stops[i].source = v;
                        },
                        true,
                      )}
                    </details>
                  ))}
                </section>
              </fieldset>
            )}
          </main>
        </div>
      )}
    </>
  );
}
