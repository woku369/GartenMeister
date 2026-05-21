// GartenMeister Upload — Service Worker
// Cached die Upload-Shell für Offline-Nutzung (Android PWA).
// API-Calls werden NICHT gecacht — die gehen immer ans Netz.

const CACHE     = 'gm-upload-v1';
const SHELL     = ['/upload.html', '/manifest.json'];

// ── Install: Shell cachen ────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// ── Activate: Alte Caches löschen ───────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: Strategie ────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API-Anfragen immer direkt ans Netz (kein Cache)
  if (url.pathname.startsWith('/api/')) {
    return; // Browser kümmert sich selbst
  }

  // Shell: Network-first, Fallback auf Cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Erfolgreiche Antwort → Cache aktualisieren
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
