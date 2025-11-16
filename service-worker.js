const CACHE_NAME = 'Sone™-pwa-cache-v2';
const urlsToCache = [
    '/sone-/',
    '/sone-/index.html',
    '/sone-/manifest.json',
    '/sone-/icon-192x192.png',
    '/sone-/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) return caches.delete(cacheName);
                })
            )
        )
    );
});

// Estrategia cache + red para requests estáticos
self.addEventListener('fetch', (event) => {
    const requestURL = new URL(event.request.url);

    // Ignorar extensiones de navegador
    if (requestURL.protocol.startsWith('chrome-extension')) return;

    // No cachear llamadas a Supabase Auth/API
    if (requestURL.hostname.endsWith('supabase.co')) {
        event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
        return;
    }

    // Cache first para archivos estáticos
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') return fetchResponse;
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                return fetchResponse;
            });
        }).catch(() => {
            // fallback si falla red/cache
        })
    );
});
