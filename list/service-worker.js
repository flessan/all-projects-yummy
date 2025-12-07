const CACHE = 'list2do-cache-v2';
const ASSETS = ['./', './index.html', './style.css', './app.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // use cache-first for app shell assets
  if (ASSETS.some(a => a === url.pathname || a === url.pathname.replace(/^\/+/,''))) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    return;
  }
  // otherwise network-first with cache fallback
  e.respondWith(fetch(e.request).then(res => {
    // optional: cache dynamic responses (skip for non-GET)
    return res;
  }).catch(() => caches.match(e.request)));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window'}).then( clientList => {
    for (const client of clientList) { if ('focus' in client) return client.focus(); }
    if (clients.openWindow) return clients.openWindow('.');
  }));
});