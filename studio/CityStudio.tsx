import { useEffect, useRef, useState } from 'react';
import {
  cityContentIssues,
  cityReviewQueue,
  type City,
  type CityContent,
} from '../lib/city-content';
import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../lib/i18n';
import CityGuide from '../components/CityGuide';
import { findPlace } from '../lib/destinations';
import { cityIssueField, cityIssueLanguage, cityFieldLabel } from './city-fields';
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
  const [reviewFilter, setReviewFilter] = useState('due');
  const [reviewTarget, setReviewTarget] = useState<'city' | 'food' | null>(null);
  const [issueTarget, setIssueTarget] = useState<string | null>(null);
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
    if (!reviewTarget || preview) return;
    const heading = document.getElementById(`studio-city-${reviewTarget}-heading`);
    heading?.scrollIntoView({ block: 'start' });
    heading?.focus({ preventScroll: true });
    setReviewTarget(null);
  }, [selected, preview, reviewTarget]);
  useEffect(() => {
    if (!issueTarget || preview) return;
    const field = document.getElementById(`city-${selected}-${issueTarget}`);
    if (field) {
      for (let parent = field.parentElement; parent; parent = parent.parentElement)
        if (parent instanceof HTMLDetailsElement) parent.open = true;
      field.scrollIntoView({ block: 'center' });
      field.focus({ preventScroll: true });
    }
    setIssueTarget(null);
  }, [selected, language, preview, issueTarget]);
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
  const fieldIssue = (field: string) =>
    issues.find((issue) => issue.code === selected && cityIssueField(issue.field) === field);
  const fieldProps = (field: string, label: string) => ({
    id: `city-${selected}-${field}`,
    'aria-label': label,
    'aria-invalid': !!fieldIssue(field),
    'aria-describedby': fieldIssue(field) ? `city-error-${selected}-${field}` : undefined,
  });
  const fieldError = (field: string) =>
    fieldIssue(field) && (
      <small className="studio-field-error" id={`city-error-${selected}-${field}`}>
        {fieldIssue(field)!.message}
      </small>
    );
  const reviews = content ? cityReviewQueue(content) : [];
  const queue = reviews.filter(
    (r) =>
      reviewFilter === 'all' ||
      (reviewFilter === 'due' && (r.due || r.undated)) ||
      (reviewFilter === 'soon' && r.soon) ||
      (reviewFilter === 'languages' && r.languages.length),
  );
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
    field: string,
    label: string,
    value: string[],
    update: (g: City, text: string) => void,
    food = false,
    maxLength = 4000,
  ) => (
    <label>
      {label} · {LANGUAGE_NAMES[language]}
      <textarea
        {...fieldProps(`${field}.${l}`, `${label} · ${LANGUAGE_NAMES[language]}`)}
        lang={language}
        rows={3}
        maxLength={maxLength}
        value={value[l]}
        onChange={(e) => change((g) => update(g, e.target.value), food, true)}
      />
      {fieldError(`${field}.${l}`)}
    </label>
  );
  const input = (
    field: string,
    label: string,
    value: string,
    update: (g: City, text: string) => void,
    food = false,
  ) => (
    <label>
      {label}
      <input
        {...fieldProps(field, label)}
        maxLength={500}
        value={value}
        onChange={(e) => change((g) => update(g, e.target.value), food)}
      />
      {fieldError(field)}
    </label>
  );
  const source = (
    field: string,
    value: { name: string; url: string },
    update: (g: City, source: { name: string; url: string }) => void,
    food = false,
  ) => (
    <div className="studio-facts">
      <label>
        ชื่อแหล่งข้อมูล
        <input
          {...fieldProps(`${field}.name`, 'ชื่อแหล่งข้อมูล')}
          value={value.name}
          maxLength={200}
          onChange={(e) => change((g) => update(g, { ...value, name: e.target.value }), food)}
        />
        {fieldError(`${field}.name`)}
      </label>
      <label>
        ลิงก์ HTTPS
        <input
          {...fieldProps(`${field}.url`, 'ลิงก์ HTTPS')}
          value={value.url}
          maxLength={2000}
          onChange={(e) => change((g) => update(g, { ...value, url: e.target.value }), food)}
        />
        {fieldError(`${field}.url`)}
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
                {...fieldProps(
                  `${food ? 'food.' : ''}${key}`,
                  key === 'checkedAt' ? 'ตรวจแหล่งข้อมูลแล้ว' : 'ตรวจครั้งถัดไป',
                )}
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
              {fieldError(`${food ? 'food.' : ''}${key}`)}
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
      {content && (
        <details className="studio-review-queue studio-city-queue">
          <summary>
            คิวตรวจคู่มือเมืองและอาหาร ({reviews.filter((r) => r.due || r.undated).length} ถึงกำหนด
            · {reviews.filter((r) => r.soon).length} ภายใน 7 วัน ·{' '}
            {reviews.filter((r) => r.languages.length).length} รอตรวจภาษา)
          </summary>
          <p>วันที่ใช้ UTC เมืองและอาหารแยกกัน การเปิดรายการไม่เปลี่ยนวันที่หรือยืนยันคำแปล</p>
          <label>
            แสดงคิวตรวจ
            <select value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)}>
              <option value="due">ถึงกำหนด / ต้องเติมวันที่</option>
              <option value="soon">ถึงกำหนดภายใน 7 วัน</option>
              <option value="languages">ภาษารอตรวจ</option>
              <option value="all">คู่มือทั้งหมด</option>
            </select>
          </label>
          {!queue.length && <p role="status">ไม่มีรายการในคิวนี้</p>}
          <ul>
            {queue.map((r) => (
              <li key={r.placeId + r.section}>
                <button
                  className="button button-outline"
                  disabled={busy}
                  onClick={() => {
                    setSelected(r.placeId);
                    setPreview(false);
                    setReviewTarget(r.section);
                  }}
                >
                  {r.airport} · {r.placeId} · {r.section === 'food' ? 'อาหาร' : 'เมือง'} ·{' '}
                  {r.undated ? 'เติมวันที่ตรวจ' : r.reviewAfter}
                </button>
                <p>
                  {r.languages.length
                    ? `ภาษารอตรวจ: ${r.languages.map((i) => LANGUAGE_NAMES[LANGUAGES[i]]).join(' · ')}`
                    : 'ตรวจคำแปลครบแล้ว'}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
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
                      {i.code === 'copy' ? (
                        <span>
                          ข้อความส่วนกลาง: {i.message} · แก้ใน content/city-guides.json ส่วน copy
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="studio-issue-link"
                          onClick={() => {
                            const field = cityIssueField(i.field);
                            setSelected(i.code);
                            const lang = cityIssueLanguage(field);
                            if (lang) setLanguage(lang);
                            setPreview(false);
                            setIssueTarget(field);
                          }}
                        >
                          {findPlace(i.code)?.state.placeNames[0][1] ?? i.code} →{' '}
                          {cityFieldLabel(cityIssueField(i.field))}: {i.message}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <p>
                  เติมรายการเหล่านี้ก่อนดูตัวอย่างหรือเผยแพร่คู่มือเมืองทั้งหมด ยังบันทึกฉบับร่างได้
                </p>
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
                  <h3 id="studio-city-city-heading" tabIndex={-1}>
                    ภาพรวมและการตรวจทาน
                  </h3>
                  {text('intro', 'คำแนะนำเมือง', guide.intro, (g, v) => {
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
                      {text(`areas.${i}.title`, 'ชื่อย่าน', a.title, (g, v) => {
                        g.areas[i].title[l] = v;
                      })}
                      {text(`areas.${i}.text`, 'รายละเอียดฐานพัก', a.text, (g, v) => {
                        g.areas[i].text[l] = v;
                      })}
                      {input(`areas.${i}.mapQuery`, 'คำค้นแผนที่ย่าน', a.mapQuery, (g, v) => {
                        g.areas[i].mapQuery = v;
                      })}
                      {source(`areas.${i}.source`, a.source, (g, v) => {
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
                      {text(`days.${i}.title`, 'ชื่อแผนวัน', d.title, (g, v) => {
                        g.days[i].title[l] = v;
                      })}
                      {text(`days.${i}.text`, 'รายละเอียดกิจกรรม', d.text, (g, v) => {
                        g.days[i].text[l] = v;
                      })}
                      <fieldset className="studio-profile">
                        <legend>จุดเริ่มเที่ยว · วันที่ {i + 1}</legend>
                        {d.arrival ? (
                          <>
                            <p>
                              ตรวจทางเข้าและพิกัดจากแหล่งจริงก่อนเผยแพร่
                              ช่องว่างบันทึกเป็นฉบับร่างได้ ทริปที่สร้างไว้แล้วจะคงข้อมูลเดิม
                            </p>
                            {text(
                              `days.${i}.arrival.label`,
                              'ชื่อจุดเริ่มเที่ยว',
                              d.arrival.label,
                              (g, v) => {
                                g.days[i].arrival!.label[l] = v;
                              },
                              false,
                              200,
                            )}
                            {text(
                              `days.${i}.arrival.note`,
                              'คำแนะนำจุดเริ่มเที่ยว',
                              d.arrival.note,
                              (g, v) => {
                                g.days[i].arrival!.note[l] = v;
                              },
                              false,
                              1000,
                            )}
                            <div className="studio-facts">
                              {(['ละติจูด', 'ลองจิจูด'] as const).map((label, axis) => (
                                <label key={label}>
                                  {label}
                                  <input
                                    {...fieldProps(`days.${i}.arrival.coordinates.${axis}`, label)}
                                    type="number"
                                    step="any"
                                    min={axis === 0 ? -90 : -180}
                                    max={axis === 0 ? 90 : 180}
                                    value={d.arrival!.coordinates[axis] ?? ''}
                                    onChange={(e) =>
                                      change((g) => {
                                        g.days[i].arrival!.coordinates[axis] = Number.isNaN(
                                          e.target.valueAsNumber,
                                        )
                                          ? null
                                          : e.target.valueAsNumber;
                                      })
                                    }
                                  />
                                  {fieldError(`days.${i}.arrival.coordinates.${axis}`)}
                                </label>
                              ))}
                            </div>
                            {source(`days.${i}.arrival.source`, d.arrival.source, (g, v) => {
                              g.days[i].arrival!.source = v;
                            })}
                            {input(
                              `days.${i}.arrival.coordinateSource`,
                              'ลิงก์พิกัด OpenStreetMap node',
                              d.arrival.coordinateSource,
                              (g, v) => {
                                g.days[i].arrival!.coordinateSource = v;
                              },
                            )}
                            <p>
                              เครดิตพิกัด: © OpenStreetMap contributors ·{' '}
                              <a
                                href={d.arrival.coordinateLicense}
                                target="_blank"
                                rel="noreferrer"
                              >
                                ODbL
                              </a>
                            </p>
                            <label>
                              วันที่ตรวจจุดเริ่มเที่ยว
                              <input
                                {...fieldProps(
                                  `days.${i}.arrival.checkedAt`,
                                  'วันที่ตรวจจุดเริ่มเที่ยว',
                                )}
                                type="date"
                                value={d.arrival.checkedAt}
                                onChange={(e) =>
                                  change((g) => {
                                    g.days[i].arrival!.checkedAt = e.target.value;
                                  })
                                }
                              />
                              {fieldError(`days.${i}.arrival.checkedAt`)}
                            </label>
                            <button
                              className="button button-outline"
                              onClick={() =>
                                change((g) => {
                                  delete g.days[i].arrival;
                                })
                              }
                            >
                              ลบจุดเริ่มเที่ยว
                            </button>
                          </>
                        ) : (
                          <button
                            className="button button-outline"
                            onClick={() =>
                              change((g) => {
                                g.days[i].arrival = {
                                  label: LANGUAGES.map(() => ''),
                                  note: LANGUAGES.map(() => ''),
                                  coordinates: [null, null],
                                  source: { name: '', url: '' },
                                  coordinateSource: '',
                                  coordinateLicense:
                                    'https://opendatacommons.org/licenses/odbl/1-0/',
                                  checkedAt: '',
                                };
                              })
                            }
                          >
                            เพิ่มจุดเริ่มเที่ยว
                          </button>
                        )}
                      </fieldset>
                      {text(`days.${i}.alternative`, 'แผนสำรองตามอากาศ', d.alternative, (g, v) => {
                        g.days[i].alternative[l] = v;
                      })}
                      {d.source &&
                        source(`days.${i}.source`, d.source, (g, v) => {
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
                  {input('airport.code', 'รหัสสนามบิน', guide.airport.code, (g, v) => {
                    g.airport.code = v;
                  })}
                  {guide.airport.steps.map((s, i) => (
                    <div key={i}>
                      {text(`airport.steps.${i}`, `ขั้นตอนสนามบิน ${i + 1}`, s, (g, v) => {
                        g.airport.steps[i][l] = v;
                      })}
                    </div>
                  ))}
                  {text('airport.fare', 'ค่าโดยสารและบัตร', guide.airport.fare, (g, v) => {
                    g.airport.fare[l] = v;
                  })}
                  {text('airport.note', 'หมายเหตุสนามบิน', guide.airport.note, (g, v) => {
                    g.airport.note[l] = v;
                  })}
                  {guide.airport.sources.map((s, i) => (
                    <div key={i}>
                      {source(`airport.sources.${i}`, s, (g, v) => {
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
                            {...fieldProps(
                              `budget.amounts.${i}.${tier}`,
                              content.copy.tiers[tier][1],
                            )}
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
                          {fieldError(`budget.amounts.${i}.${tier}`)}
                        </label>
                      ))}
                    </fieldset>
                  ))}
                  {text('budget.note', 'หมายเหตุงบประมาณ', guide.budget.note, (g, v) => {
                    g.budget.note[l] = v;
                  })}
                </section>
                <section>
                  <h3 id="studio-city-food-heading" tabIndex={-1}>
                    อาหารและมื้อใกล้ทาง
                  </h3>
                  {text(
                    'food.intro',
                    'คำแนะนำอาหาร',
                    guide.food.intro,
                    (g, v) => {
                      g.food.intro[l] = v;
                    },
                    true,
                  )}
                  {text(
                    'food.vegetarian',
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
                        `food.stops.${i}.title`,
                        'ชื่อมื้ออาหาร',
                        s.title,
                        (g, v) => {
                          g.food.stops[i].title[l] = v;
                        },
                        true,
                      )}
                      {text(
                        `food.stops.${i}.text`,
                        'รายละเอียดมื้ออาหาร',
                        s.text,
                        (g, v) => {
                          g.food.stops[i].text[l] = v;
                        },
                        true,
                      )}
                      {input(
                        `food.stops.${i}.mapQuery`,
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
                              {...fieldProps(
                                `food.stops.${i}.allowance.${j}`,
                                `เงินเผื่อมื้อต่อผู้ใหญ่ · ${j === 0 ? 'ต่ำสุด' : 'สูงสุด'} (USD)`,
                              )}
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
                            {fieldError(`food.stops.${i}.allowance.${j}`)}
                          </label>
                        ))}
                      </div>
                      {source(
                        `food.stops.${i}.source`,
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
