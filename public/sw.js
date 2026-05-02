const CACHE_NAME = 'staff-v1';
const OFFLINE_URLS = ['/staff', '/staff/scan', '/staff/bookings'];

// Cache shell on install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Network-first for API, cache-first for shell
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API calls: network only (no caching of sensitive data)
    if (url.pathname.startsWith('/api/')) return;

    // Navigation: network-first, fallback to cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() =>
                caches.match(event.request).then((r) => r ?? caches.match('/staff'))
            )
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((res) => {
                if (res.ok) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
                }
                return res;
            });
        })
    );
});
