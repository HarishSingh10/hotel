const CACHE_NAME = 'zenbourg-v1';

// We must at least have an install event or similar, 
// though for our 'Direct Handshake' goal, the fetch listener is the key.
self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('[SW] Service Worker Installed');
});

self.addEventListener('activate', (event) => {
    // Clear old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Chrome requires a fetch handler to consider the site "Installable" as a PWA.
// To avoid "Application error: a client-side exception has occurred" which can 
// happen if a Service Worker interferes with Next.js hydration or chunk loading incorrectly,
// we implement a simple bypass for all non-essential assets while keeping the 
// respondWith call to satisfy PWA criteria.
self.addEventListener('fetch', (event) => {
    // Standard bypass for external API calls and development hot-reloads
    if (event.request.url.includes('/api/') || event.request.url.includes('hot-reloader')) {
        return;
    }

    // For everything else, we fulfill the request normally.
    // This respondWith() call is what signals to the browser that this is a PWA.
    event.respondWith(
        fetch(event.request).catch(() => {
            // Fallback for offline if we ever implement it
            return caches.match(event.request);
        })
    );
});
