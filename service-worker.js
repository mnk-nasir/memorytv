/**
 * service-worker.js
 * MemoryTV PWA Service Worker
 * Handles offline caching, background sync, and push notifications.
 */

const CACHE_VERSION   = 'memorytv-v1';
const STATIC_CACHE    = `${CACHE_VERSION}-static`;
const MEDIA_CACHE     = `${CACHE_VERSION}-media`;
const API_CACHE       = `${CACHE_VERSION}-api`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/sidebar.css',
  '/css/media.css',
  '/css/tv-mode.css',
  '/css/connect.css',
  '/js/app.js',
  '/js/data.js',
  '/js/tv.js',
  '/js/filters.js',
  '/js/channels.js',
  '/js/auth.js',
  '/assets/banner.svg',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap',
];

// ── INSTALL ────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing MemoryTV service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('memorytv-') && key !== STATIC_CACHE && key !== MEDIA_CACHE && key !== API_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH STRATEGY ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Google / Apple API calls — network first, cache fallback
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('appleid.apple.com') ||
      url.hostname.includes('icloud.com')) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // Media files (images/video) — cache first
  if (request.destination === 'image' || request.destination === 'video') {
    event.respondWith(cacheFirst(request, MEDIA_CACHE));
    return;
  }

  // Static assets — cache first
  if (STATIC_ASSETS.some(asset => request.url.endsWith(asset)) ||
      url.pathname.match(/\.(css|js|svg|png|ico|woff2?)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation — network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(networkFirst(request, API_CACHE, 3000));
});

// ── CACHE STRATEGIES ──────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName, timeout = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timer);
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    });
  }
}

// ── BACKGROUND SYNC ───────────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-media') {
    event.waitUntil(syncMediaLibrary());
  }
});

async function syncMediaLibrary() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'SYNC_STARTED' }));
  // Sync logic handled by auth.js in the main thread
  clients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETE' }));
}

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'MemoryTV', {
      body: data.body || 'New memories synced!',
      icon: '/assets/icon-192.png',
      badge: '/assets/icon-192.png',
      tag: 'memorytv',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
