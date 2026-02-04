// NOTE: Keep URLs relative so the PWA also works when deployed under a context path (e.g. /sig-senegal2)
const CACHE_NAME = 'sig-senegal-cache-v2';
const OFFLINE_URL = 'offline.html';
const ASSETS = [
  './',
  'index.html',
  'offline.html',
  'manifest.json',
  'css/leaflet.css',
  'css/L.Control.Locate.min.css',
  'css/MarkerCluster.css',
  'css/MarkerCluster.Default.css',
  'css/leaflet-search.css',
  'css/leaflet-measure.css',
  'js/leaflet.js',
  'js/L.Control.Locate.min.js',
  'images/icons/icon-192.svg'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  // For navigation requests, try network first then cache then offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request).then(function(response) {
          return response || caches.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  // For other requests, use cache first, then network, then fallback
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).then(function(networkResponse) {
        // Optionally cache the new resource
        return caches.open(CACHE_NAME).then(function(cache) {
          try { cache.put(event.request, networkResponse.clone()); } catch (e) {}
          return networkResponse;
        });
      }).catch(function() {
        // fallback to cached asset if available
        return caches.match(OFFLINE_URL);
      });
    })
  );
});