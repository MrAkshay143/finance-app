import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.js';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

// Auto-recover from stale chunks on new deployment
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    const lastReload = sessionStorage.getItem('finance_chunk_reload');
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 10000) {
      sessionStorage.setItem('finance_chunk_reload', String(now));
      console.warn('[Vite] Preload error detected; refreshing page to load updated bundle...');
      window.location.reload();
    }
  });
}

if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  import.meta.env.PROD
) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('Finance PWA ServiceWorker active with scope:', registration.scope);

        // Immediate background update check
        registration.update().catch(() => {});

        // Check for updates periodically (every 3 minutes)
        setInterval(() => {
          registration.update().catch(() => {});
        }, 3 * 60 * 1000);

        // Check for updates whenever the window/tab becomes visible again
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });
      })
      .catch((err) => {
        console.warn('Finance PWA ServiceWorker registration failed:', err);
      });
  });
}
