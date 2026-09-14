import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  contentIssues,
  validateCatalog,
  migrateCatalog,
  reviewQueue,
  type Catalog,
} from '../lib/content';
import { LANGUAGES, LANGUAGE_NAMES, type Language } from '../lib/i18n';
import { local, type LocalText, type StateGuide } from '../data/travel';
import { downloadFile } from '../lib/storage';
import StateDetail from '../components/StateDetail';
import Icon from '../components/Icon';
import '../styles.css';
import ProfileEditor from './ProfileEditor';
import PhotoCaptionEditor from './PhotoCaptionEditor';
import './studio.css';
interface Session {
  catalog: Catalog;
  revision: string;
  token: string;
  savedDraft: boolean;
}
export default function Studio() {
  const [session, setSession] = useState<Session | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selected, setSelected] = useState('CA');
  const [language, setLanguage] = useState<Language>('th');
  const [query, setQuery] = useState('');
  const [onlyReview, setOnlyReview] = useState(false);
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(false);
  const snapshot = useRef('');
  const importRef = useRef<HTMLInputElement>(null);
  const dirty = !!catalog && JSON.stringify(catalog) !== snapshot.current;
  const accept = (data: Session) => {
    snapshot.current = JSON.stringify(data.catalog);
    setSession(data);
    setCatalog(data.catalog);
  };
  const load = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/studio');
      if (!r.ok) throw Error('เปิด Studio ด้วย npm run studio ที่พอร์ต 5174');
      accept(await r.json());
      setMessage('โหลดข้อมูลล่าสุดแล้ว');
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    document.documentElement.lang = 'th';
    document.title = 'Roam America · Content Studio';
    void load();
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const reviews = catalog ? reviewQueue(catalog) : [];
  const issues = catalog ? contentIssues(catalog) : [];
  const state = catalog?.states.find((s) => s.code === selected);
  const change = (fields: Partial<StateGuide>) =>
    setCatalog((value) =>
      value
        ? {
            ...value,
            states: value.states.map((s) =>
              s.code === selected
                ? { ...s, ...fields, updatedAt: new Date().toISOString().slice(0, 10) }
                : s,
            ),
          }
        : value,
    );
  const updateText = (field: 'names' | 'description' | 'food' | 'tip', value: string) => {
    if (!state) return;
    const next = [...state[field]];
    next[LANGUAGES.indexOf(language)] = value;
    change({ [field]: next, ...(field === 'names' && language === 'th' ? { thai: value } : {}) });
  };
  async function request(action: 'draft' | 'publish') {
    if (!session || !catalog) return;
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch(`/api/studio/${action}`, {
        method: action === 'draft' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Studio-Token': session.token },
        body: JSON.stringify({ catalog, revision: session.revision }),
      });
      const data = await r.json();
      if (!r.ok)
        throw Error(
          data.error +
            (data.issues
              ? ' · ' +
                data.issues
                  .map((i: { code: string; message: string }) => `${i.code}: ${i.message}`)
                  .slice(0, 5)
                  .join(' / ')
              : ''),
        );
      accept(data);
      setMessage(
        action === 'draft'
          ? 'บันทึกฉบับร่างลงเครื่องแล้ว'
          : 'เผยแพร่ลง content/states.json แล้ว พร้อมให้ตรวจและ commit',
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  async function upload(event: ChangeEvent<HTMLInputElement>, replace?: number) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !session || !state) return;
    setBusy(true);
    try {
      if (file.size > 5_000_000) throw Error('ใช้ภาพไม่เกิน 5 MB');
      const bitmap = await createImageBitmap(file);
      const width = bitmap.width,
        height = bitmap.height;
      bitmap.close();
      const response = await fetch('/api/studio/upload', {
        method: 'POST',
        headers: { 'X-Studio-Token': session.token, 'Content-Type': file.type },
        body: file,
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      const photo = {
        src: data.src,
        placeIndex: replace === undefined ? 0 : state.photos[replace].placeIndex,
        source: '',
        author: '',
        license: '',
        licenseUrl: '',
        original: '',
        width,
        height,
      };
      const photos = [...state.photos];
      if (replace === undefined) photos.push(photo);
      else photos[replace] = photo;
      change({ photos });
      setMessage('อัปโหลดแล้ว กรุณาเติมเครดิตและสิทธิ์ใช้งานก่อนเผยแพร่');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  async function importCatalog(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw Error('ไฟล์ต้องไม่เกิน 5 MB');
      const value = validateCatalog(
        migrateCatalog(JSON.parse(await file.text()), session!.catalog),
      );
      setCatalog(value);
      setMessage('นำเข้าเพื่อแก้ไขแล้ว กดบันทึกฉบับร่างเพื่อเก็บลงเครื่อง');
    } catch (e) {
      setMessage(String(e));
    }
  }
  const editPhoto = (index: number, field: string, value: string | number) =>
    state &&
    change({
      photos: state.photos.map((photo, i) =>
        i === index
          ? {
              ...photo,
              [field]: value,
              ...(field === 'placeIndex' ? { captionReviewed: Array(5).fill(false) } : {}),
            }
          : photo,
      ),
    });
  const stateIssues = issues.filter((i) => i.code === selected);
  return (
    <div className="studio-shell">
      <header className="studio-header">
        <a href="/" className="studio-brand">
          Roam <em>America</em>
          <span>CONTENT STUDIO</span>
        </a>
        <div className="studio-header-note">
          <span className="studio-dot" /> บนเครื่องเจ้าของเว็บ · ข้อมูลจริงในโปรเจกต์
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="button button-outline">
          ดูเว็บไซต์ <Icon name="external" size={15} />
        </a>
      </header>
      <div className="studio-intro">
        <div>
          <span className="eyebrow">ดูแลเรื่องราว ให้พร้อมสำหรับการเดินทาง</span>
          <h1>
            ทุกจุดหมาย เริ่มต้นที่นี่<span>.</span>
          </h1>
          <p>แก้ไขเนื้อหา 5 ภาษา ตรวจภาพและแหล่งข้อมูล แล้วบันทึกฉบับร่างก่อนเผยแพร่เข้าโปรเจกต์</p>
        </div>
        <div className="studio-actions">
          <button
            className="button button-outline"
            disabled={busy || !catalog}
            onClick={() => {
              if (!dirty || confirm('มีการแก้ไขที่ยังไม่บันทึก โหลดข้อมูลล่าสุดแทนที่หรือไม่?'))
                void load();
            }}
          >
            โหลดล่าสุด
          </button>
          <button
            className="button button-navy"
            disabled={busy || !catalog}
            onClick={() => void request('draft')}
          >
            บันทึกฉบับร่าง
          </button>
          <button
            className="button button-red"
            disabled={busy || !catalog || issues.length > 0}
            onClick={() => void request('publish')}
          >
            เผยแพร่เข้าโปรเจกต์
          </button>
        </div>
      </div>
      <div className="studio-status" role="status">
        {busy ? 'กำลังทำงาน…' : message || 'พร้อมทำงาน'}
        <span>
          {dirty
            ? 'มีการแก้ไขที่ยังไม่บันทึก'
            : session?.savedDraft
              ? 'ฉบับร่างบันทึกแล้ว'
              : 'ข้อมูลที่เผยแพร่ล่าสุดจากโปรเจกต์'}
        </span>
      </div>
      <div className="studio-metrics">
        <div>
          <strong>
            {catalog?.states.length ?? 0}
            <small>/ 50</small>
          </strong>
          <span>คู่มือรัฐ</span>
        </div>
        <div>
          <strong>{catalog?.states.reduce((n, s) => n + s.photos.length, 0) ?? 0}</strong>
          <span>ภาพในแกลเลอรี</span>
        </div>
        <div>
          <strong>5</strong>
          <span>ภาษาที่ดูแลร่วมกัน</span>
        </div>
        <div className={issues.length ? 'has-issues' : ''}>
          <strong>{issues.length}</strong>
          <span>รายการที่ต้องเติมก่อนเผยแพร่</span>
        </div>
      </div>
      {catalog && state && (
        <div className="studio-workspace">
          <aside className="studio-sidebar">
            <label>
              ค้นหารัฐ
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ชื่อรัฐ หรือรหัส เช่น CA"
              />
            </label>
            <label className="studio-check">
              <input
                type="checkbox"
                checked={onlyIssues}
                onChange={(e) => setOnlyIssues(e.target.checked)}
              />
              แสดงเฉพาะที่ยังไม่ครบ
            </label>
            <label className="studio-check">
              <input
                type="checkbox"
                checked={onlyReview}
                onChange={(e) => setOnlyReview(e.target.checked)}
              />
              คิวตรวจทาน ({reviews.length})
            </label>
            <nav aria-label="เลือกเนื้อหารัฐ">
              {catalog.states
                .filter(
                  (s) =>
                    (s.names.join(' ') + ' ' + s.code)
                      .toLowerCase()
                      .includes(query.toLowerCase()) &&
                    (!onlyIssues || issues.some((i) => i.code === s.code)) &&
                    (!onlyReview || reviews.some((i) => i.code === s.code)),
                )
                .map((s) => (
                  <button
                    key={s.code}
                    className={s.code === selected ? 'active' : ''}
                    onClick={() => {
                      setSelected(s.code);
                      setPreview(false);
                    }}
                  >
                    <span className="studio-state-code">{s.code}</span>
                    <span>
                      {local(s.names, 'th')}
                      <small>{s.name}</small>
                    </span>
                    {issues.some((i) => i.code === s.code) ? (
                      <span className="studio-warning">!</span>
                    ) : (
                      <Icon name="check" size={14} />
                    )}
                  </button>
                ))}
            </nav>
            <div className="studio-backups">
              <button
                onClick={() =>
                  downloadFile(
                    'roam-content-backup.json',
                    JSON.stringify(catalog, null, 2),
                    'application/json',
                  )
                }
              >
                ดาวน์โหลดข้อมูลสำรอง
              </button>
              <button disabled={busy} onClick={() => importRef.current?.click()}>
                นำเข้าข้อมูลสำรอง
              </button>
              <input
                type="file"
                accept="application/json,.json"
                ref={importRef}
                hidden
                onChange={(e) => void importCatalog(e)}
              />
            </div>
          </aside>
          <main className="studio-editor">
            <div className="studio-editor-title">
              <div>
                <span className="eyebrow">
                  {state.region} / {state.code}
                </span>
                <h2>{local(state.names, 'th')}</h2>
                <p>แก้ไขล่าสุด {state.updatedAt}</p>
              </div>
              <button className="button button-outline" onClick={() => setPreview((v) => !v)}>
                {preview ? 'กลับไปแก้ไข' : 'ดูตัวอย่าง'}
              </button>
            </div>
            <div className="studio-language-tabs" role="group" aria-label="ภาษาของเนื้อหา">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  lang={l}
                  aria-pressed={l === language}
                  onClick={() => setLanguage(l)}
                >
                  {LANGUAGE_NAMES[l]}
                  <span>
                    {stateIssues.some((i) => i.field.endsWith('.' + LANGUAGES.indexOf(l)))
                      ? '•'
                      : '✓'}
                  </span>
                </button>
              ))}
            </div>
            {!!reviews.filter((r) => r.code === selected).length && (
              <details className="studio-review-queue">
                <summary>
                  คิวตรวจทานของรัฐนี้ ({reviews.filter((r) => r.code === selected).length})
                </summary>
                <ul>
                  {reviews
                    .filter((r) => r.code === selected)
                    .map((r, i) => (
                      <li key={i}>
                        {state.places[r.index]}: {r.reason}
                      </li>
                    ))}
                </ul>
              </details>
            )}
            {stateIssues.length > 0 && (
              <div className="studio-issues">
                <strong>รายการที่ยังต้องเติม ({stateIssues.length})</strong>
                <ul>
                  {stateIssues.map((issue, i) => (
                    <li key={i}>
                      {issue.field}: {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {preview ? (
              <div className="studio-preview" lang={language}>
                <StateDetail
                  key={selected}
                  state={state}
                  lang={language}
                  saved={false}
                  inTrip={false}
                  onSave={() => {}}
                  onAdd={() => {}}
                />
              </div>
            ) : (
              <fieldset disabled={busy} className="studio-fields">
                <legend className="sr-only">แก้ไขข้อมูล {state.name}</legend>
                <ProfileEditor
                  state={state}
                  language={language}
                  onChange={(destinations) => change({ destinations })}
                />
                <section>
                  <div className="studio-section-heading">
                    <span>01</span>
                    <div>
                      <h3>เรื่องราวของรัฐ</h3>
                      <p>กำลังแก้ไข {LANGUAGE_NAMES[language]} · เติมคำแปลที่อ่านเป็นธรรมชาติ</p>
                    </div>
                  </div>
                  {(['names', 'description', 'food', 'tip'] as const).map((field, i) => (
                    <label key={field}>
                      {['ชื่อรัฐ', 'คำแนะนำรัฐ', 'อาหารน่าลอง', 'รู้ไว้ก่อนเดินทาง'][i]}
                      {field === 'names' || field === 'food' ? (
                        <input
                          lang={language}
                          maxLength={field === 'names' ? 150 : 1000}
                          value={local(state[field], language)}
                          disabled={field === 'names' && language === 'en'}
                          onChange={(e) => updateText(field, e.target.value)}
                        />
                      ) : (
                        <textarea
                          lang={language}
                          rows={3}
                          maxLength={4000}
                          value={local(state[field], language)}
                          onChange={(e) => updateText(field, e.target.value)}
                        />
                      )}
                    </label>
                  ))}
                  <div className="studio-facts">
                    <label>
                      จำนวนวันที่แนะนำ
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={state.days}
                        onChange={(e) => change({ days: Number(e.target.value) })}
                      />
                    </label>
                    <label>
                      สนามบินหลัก
                      <input
                        maxLength={100}
                        value={state.hub}
                        onChange={(e) => change({ hub: e.target.value })}
                      />
                    </label>
                  </div>
                  <fieldset className="studio-season">
                    <legend>ฤดูกาลน่าเที่ยว</legend>
                    {(['Spring', 'Summer', 'Fall', 'Winter'] as const).map((s, i) => (
                      <label key={s}>
                        <input
                          type="checkbox"
                          checked={state.season.includes(s)}
                          onChange={(e) =>
                            change({
                              season: e.target.checked
                                ? [...state.season, s]
                                : state.season.filter((v) => v !== s),
                            })
                          }
                        />
                        {['ใบไม้ผลิ', 'ฤดูร้อน', 'ใบไม้ร่วง', 'ฤดูหนาว'][i]}
                      </label>
                    ))}
                  </fieldset>
                </section>
                <section>
                  <div className="studio-section-heading">
                    <span>02</span>
                    <div>
                      <h3>สถานที่น่าไป</h3>
                      <p>ชื่อภาษาอังกฤษช่วยค้นหาต่อในแผนที่ได้ตรงจุด</p>
                    </div>
                  </div>
                  {state.placeNames.map((names, index) => (
                    <label key={index}>
                      สถานที่ {index + 1} · {state.places[index]}
                      <input
                        lang={language}
                        maxLength={200}
                        value={local(names, language)}
                        onChange={(e) => {
                          const placeNames = state.placeNames.map((n, i) => {
                            const v = [...n];
                            if (i === index) v[LANGUAGES.indexOf(language)] = e.target.value;
                            return v as unknown as LocalText;
                          });
                          change({
                            placeNames,
                            ...(language === 'en' ? { places: placeNames.map((n) => n[0]) } : {}),
                          });
                        }}
                      />
                    </label>
                  ))}
                </section>
                <section>
                  <div className="studio-section-heading">
                    <span>03</span>
                    <div>
                      <h3>ภาพและเครดิต</h3>
                      <p>JPEG, PNG หรือ WebP ไม่เกิน 5 MB · ภาพใหม่ต้องเติมเครดิตก่อนเผยแพร่</p>
                    </div>
                  </div>
                  <div className="studio-photo-list">
                    {state.photos.map((photo, index) => (
                      <article key={photo.src} className="studio-photo-editor">
                        <div className="studio-photo-top">
                          <img src={photo.src} alt={state.places[photo.placeIndex]} />
                          <div>
                            <label className="studio-check">
                              <input
                                type="radio"
                                name="cover"
                                checked={state.cover === index}
                                onChange={() => change({ cover: index })}
                              />
                              ใช้เป็นภาพปก
                            </label>
                            <label>
                              ภาพของสถานที่
                              <select
                                value={photo.placeIndex}
                                onChange={(e) =>
                                  editPhoto(index, 'placeIndex', Number(e.target.value))
                                }
                              >
                                {state.places.map((p, i) => (
                                  <option key={i} value={i}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="studio-upload">
                              เปลี่ยนภาพ
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => void upload(e, index)}
                              />
                            </label>
                            <button
                              type="button"
                              className="studio-remove"
                              onClick={() =>
                                change({
                                  photos: state.photos.filter((_, i) => i !== index),
                                  cover:
                                    state.cover === index
                                      ? 0
                                      : state.cover > index
                                        ? state.cover - 1
                                        : state.cover,
                                })
                              }
                            >
                              นำภาพออก
                            </button>
                          </div>
                        </div>
                        <div className="studio-photo-credit-fields">
                          {(['author', 'source', 'license', 'licenseUrl'] as const).map(
                            (key, i) => (
                              <label key={key}>
                                {
                                  [
                                    'ผู้ถ่าย / เจ้าของภาพ',
                                    'ลิงก์แหล่งที่มา (HTTPS)',
                                    'ชื่อสิทธิ์ใช้งาน',
                                    'ลิงก์เงื่อนไขสิทธิ์ (HTTPS)',
                                  ][i]
                                }
                                <input
                                  value={photo[key]}
                                  maxLength={key === 'license' ? 150 : 2000}
                                  onChange={(e) => editPhoto(index, key, e.target.value)}
                                />
                              </label>
                            ),
                          )}
                        </div>
                        <PhotoCaptionEditor
                          photo={photo}
                          language={language}
                          onChange={(next) =>
                            change({ photos: state.photos.map((p, i) => (i === index ? next : p)) })
                          }
                        />
                      </article>
                    ))}
                  </div>
                  {state.photos.length < 12 && (
                    <label className="studio-upload studio-add-photo">
                      เพิ่มภาพในแกลเลอรี
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => void upload(e)}
                      />
                    </label>
                  )}
                </section>
                <section>
                  <div className="studio-section-heading">
                    <span>04</span>
                    <div>
                      <h3>แหล่งข้อมูล</h3>
                      <p>เชื่อมไปยังเว็บไซต์ท่องเที่ยวหรือสถานที่โดยตรง</p>
                    </div>
                  </div>
                  {state.sources.map((source, index) => (
                    <div className="studio-facts" key={index}>
                      <label>
                        ชื่อแหล่งข้อมูล
                        <input
                          value={source.name}
                          maxLength={200}
                          onChange={(e) =>
                            change({
                              sources: state.sources.map((s, i) =>
                                i === index ? { ...s, name: e.target.value } : s,
                              ),
                            })
                          }
                        />
                      </label>
                      <label>
                        ลิงก์ HTTPS
                        <input
                          value={source.url}
                          maxLength={2000}
                          onChange={(e) =>
                            change({
                              sources: state.sources.map((s, i) =>
                                i === index ? { ...s, url: e.target.value } : s,
                              ),
                            })
                          }
                        />
                      </label>
                    </div>
                  ))}
                </section>
              </fieldset>
            )}
          </main>
        </div>
      )}
      <footer className="studio-footer">
        การเผยแพร่จะอัปเดตไฟล์ในโปรเจกต์นี้ เว็บไซต์ออนไลน์จะเปลี่ยนเมื่อ commit, push และ deploy
        ตามขั้นตอนของโฮสต์ · ฉบับร่างอยู่ใน .studio/ และไม่รวมใน Git
      </footer>
    </div>
  );
}
