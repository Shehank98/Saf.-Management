// Safari Adventures — Service Worker
const CACHE_NAME = 'safari-adventures-v1';
const STATIC_ASSETS = [
  '/pwa/',
  '/pwa/index.html',
  '/pwa/styles.css',
  '/pwa/manifest.json',
  '/pwa/data.jsx',
  '/pwa/components.jsx',
  '/pwa/app.jsx',
  '/pwa/screens-auth.jsx',
  '/pwa/screens-customer.jsx',
  '/pwa/screens-owner.jsx',
  '/pwa/screens-vendor.jsx',
  '/pwa/screens-admin.jsx',
  '/pwa/screens-shared.jsx',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
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

// Network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API requests: network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: cache first
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

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Safari Adventures';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/pwa/icons/icon-192.png',
    badge: '/pwa/icons/icon-192.png',
    tag: data.tag || 'safari-notif',
    data: data.url || '/pwa/',
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const url = event.notification.data || '/pwa/';
      const client = windowClients.find((c) => c.url === url && 'focus' in c);
      return client ? client.focus() : clients.openWindow(url);
    })
  );
});
