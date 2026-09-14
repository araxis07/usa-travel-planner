import { STATES, type Trip } from '../data/travel';
export async function saveOffline(trip: Trip) {
  if (!('serviceWorker' in navigator)) throw new Error('Offline unavailable');
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration?.active) throw new Error('Offline unavailable');
  const photos = trip.stops
    .flatMap((stop) => STATES.find((s) => s.code === stop.code)?.photos.map((p) => p.src) ?? [])
    .flatMap((src) => [
      src,
      ...[480, 960].map((width) =>
        src
          .replace('/images/', '/images/responsive/')
          .replace(/\.(jpg|jpeg|png)$/, `-${width}.webp`),
      ),
    ]);
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => {
      channel.port1.close();
      reject(new Error('Offline timeout'));
    }, 90000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      channel.port1.close();
      if (event.data?.ok) resolve();
      else reject(new Error('Offline download failed'));
    };
    registration.active!.postMessage({ type: 'SAVE_TRIP', photos }, [channel.port2]);
  });
}
