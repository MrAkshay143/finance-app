const CACHE_NAME = 'finance-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA: Static cache prefill warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Bypass API calls, websockets, and non-GET methods
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/socket.io/')
  ) {
    return;
  }

  // Navigation requests: Network-first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Static assets: Cache-first with MIME verification
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const url = event.request.url;
      const isJs = url.includes('.js');
      const isCss = url.includes('.css');

      if (cachedResponse) {
        const cachedType = cachedResponse.headers.get('content-type') || '';
        // If cached response has corrupted MIME type (e.g. HTML or JSON for a JS chunk), purge it
        if ((isJs && !cachedType.includes('javascript')) || (isCss && !cachedType.includes('css'))) {
          caches.open(CACHE_NAME).then((cache) => cache.delete(event.request));
        } else {
          return cachedResponse;
        }
      }

      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const contentType = networkResponse.headers.get('content-type') || '';
          // Only cache JS/CSS files if Content-Type is valid (never cache HTML fallback or JSON errors)
          const isValidMime =
            (!isJs || contentType.includes('javascript')) &&
            (!isCss || contentType.includes('css'));

          if (isValidMime) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return networkResponse;
      });
    })
  );
});
