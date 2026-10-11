import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { readDestination } from './lib/destinations';
import { loadStateDetails } from './data/state-details';
import { loadCityGuide } from './data/city-details';
import { initialLanguage, translate } from './lib/i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const Studio = import.meta.env.MODE === 'studio' ? lazy(() => import('./studio/Studio')) : null;
async function start() {
  const destination = readDestination();
  let initialGuide: typeof import('./components/DestinationPage').default | undefined;
  if (
    destination &&
    rootElement!.hasChildNodes() &&
    new URLSearchParams(location.search).get('view') !== 'planner' &&
    !new URLSearchParams(location.hash.slice(1)).get('share')
  ) {
    // Keep the published guide readable until its interactive replacement is ready.
    const [module] = await Promise.all([
      import('./components/DestinationPage'),
      loadStateDetails(destination.state.code),
      loadCityGuide(
        destination.placeIndex === undefined
          ? undefined
          : `${destination.state.code}-${destination.placeIndex}`,
      ),
    ]);
    initialGuide = module.default;
  }
  const root = ReactDOM.createRoot(rootElement!);
  root.render(
    <React.StrictMode>
      {Studio && location.pathname === '/studio' ? (
        <Suspense fallback={<p>กำลังเปิด Content Studio…</p>}>
          <Studio />
        </Suspense>
      ) : (
        <App initialGuide={initialGuide} />
      )}
    </React.StrictMode>,
  );
}
void start().catch(() => {
  // A failed guide module leaves the published content and its links available for reload.
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.addEventListener('click', () => location.reload());
  retry.textContent = translate('Try again', 'ลองอีกครั้ง', initialLanguage());
  retry.className = 'button button-navy';
  rootElement.prepend(retry);
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Offline remains optional when browser storage is disabled. */
    });
  });
}
