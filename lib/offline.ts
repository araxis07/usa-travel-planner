import { STATES, type Trip } from '../data/travel';
export const offlinePhotoPaths = (src: string) => [
  src,
  ...[480, 640, 960].map((width) =>
    src.replace('/images/', '/images/responsive/').replace(/\.(jpg|jpeg|png)$/, `-${width}.webp`),
  ),
];
export type OfflineProgress = { completed: number; total: number };
export async function saveOffline(trip: Trip, onProgress?: (progress: OfflineProgress) => void) {
  if (!('serviceWorker' in navigator)) throw new Error('Offline unavailable');
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration?.active) throw new Error('Offline unavailable');
  const photos = trip.stops
    .flatMap((stop) => STATES.find((s) => s.code === stop.code)?.photos.map((p) => p.src) ?? [])
    .flatMap(offlinePhotoPaths);
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timedOut = () => {
      channel.port1.close();
      reject(new Error('Offline timeout'));
    };
    let timeout = setTimeout(timedOut, 90000);
    channel.port1.onmessage = (event) => {
      if (event.data?.type === 'progress') {
        const { completed, total } = event.data;
        if (
          Number.isInteger(completed) &&
          Number.isInteger(total) &&
          total > 0 &&
          completed >= 0 &&
          completed <= total
        ) {
          clearTimeout(timeout);
          timeout = setTimeout(timedOut, 90000);
          onProgress?.({ completed, total });
        }
        return;
      }
      clearTimeout(timeout);
      channel.port1.close();
      if (event.data?.ok) resolve();
      else reject(new Error('Offline download failed'));
    };
    registration.active!.postMessage({ type: 'SAVE_TRIP', photos, progress: true }, [
      channel.port2,
    ]);
  });
}
