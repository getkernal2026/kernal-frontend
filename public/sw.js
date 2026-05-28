// Kernel ERP — Minimal Service Worker
// Satisfies Chrome's PWA installability requirements.
// Caches the app shell on install for basic offline resilience.

const CACHE_NAME = 'kernel-erp-v1';

// App shell files to pre-cache
const PRECACHE = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Remove old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy: always try network, fall back to cache
  // This ensures users always get fresh data from the API
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Don't intercept API calls to Railway backend or Supabase
  if (
    url.hostname.includes('railway.app') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for the app shell
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
