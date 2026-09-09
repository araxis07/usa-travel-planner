import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { drivingRoute, type RoutePoint, type DrivingRoute } from '../lib/routing';
import { translate, LOCALES, type Language } from '../lib/i18n';
import Icon from './Icon';

export default function RouteMap({
  points,
  lang,
  routing = false,
  activityMinutes = 0,
}: {
  points: RoutePoint[];
  lang: Language;
  routing?: boolean;
  activityMinutes?: number;
}) {
  const [visible, setVisible] = useState(false);
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [mapError, setMapError] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const request = useRef<AbortController | null>(null);
  const key = JSON.stringify(points);
  const t = (en: string, th: string) => translate(en, th, lang);
  useEffect(() => {
    request.current?.abort();
    setRoute(null);
    setStatus('idle');
    return () => request.current?.abort();
  }, [key]);
  useEffect(() => {
    if (!visible || !container.current || !points.length) return;
    let cancelled = false;
    setMapError(false);
    Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
      .then(([L]) => {
        if (cancelled || !container.current) return;
        const map = L.map(container.current, { scrollWheelZoom: false });
        mapRef.current = map;
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
          .on('tileerror', () => {
            if (!cancelled) setMapError(true);
          })
          .addTo(map);
        points.forEach((p, i) => {
          const label = document.createElement('span');
          label.textContent = `${i + 1}. ${p.name}`;
          L.marker(p.coordinates, {
            title: p.name,
            alt: p.name,
            icon: L.divIcon({
              className: 'route-pin',
              html: String(i + 1),
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            }),
          })
            .bindPopup(label)
            .addTo(map);
        });
        if (route) L.polyline(route.geometry, { color: '#ac263c', weight: 4 }).addTo(map);
        map.fitBounds(L.latLngBounds(route?.geometry ?? points.map((p) => p.coordinates)), {
          padding: [35, 35],
          maxZoom: 11,
        });
        map.zoomControl
          .getContainer()
          ?.querySelector('.leaflet-control-zoom-in')
          ?.setAttribute('aria-label', t('Zoom in map', 'ขยายแผนที่'));
        map.zoomControl
          .getContainer()
          ?.querySelector('.leaflet-control-zoom-out')
          ?.setAttribute('aria-label', t('Zoom out map', 'ย่อแผนที่'));
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [visible, key, route, lang]);
  async function calculate() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStatus('loading');
    setRoute(null);
    try {
      const result = await drivingRoute(points, controller.signal);
      if (!controller.signal.aborted) {
        setRoute(result);
        setStatus('idle');
        setVisible(true);
      }
    } catch {
      if (!controller.signal.aborted) setStatus('error');
    }
  }
  const number = (n: number) =>
    new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 0 }).format(n);
  return (
    <section className="route-map-panel" aria-label={t('Destination map', 'แผนที่จุดหมาย')}>
      <div className="route-map-actions">
        <button
          className="button button-outline"
          onClick={() => setVisible((v) => !v)}
          aria-expanded={visible}
        >
          <Icon name="map" size={17} />
          {visible ? t('Hide map', 'ซ่อนแผนที่') : t('Show map', 'แสดงแผนที่')}
        </button>
        {routing && (
          <button
            className="button button-navy"
            disabled={points.length < 2 || points.length > 10 || status === 'loading'}
            onClick={calculate}
          >
            <Icon name="route" size={17} />
            {status === 'loading'
              ? t('Calculating route…', 'กำลังคำนวณเส้นทาง…')
              : t('Calculate driving route', 'คำนวณเส้นทางขับรถ')}
          </button>
        )}
      </div>
      {visible && (
        <div
          ref={container}
          className="live-route-map"
          aria-label={t('Interactive map', 'แผนที่โต้ตอบ')}
        />
      )}
      {mapError && (
        <p role="status">
          {t(
            'Map tiles could not load. Destination links are still available.',
            'โหลดภาพแผนที่ไม่ได้ ยังเปิดลิงก์จุดหมายได้',
          )}
        </p>
      )}
      {status === 'error' && (
        <p role="alert">
          {t(
            'No driving route is available right now. Try again or open directions below. Islands and remote areas may need a boat, flight, or a different entrance.',
            'ยังหาเส้นทางขับรถไม่ได้ ลองอีกครั้งหรือเปิดเส้นทางด้านล่าง เกาะและพื้นที่ห่างไกลอาจต้องใช้เรือ เที่ยวบิน หรือทางเข้าอื่น',
          )}
        </p>
      )}
      {route && (
        <div className="route-result" role="status">
          <strong>
            {number(route.distance / 1000)} km · {number(route.duration / 60)}{' '}
            {t('minutes driving', 'นาทีขับรถ')}
          </strong>
          <span>
            {t('Activity time', 'เวลาเที่ยว')} + {t('Driving time', 'เวลาขับรถ')}:{' '}
            {number(activityMinutes + route.duration / 60)} {t('minutes', 'นาที')}
          </span>
          {activityMinutes + route.duration / 60 > 720 && (
            <p>
              {t(
                'A long day: allow more time or move an activity to another day.',
                'วันนี้แน่นมาก ควรเผื่อเวลาเพิ่มหรือย้ายกิจกรรมไปวันอื่น',
              )}
            </p>
          )}
        </div>
      )}
      <p className="fine-print">
        {t(
          'Pins mark approximate destination areas, not entrances. Confirm your parking or access point before traveling.',
          'หมุดระบุพื้นที่จุดหมายโดยประมาณ ไม่ใช่ทางเข้า กรุณาเช็กจุดจอดรถหรือทางเข้าก่อนเดินทาง',
        )}
      </p>
      {routing && (
        <p className="fine-print">
          {t(
            'Use 2–10 mapped stops. Driving estimates exclude live traffic, breaks, and seasonal closures. Custom activities are not included. Requests send these coordinates to the routing service.',
            'ใช้สถานที่บนแผนที่ 2–10 จุด เวลาขับรถไม่รวมจราจรจริง เวลาพัก และการปิดตามฤดูกาล กิจกรรมที่ตั้งเองไม่ถูกนำมาคำนวณ คำขอจะส่งพิกัดเหล่านี้ไปยังบริการเส้นทาง',
          )}
        </p>
      )}
      <div className="map-credits">
        <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">
          {t('Improve the map', 'ปรับปรุงข้อมูลแผนที่')}
        </a>
        {routing && (
          <>
            <a href="https://map.project-osrm.org/about.html" target="_blank" rel="noreferrer">
              OSRM / FOSSGIS
            </a>
            <a
              href="https://www.fossgis.de/datenschutzerkl%C3%A4rung/"
              target="_blank"
              rel="noreferrer"
            >
              {t('Service privacy', 'ความเป็นส่วนตัวของบริการ')}
            </a>
          </>
        )}
      </div>
    </section>
  );
}
