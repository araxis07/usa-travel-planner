import { statePlaces, statePhoto } from '../data/travel';
import { translate, LOCALES } from '../lib/i18n';
import { useRef, useState, type ChangeEvent } from 'react';
import { EMPTY_TRIP, STATES, stateName, type Language, type Trip } from '../data/travel';
import { downloadFile, tripDays, validateTrip, validDate } from '../lib/storage';
import Icon from './Icon';
import { StateShape, regionColors } from './Atlas';

export default function TripPlanner({
  trip,
  setTrip,
  lang,
  onExplore,
  storageFailed,
  notify,
}: {
  trip: Trip;
  setTrip: (trip: Trip) => void;
  lang: Language;
  onExplore: () => void;
  storageFailed: boolean;
  notify: (message: string) => void;
}) {
  const t = (en: string, th: string, values?: Record<string, string | number>) =>
    translate(en, th, lang, values);
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingImport, setPendingImport] = useState<Trip | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const days = tripDays(trip);
  const estimate = days * trip.travelers * trip.dailyBudget;
  const money = (value: number) =>
    new Intl.NumberFormat(LOCALES[lang], {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  const update = (fields: Partial<Trip>) => setTrip({ ...trip, ...fields });
  function move(index: number, offset: number) {
    const stops = [...trip.stops];
    [stops[index], stops[index + offset]] = [stops[index + offset], stops[index]];
    update({ stops });
  }
  function dateAt(offset: number) {
    if (!trip.startDate) return '';
    const date = new Date(`${trip.startDate}T12:00:00`);
    date.setDate(date.getDate() + offset);
    return new Intl.DateTimeFormat(LOCALES[lang], {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
  function exportText() {
    const text = [
      trip.name || t('My American adventure', 'ทริปอเมริกาของฉัน'),
      `${days} ${t('days', 'วัน')} · ${trip.travelers} ${t('travelers', 'คน')}`,
      trip.startDate ? `${t('Starts', 'เริ่ม')} ${trip.startDate}` : '',
      '',
      ...trip.stops.flatMap((stop, index) => {
        const state = STATES.find((item) => item.code === stop.code)!;
        return [
          `${index + 1}. ${stateName(state, lang)} — ${stop.days} ${t('days', 'วัน')}`,
          `   ${statePlaces(state, lang).join(' / ')}`,
          stop.notes ? `   ${stop.notes}` : '',
          '',
        ];
      }),
      `${t('Daily budget per traveler', 'งบรายวันต่อคน')}: ${money(trip.dailyBudget)}`,
      `${t('Planning estimate', 'งบประมาณเบื้องต้น')}: ${money(estimate)}`,
      t(
        'Estimate based on your daily budget. Add flights, car rental, and one-off costs separately. Verify travel times and reservations before booking.',
        'ประมาณการจากงบรายวันที่ตั้งเอง คิดเที่ยวบิน ค่าเช่ารถ และค่าใช้จ่ายก้อนใหญ่เพิ่ม ตรวจเวลาเดินทางและการจองก่อนจองจริง',
      ),
      '',
      t('Made with Roam America', 'สร้างด้วย Roam America'),
    ]
      .filter((line) => line !== undefined)
      .join('\n');
    downloadFile('roam-america-itinerary.txt', text, 'text/plain;charset=utf-8');
    notify(t('Your itinerary is ready to download.', 'ดาวน์โหลดแผนเที่ยวได้แล้ว'));
  }
  async function importTrip(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 150000) {
      notify(
        t(
          'This file is too large. Choose a Roam backup under 150 KB.',
          'ไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์สำรอง Roam ไม่เกิน 150 KB',
        ),
      );
      return;
    }
    try {
      const json = JSON.parse(await file.text());
      if (json.version !== 1) throw new Error('Unsupported version');
      setPendingImport(validateTrip(json.trip));
    } catch {
      notify(
        t(
          'Could not read this trip. Choose a valid Roam JSON backup.',
          'อ่านทริปไม่ได้ กรุณาเลือกไฟล์สำรอง JSON ของ Roam ที่ถูกต้อง',
        ),
      );
    }
  }
  return (
    <div className="planner-content">
      <span className="eyebrow">
        <span className="red-dot" />
        {t('MAKE IT YOUR OWN', 'ออกแบบการเดินทางของคุณ')}
      </span>
      <h2>
        {t('A great trip', 'ทริปที่ดี')}
        <br />
        <em>{t('starts here.', 'เริ่มต้นที่นี่')}</em>
      </h2>
      <p className={`planner-save-status ${storageFailed ? 'storage-warning' : ''}`}>
        <Icon name={storageFailed ? 'download' : 'check'} size={15} />
        {storageFailed
          ? t(
              'Browser storage is unavailable. Export a backup to keep your trip.',
              'เบราว์เซอร์บันทึกข้อมูลไม่ได้ กรุณาส่งออกไฟล์สำรองเก็บทริป',
            )
          : t('Saved automatically on this browser', 'บันทึกอัตโนมัติในเบราว์เซอร์นี้')}
      </p>
      <div className="planner-settings">
        <label className="trip-name-label">
          {t('GIVE YOUR TRIP A NAME', 'ตั้งชื่อทริป')}
          <input
            aria-label={t('Trip name', 'ชื่อทริป')}
            placeholder={t('My American adventure', 'ทริปอเมริกาของฉัน')}
            value={trip.name}
            maxLength={80}
            onChange={(event) => update({ name: event.target.value })}
          />
        </label>
        <div className="planner-fields">
          <label>
            <Icon name="calendar" size={16} />
            {t('Start date', 'วันเริ่มทริป')}
            <input
              aria-label={t('Start date', 'วันเริ่มทริป')}
              type="date"
              value={trip.startDate}
              onChange={(event) => {
                if (event.target.value === '' || validDate(event.target.value))
                  update({ startDate: event.target.value });
              }}
            />
          </label>
          <label>
            <Icon name="users" size={16} />
            {t('Travelers', 'ผู้เดินทาง')}
            <input
              aria-label={t('Travelers', 'ผู้เดินทาง')}
              type="number"
              min="1"
              max="20"
              value={trip.travelers}
              onChange={(event) =>
                update({
                  travelers: Math.max(1, Math.min(20, Math.round(Number(event.target.value) || 1))),
                })
              }
            />
          </label>
          <label>
            <Icon name="dollar" size={16} />
            {t('USD / person / day', 'USD / คน / วัน')}
            <input
              aria-label={t('Daily budget in USD', 'งบรายวัน USD')}
              type="number"
              min="0"
              max="10000"
              value={trip.dailyBudget}
              onChange={(event) =>
                update({
                  dailyBudget: Math.max(0, Math.min(10000, Number(event.target.value) || 0)),
                })
              }
            />
          </label>
        </div>
      </div>
      {trip.stops.length === 0 ? (
        <div className="planner-empty">
          <span className="empty-compass">
            <Icon name="route" size={42} />
          </span>
          <h3>{t('Every adventure starts somewhere.', 'ทุกการเดินทางมีจุดเริ่มต้น')}</h3>
          <p>
            {t(
              'Explore a state and add it to your trip. Your days, notes, and route will come together here.',
              'สำรวจรัฐที่ชอบแล้วเพิ่มในทริป วันเที่ยว โน้ต และเส้นทางจะรวมอยู่ที่นี่',
            )}
          </p>
          <button className="button button-red" onClick={onExplore}>
            {t('Find my first stop', 'ค้นหาจุดหมายแรก')}
            <Icon name="arrow" size={17} />
          </button>
        </div>
      ) : (
        <>
          <div className="planner-stops-heading">
            <h3>
              {t('Your journey', 'เส้นทางของคุณ')}{' '}
              <span>
                {trip.stops.length} {t('states', 'รัฐ')}
              </span>
            </h3>
            <button className="text-link" onClick={onExplore}>
              <Icon name="plus" size={15} />
              {t('Add a stop', 'เพิ่มจุดหมาย')}
            </button>
          </div>
          <ol className="trip-stops">
            {trip.stops.map((stop, index) => {
              const state = STATES.find((item) => item.code === stop.code)!;
              const offset = trip.stops
                .slice(0, index)
                .reduce((total, item) => total + item.days, 0);
              return (
                <li key={stop.code} className="trip-stop">
                  <span className="stop-number">{String(index + 1).padStart(2, '0')}</span>
                  <div className="stop-body">
                    <div className="stop-top">
                      <div
                        className="stop-thumbnail"
                        style={{ background: regionColors[state.region] }}
                      >
                        {statePhoto(state) ? (
                          <img src={statePhoto(state).src} alt="" />
                        ) : (
                          <StateShape state={state} />
                        )}
                      </div>
                      <div className="stop-title">
                        <span>
                          {t('DAY', 'วันที่')} {offset + 1}
                          {stop.days > 1 ? `–${offset + stop.days}` : ''}
                          {trip.startDate ? ` · ${dateAt(offset)}` : ''}
                        </span>
                        <h4>{stateName(state, lang)}</h4>
                      </div>
                      <button
                        className="icon-button"
                        aria-label={`${t('Remove', 'ลบ')} ${state.name}`}
                        onClick={() =>
                          update({ stops: trip.stops.filter((item) => item.code !== stop.code) })
                        }
                      >
                        <Icon name="close" size={17} />
                      </button>
                    </div>
                    <p className="stop-places">{statePlaces(state, lang).join(' · ')}</p>
                    <div className="stop-controls">
                      <div className="day-stepper">
                        <button
                          aria-label={`${t('Fewer days in', 'ลดวันใน')} ${state.name}`}
                          disabled={stop.days === 1}
                          onClick={() =>
                            update({
                              stops: trip.stops.map((item) =>
                                item.code === stop.code ? { ...item, days: item.days - 1 } : item,
                              ),
                            })
                          }
                        >
                          <Icon name="minus" size={14} />
                        </button>
                        <span>
                          {stop.days} {t('days', 'วัน')}
                        </span>
                        <button
                          aria-label={`${t('More days in', 'เพิ่มวันใน')} ${state.name}`}
                          disabled={stop.days === 30}
                          onClick={() =>
                            update({
                              stops: trip.stops.map((item) =>
                                item.code === stop.code ? { ...item, days: item.days + 1 } : item,
                              ),
                            })
                          }
                        >
                          <Icon name="plus" size={14} />
                        </button>
                      </div>
                      <div className="reorder-buttons">
                        <button
                          className="icon-button"
                          disabled={index === 0}
                          aria-label={`${t('Move up', 'เลื่อนขึ้น')} ${state.name}`}
                          onClick={() => move(index, -1)}
                        >
                          <Icon name="arrow-up" size={15} />
                        </button>
                        <button
                          className="icon-button"
                          disabled={index === trip.stops.length - 1}
                          aria-label={`${t('Move down', 'เลื่อนลง')} ${state.name}`}
                          onClick={() => move(index, 1)}
                        >
                          <Icon name="arrow-down" size={15} />
                        </button>
                      </div>
                    </div>
                    <textarea
                      aria-label={`${t('Notes for', 'โน้ตสำหรับ')} ${state.name}`}
                      placeholder={t(
                        'A café to try, a place to stay, a little reminder…',
                        'คาเฟ่ที่อยากลอง ที่พัก หรือสิ่งที่ต้องจำ…',
                      )}
                      maxLength={1000}
                      rows={2}
                      value={stop.notes}
                      onChange={(event) =>
                        update({
                          stops: trip.stops.map((item) =>
                            item.code === stop.code ? { ...item, notes: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="budget-summary">
            <div>
              <span>{t('THE ADVENTURE', 'ระยะเวลาทริป')}</span>
              <strong>
                {days} <small>{t('days', 'วัน')}</small>
              </strong>
            </div>
            <div>
              <span>{t('YOUR BUDGET ESTIMATE', 'ประมาณการงบของคุณ')}</span>
              <strong>{money(estimate)}</strong>
            </div>
          </div>
          <p className="fine-print">
            {t(
              'Calculated from your daily budget × travelers × days. This is a planning estimate; add flights, car rental, and one-off costs separately. Route order does not calculate driving times.',
              'คำนวณจากงบรายวัน × จำนวนคน × จำนวนวัน เป็นเพียงงบเบื้องต้น ควรคิดเที่ยวบิน ค่าเช่ารถ และค่าใช้จ่ายก้อนใหญ่เพิ่ม ลำดับทริปไม่ได้คำนวณเวลาขับรถ',
            )}
          </p>
          <button className="button button-red export-main" onClick={exportText}>
            <Icon name="download" size={18} />
            {t('Download my itinerary', 'ดาวน์โหลดแผนเที่ยว')}
            <Icon name="arrow" size={18} />
          </button>
        </>
      )}
      <div className="backup-actions">
        <button
          className="text-link"
          onClick={() => {
            downloadFile(
              'roam-trip-backup.json',
              JSON.stringify({ version: 1, trip }, null, 2),
              'application/json',
            );
            notify(t('Trip backup downloaded.', 'ดาวน์โหลดไฟล์สำรองทริปแล้ว'));
          }}
        >
          <Icon name="download" size={14} />
          {t('Export backup', 'ส่งออกไฟล์สำรอง')}
        </button>
        <button className="text-link" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={14} />
          {t('Import trip', 'นำเข้าทริป')}
        </button>
        {trip.stops.length > 0 && (
          <button
            className="text-link clear-trip"
            onClick={() => setConfirmClear((value) => !value)}
          >
            <Icon name="trash" size={14} />
            {t('Clear trip', 'ล้างทริป')}
          </button>
        )}
        <input
          hidden
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={importTrip}
          aria-label={t('Import trip file', 'นำเข้าไฟล์ทริป')}
        />
      </div>
      {pendingImport && (
        <div className="inline-confirm" role="alert">
          <strong>{pendingImport.name || t('Imported trip', 'ทริปที่นำเข้า')}</strong>
          <p>
            {pendingImport.stops.length} {t('states', 'รัฐ')} · {tripDays(pendingImport)}{' '}
            {t(
              'days. Importing replaces the trip currently on this browser.',
              'วัน การนำเข้าจะแทนที่ทริปปัจจุบันในเบราว์เซอร์นี้',
            )}
          </p>
          <button
            className="button button-red"
            onClick={() => {
              setTrip(pendingImport);
              setPendingImport(null);
              notify(t('Trip imported.', 'นำเข้าทริปแล้ว'));
            }}
          >
            {t('Replace with this trip', 'แทนที่ด้วยทริปนี้')}
          </button>
          <button className="button button-outline" onClick={() => setPendingImport(null)}>
            {t('Cancel', 'ยกเลิก')}
          </button>
        </div>
      )}
      {confirmClear && (
        <div className="inline-confirm" role="alert">
          <p>
            {t(
              'Remove all stops, notes, dates, and budget settings from this trip?',
              'ลบจุดหมาย โน้ต วันที่ และการตั้งค่างบทั้งหมดของทริปนี้หรือไม่?',
            )}
          </p>
          <button
            className="button button-red"
            onClick={() => {
              setTrip({ ...EMPTY_TRIP, stops: [] });
              setConfirmClear(false);
              notify(t('Trip cleared.', 'ล้างทริปแล้ว'));
            }}
          >
            {t('Clear this trip', 'ล้างทริปนี้')}
          </button>
          <button className="button button-outline" onClick={() => setConfirmClear(false)}>
            {t('Keep my trip', 'เก็บทริปไว้')}
          </button>
        </div>
      )}
    </div>
  );
}
