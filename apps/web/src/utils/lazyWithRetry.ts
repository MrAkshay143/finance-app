import React, { ComponentType, lazy } from 'react';

// Auto-retry dynamic import on network failure with chunk refresh recovery
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      function attempt(remainingRetries: number) {
        factory()
          .then(resolve)
          .catch((error) => {
            const errStr = String(error?.message || error || '');
            const isChunkLoadFailed =
              error?.name === 'ChunkLoadError' ||
              /loading dynamically imported module/i.test(errStr) ||
              /Failed to fetch dynamically imported module/i.test(errStr) ||
              /disallowed MIME type/i.test(errStr) ||
              /Importing a module script failed/i.test(errStr);

            if (isChunkLoadFailed && typeof window !== 'undefined') {
              const lastReload = sessionStorage.getItem('finance_chunk_reload');
              const now = Date.now();
              // Prevent infinite reload loops: max 1 automatic reload per 10 seconds
              if (!lastReload || now - Number(lastReload) > 10000) {
                sessionStorage.setItem('finance_chunk_reload', String(now));
                console.warn('[PWA] Stale chunk detected during import; reloading to latest app version...');
                window.location.reload();
                return;
              }
            }

            if (remainingRetries > 0) {
              setTimeout(() => attempt(remainingRetries - 1), interval);
            } else {
              reject(error);
            }
          });
      }
      attempt(retries);
    })
  );
}
