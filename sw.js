/**
 * Service Worker: Offline Cache-First Strategy
 * Ensures single-transfer loading with 100% offline local execution.
 */

const CACHE_NAME = 'v8-calc-v1.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './css/base.css',
  './css/calculator.css',
  './css/responsive.css',
  './js/app.js',
  './js/engine/index.js',
  './js/engine/tokens.js',
  './js/engine/decimal.js',
  './js/engine/lexer.js',
  './js/engine/parser.js',
  './js/engine/evaluator.js',
  './js/ui/display.js',
  './js/ui/history.js',
  './js/ui/keypad.js',
  './js/ui/keyboard.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching all local assets for offline execution');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return instantly from local cache (zero network latency)
        return cachedResponse;
      }
      // If not yet in cache, fetch and store
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
