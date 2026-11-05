// සරල service worker: ඇප් ෆයිල් cache කරනවා. API ඉල්ලීම් කවදාවත් cache කරන්නේ නැහැ.
const CACHE = 'nexis-geo-v1';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'config.js', 'icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // network first, නැත්නම් cache
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
