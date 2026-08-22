self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('studio-flow-v1').then((cache) => cache.addAll(['/', '/app', '/manifest.webmanifest', '/favicon.svg'])));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).then((response) => {
    const copy = response.clone();
    caches.open('studio-flow-v1').then((cache) => cache.put(request, copy));
    return response;
  }).catch(() => caches.match(request).then((cached) => cached || (request.mode === 'navigate' ? caches.match('/') : Response.error()))));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients[0];
    if (existing) return existing.focus();
    return self.clients.openWindow('/');
  }));
});
