const CACHE_NAME = 'pwa-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/inventory',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/safari-pinned-tab.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event - handle network requests with caching strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Handle API requests differently from static assets
  if (event.request.url.includes('/api/') || event.request.url.includes('/upload')) {
    // For API requests, try network first, fallback to cache if offline
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
        .catch(() => {
          // If both fail, return a custom offline response for API calls
          if (event.request.url.includes('/api/')) {
            return new Response(JSON.stringify({ error: 'Offline mode - API unavailable' }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          return new Response('Offline mode - resource unavailable');
        })
    );
    return;
  }
  
  // For static assets, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // If network fails, return cached version if available
        return caches.match(event.request);
      });
    }),
  );
});
