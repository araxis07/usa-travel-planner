import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
const Studio = import.meta.env.MODE === 'studio' ? lazy(() => import('./studio/Studio')) : null;
root.render(
  <React.StrictMode>
    {Studio && location.pathname === '/studio' ? (
      <Suspense fallback={<p>กำลังเปิด Content Studio…</p>}>
        <Studio />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
