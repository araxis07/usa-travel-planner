import { useEffect, useRef, useState } from 'react';
import { w } from '../data/workspace-copy';
import type { User } from '@supabase/supabase-js';
import {
  cloud,
  listCloudTrips,
  saveCloudTrip,
  createShare,
  type CloudTrip,
  type CloudShare,
} from '../lib/cloud';
import type { Language, Trip } from '../data/travel';
import { translate, LOCALES } from '../lib/i18n';
import Dialog from './Dialog';

export default function CloudPanel({
  trip,
  lang,
  onLoad,
  onClose,
}: {
  trip: Trip;
  lang: Language;
  onLoad: (trip: Trip) => void;
  onClose: () => void;
}) {
  const t = (en: string, th: string) => translate(en, th, lang);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!cloud);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>('login');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [trips, setTrips] = useState<CloudTrip[]>([]);
  const [shares, setShares] = useState<CloudShare[]>([]);
  const [current, setCurrent] = useState<CloudTrip | null>(null);
  const [pending, setPending] = useState<CloudTrip | null>(null);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [link, setLink] = useState('');
  const alive = useRef(true);
  const identity = useRef<string | null>(null);
  useEffect(() => {
    alive.current = true;
    if (!cloud) return;
    const accept = (next: User | null) => {
      if (!alive.current) return;
      const changed = identity.current !== (next?.id ?? null);
      identity.current = next?.id ?? null;
      setUser(next);
      setReady(true);
      if (!changed) return;
      setCurrent(null);
      setPending(null);
      setTrips([]);
      setShares([]);
      setLink('');
    };
    void cloud.auth.getSession().then(({ data, error }) => {
      if (error)
        setMessage(t('Could not connect. Please try again.', 'เชื่อมต่อไม่ได้ กรุณาลองอีกครั้ง'));
      accept(data.session?.user ?? null);
    });
    const { data } = cloud.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setMode('recovery');
      if (event !== 'TOKEN_REFRESHED') accept(session?.user ?? null);
    });
    return () => {
      alive.current = false;
      data.subscription.unsubscribe();
    };
  }, []);
  async function refresh() {
    const id = identity.current;
    const [rows, result] = await Promise.all([
      listCloudTrips(),
      cloud!
        .from('roam_shares')
        .select('token,expires_at,payload')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    if (result.error) throw result.error;
    if (alive.current && identity.current === id) {
      setTrips(rows);
      setShares(result.data ?? []);
    }
  }
  useEffect(() => {
    if (user) void run(refresh);
  }, [user?.id]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === 'CLOUD_CONFLICT'
          ? t(
              'A newer version exists. Load it below or save a new copy.',
              'มีเวอร์ชันใหม่กว่า เลือกโหลดด้านล่างหรือบันทึกเป็นสำเนาใหม่',
            )
          : t(
              'Could not complete this request. Check your connection and account details, then try again.',
              'ทำรายการไม่ได้ ตรวจการเชื่อมต่อและข้อมูลบัญชีแล้วลองอีกครั้ง',
            ),
      );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const redirect = () => `${location.origin}/?lang=${lang}&view=planner&account=1`;
  return (
    <Dialog
      title={t('Your trips, together', 'รวมทริปของคุณไว้ด้วยกัน')}
      closeLabel={t('Close', 'ปิด')}
      onClose={onClose}
      wide
    >
      <section className="cloud-panel">
        <span className="eyebrow">ROAM ACCOUNT</span>
        <h2>{t('Your trips, together', 'รวมทริปของคุณไว้ด้วยกัน')}</h2>
        {!cloud ? (
          <p>
            {t(
              'Accounts are not available on this site yet. Your trip is still saved on this browser.',
              'เว็บไซต์นี้ยังไม่เปิดใช้บัญชี แผนทริปยังบันทึกในเบราว์เซอร์นี้ได้',
            )}
          </p>
        ) : !ready ? (
          <p role="status">{t('Loading…', 'กำลังโหลด…')}</p>
        ) : !user || mode === 'recovery' ? (
          <>
            <form
              className="account-form"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  if (mode === 'recovery') {
                    const { error } = await cloud!.auth.updateUser({ password });
                    if (error) throw error;
                    setMode('login');
                    setPassword('');
                    setMessage(t('Password updated.', 'เปลี่ยนรหัสผ่านแล้ว'));
                    return;
                  }
                  const result =
                    mode === 'signup'
                      ? await cloud!.auth.signUp({
                          email,
                          password,
                          options: { emailRedirectTo: redirect() },
                        })
                      : await cloud!.auth.signInWithPassword({ email, password });
                  if (result.error) throw result.error;
                  setPassword('');
                  if (mode === 'signup' && !result.data.session)
                    setMessage(
                      t(
                        'Check your email to confirm your account.',
                        'ตรวจอีเมลเพื่อยืนยันบัญชีของคุณ',
                      ),
                    );
                });
              }}
            >
              {mode !== 'recovery' && (
                <label>
                  {t('Email', 'อีเมล')}
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              )}
              <label>
                {t('Password', 'รหัสผ่าน')}
                <input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={mode === 'login' ? 1 : 8}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button disabled={busy} className="button button-red">
                {mode === 'login'
                  ? t('Sign in', 'เข้าสู่ระบบ')
                  : mode === 'signup'
                    ? t('Create account', 'สร้างบัญชี')
                    : t('Update password', 'เปลี่ยนรหัสผ่าน')}
              </button>
            </form>
            {mode !== 'recovery' && (
              <div className="cloud-actions">
                <button
                  disabled={busy}
                  className="text-link"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                >
                  {mode === 'login'
                    ? t('Create account', 'สร้างบัญชี')
                    : t('Sign in', 'เข้าสู่ระบบ')}
                </button>
                <button
                  className="text-link"
                  disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                  onClick={() =>
                    void run(async () => {
                      const { error } = await cloud!.auth.resetPasswordForEmail(email, {
                        redirectTo: redirect(),
                      });
                      if (error) throw error;
                      setMessage(
                        t(
                          'Check your email for the password reset link.',
                          'ตรวจอีเมลสำหรับลิงก์ตั้งรหัสผ่านใหม่',
                        ),
                      );
                    })
                  }
                >
                  {t('Reset password', 'ตั้งรหัสผ่านใหม่')}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="account-identity">
              <span>{user.email}</span>
              <button
                className="text-link"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const { error } = await cloud!.auth.signOut({ scope: 'local' });
                    if (error) throw error;
                    setMessage(
                      t(
                        'Signed out. Your local trip remains on this device.',
                        'ออกจากระบบแล้ว ทริปในเครื่องยังอยู่บนอุปกรณ์นี้',
                      ),
                    );
                  })
                }
              >
                {t('Sign out', 'ออกจากระบบ')}
              </button>
            </div>
            <p>
              {t(
                'Save a copy to your account, then open it on another device. Your browser trip is only replaced when you choose to load one.',
                'บันทึกสำเนาในบัญชีแล้วเปิดบนอุปกรณ์อื่น ทริปในเบราว์เซอร์จะเปลี่ยนเมื่อคุณเลือกโหลดเท่านั้น',
              )}
            </p>
            <div className="cloud-actions">
              <button
                className="button button-navy"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const saved = await saveCloudTrip(trip);
                    setCurrent(saved);
                    await refresh();
                    setMessage(t('Saved to your account.', 'บันทึกในบัญชีแล้ว'));
                  })
                }
              >
                {t('Save a new copy', 'บันทึกสำเนาใหม่')}
              </button>
              {current && (
                <button
                  className="button button-outline"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const saved = await saveCloudTrip(trip, current);
                      setCurrent(saved);
                      await refresh();
                      setMessage(t('Saved to your account.', 'บันทึกในบัญชีแล้ว'));
                    })
                  }
                >
                  {t('Update selected trip', 'อัปเดตทริปที่เลือก')}
                </button>
              )}
              <button className="text-link" disabled={busy} onClick={() => void run(refresh)}>
                {t('Refresh', 'รีเฟรช')}
              </button>
            </div>
            <h3>{t('Trips in your account', 'ทริปในบัญชีของคุณ')}</h3>
            {!trips.length && <p>{t('No saved trips yet.', 'ยังไม่มีทริปที่บันทึกไว้')}</p>}
            <ul className="cloud-list">
              {trips.map((row) => (
                <li key={row.id}>
                  <div>
                    <strong>
                      {row.payload.name || t('My American adventure', 'ทริปอเมริกาของฉัน')}
                    </strong>
                    <small>
                      {new Intl.DateTimeFormat(LOCALES[lang], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(row.updated_at))}
                    </small>
                  </div>
                  <button className="text-link" disabled={busy} onClick={() => setPending(row)}>
                    {t('Load trip', 'โหลดทริป')}
                  </button>
                </li>
              ))}
            </ul>
            {pending && (
              <div className="confirm-panel">
                <p>
                  {t(
                    'Replace the trip on this browser with this saved copy? Export your current trip first if you want to keep it.',
                    'แทนที่ทริปในเบราว์เซอร์ด้วยสำเนานี้หรือไม่? ส่งออกทริปปัจจุบันก่อนหากต้องการเก็บไว้',
                  )}
                </p>
                <button
                  className="button button-red"
                  onClick={() => {
                    onLoad(pending.payload);
                    setCurrent(pending);
                    setPending(null);
                    setMessage(t('Trip loaded.', 'โหลดทริปแล้ว'));
                  }}
                >
                  {t('Replace current trip', 'แทนที่ทริปปัจจุบัน')}
                </button>
                <button className="text-link" onClick={() => setPending(null)}>
                  {t('Cancel', 'ยกเลิก')}
                </button>
              </div>
            )}
            <h3>{t('Share a snapshot', 'แชร์สำเนาทริป')}</h3>
            <p>
              {t(
                'Anyone with the link can view this copy for 7 days. Later edits stay private. Revoke the link whenever you need.',
                'ผู้ที่มีลิงก์ดูสำเนานี้ได้ 7 วัน การแก้ไขภายหลังไม่เปลี่ยนสำเนา คุณเพิกถอนลิงก์ได้ทุกเมื่อ',
              )}
            </p>
            <label className="share-notes">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
              />
              {w(lang, 'sharePrivate')}
            </label>
            <button
              className="button button-outline"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const share = await createShare(trip, includeNotes);
                  setLink(`${location.origin}/?lang=${lang}#share=${share.token}`);
                  await refresh();
                })
              }
            >
              {t('Create viewing link', 'สร้างลิงก์สำหรับดูทริป')}
            </button>
            {link && (
              <label className="share-link-field">
                {t('Share link', 'ลิงก์แชร์')}
                <input
                  aria-label={t('Share link', 'ลิงก์แชร์')}
                  readOnly
                  value={link}
                  onFocus={(e) => e.target.select()}
                />
                <button
                  className="text-link"
                  onClick={() =>
                    void run(async () => {
                      await navigator.clipboard.writeText(link);
                      setMessage(t('Link copied.', 'คัดลอกลิงก์แล้ว'));
                    })
                  }
                >
                  {t('Copy link', 'คัดลอกลิงก์')}
                </button>
              </label>
            )}
            <ul className="cloud-list">
              {shares.map((share) => (
                <li key={share.token}>
                  <span>
                    {share.payload.name || t('My American adventure', 'ทริปอเมริกาของฉัน')} ·{' '}
                    {t('Expires', 'หมดอายุ')}{' '}
                    {new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'medium' }).format(
                      new Date(share.expires_at),
                    )}
                  </span>
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const { error } = await cloud!
                          .from('roam_shares')
                          .delete()
                          .eq('token', share.token);
                        if (error) throw error;
                        setLink('');
                        await refresh();
                      })
                    }
                  >
                    {t('Revoke link', 'เพิกถอนลิงก์')}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {message && (
          <p role="status" className="cloud-message">
            {message}
          </p>
        )}
      </section>
    </Dialog>
  );
}
