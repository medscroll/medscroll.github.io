const SHELL_CACHE = 'studia-shell-v1';
const COURS_CACHE = 'studia-cours-v1';

const SHELL_FILES = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k !== SHELL_CACHE && k !== COURS_CACHE)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Cours depuis medscroll.github.io
  if (url.hostname === 'medscroll.github.io') {
    event.respondWith((async () => {
      const cache = await caches.open(COURS_CACHE);
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const resp = await fetch(req);
        if (resp.ok) cache.put(req, resp.clone());
        return resp;
      } catch {
        return new Response('', { status: 504 });
      }
    })());
    return;
  }

  // App-shell
  event.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try { return await fetch(req); }
    catch {
      if (req.mode === 'navigate') return caches.match('./index.html');
      return new Response('', { status: 504 });
    }
  })());
});
