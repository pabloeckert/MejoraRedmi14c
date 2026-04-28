const CACHE_VERSION = 'v3';
const CACHE_STATIC = `mejora-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `mejora-dynamic-${CACHE_VERSION}`;
const CACHE_FONTS = `mejora-fonts-${CACHE_VERSION}`;

// App shell — critical assets for offline
const APP_SHELL = [
  '/MejoraRedmi14c/',
  '/MejoraRedmi14c/index.html',
  '/MejoraRedmi14c/manifest.json',
  '/MejoraRedmi14c/icons.svg',
  '/MejoraRedmi14c/favicon.svg',
  '/MejoraRedmi14c/icon.png',
];

// Install — precache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate — cleanup old caches
self.addEventListener('activate', (e) => {
  const keep = [CACHE_STATIC, CACHE_DYNAMIC, CACHE_FONTS];
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategies
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Google Fonts → cache-first (rarely change)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(request, CACHE_FONTS));
    return;
  }

  // Static assets (JS, CSS, images, icons) → stale-while-revalidate
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff2')
  ) {
    e.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
    return;
  }

  // Navigation requests → network-first with offline fallback
  if (request.mode === 'navigate') {
    e.respondWith(networkFirst(request, CACHE_DYNAMIC));
    return;
  }

  // Everything else → network-first
  e.respondWith(networkFirst(request, CACHE_DYNAMIC));
});

// --- Strategies ---

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

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback for navigation
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/MejoraRedmi14c/index.html');
      if (fallback) return fallback;
    }

    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}
