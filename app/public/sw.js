const SHELL_CACHE = 'pqr-shell-v1';
const PROTECTED_CACHE = 'pqr-buyer-offline-v1';

const PUBLIC_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/logo-brand.png',
  '/media/panetone-classico.jpg',
  '/media/chocotone-recheado.jpg',
  '/media/mini-e-copo.jpg',
  '/media/atelie-natal.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PUBLIC_SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== PROTECTED_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_PROTECTED_CACHE') {
    event.waitUntil(caches.delete(PROTECTED_CACHE));
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Protected API content: Network-first, falls back to authenticated offline cache ONLY if previously fetched cleanly by a logged-in buyer.
  if (url.pathname === '/api/content') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(PROTECTED_CACHE);
            await cache.put(request, response.clone());
          } else if (response.status === 401 || response.status === 403) {
            await caches.delete(PROTECTED_CACHE);
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(PROTECTED_CACHE);
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: 'Sem ligação e sem cópia offline autorizada.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          });
        })
    );
    return;
  }

  // Session & download APIs never bypass server auth
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static app shell & JS/CSS bundles: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then(async (response) => {
          if (response && response.ok && response.type === 'basic') {
            const cache = await caches.open(SHELL_CACHE);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

