/* VideoClub – service worker: la app abre sin internet */
const V = 'videoclub-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const own = u.origin === location.origin;
  const font = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!own && !font) return; // TMDB, IMDb, proxies: siempre directo a internet

  if (r.mode === 'navigate') { // abrir la app (también con ?text=… al compartir)
    e.respondWith(fetch(r).then(x => { caches.open(V).then(c => c.put('./index.html', x.clone())); return x; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(x => { if (x.ok || x.type === 'opaque') caches.open(V).then(c => c.put(r, x.clone())); return x; }).catch(() => hit);
    return hit || net;
  }));
});
