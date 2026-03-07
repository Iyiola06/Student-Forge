const CACHE_NAME = 'vuistudify-cache-v1';

// A lightweight list of essential assets to precache.
// We keep this minimal to ensure fast installation.
const PRECACHE_ASSETS = [
    '/',
    '/offline.html',
    '/logo-favicon.png'
];

// Install Event - Precache essential assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Precaching app shell...');
            // Use catch here to avoid failing the entire install if one asset is missing
            return Promise.allSettled(
                PRECACHE_ASSETS.map(url => cache.add(url).catch(err => console.error(`[Service Worker] Failed to cache ${url}:`, err)))
            );
        })
    );
});

// Activate Event - Clean up old caches if the CACHE_NAME changes
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Stale-while-revalidate for assets, Network-first for navigation.
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Ignore non-GET requests and cross-origin requests (like Supabase API or Google Fonts)
    if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
        return;
    }

    // Use a Network-First strategy for HTML document navigations (e.g. loading a new page).
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request.url)
                .then((response) => {
                    // If network works, put a copy in the cache and return the response.
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // If network fails, try the cache for this request.
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // If the requested page isn't in cache, return the offline fallback.
                        return caches.match('/offline.html');
                    });
                })
        );
        return;
    }

    // Network-First for API requests, fallback to cache
    if (request.url.includes('/api/')) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // Stale-While-Revalidate strategy for all other assets (JS, CSS, Images).
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Ignore fetch errors during stale-while-revalidate
                });

            // Return the cached response immediately if available, while updating cache in background.
            return cachedResponse || fetchPromise;
        })
    );
});

self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const title = data.title || 'Study Reminder';
    const options = {
        body: data.body || 'Time for your daily study session!',
        icon: '/logo.png', // Fallback to a logo if available
        badge: '/logo.png',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
