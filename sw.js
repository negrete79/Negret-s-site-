const VERSION = 'v4';
const STATIC_CACHE  = `esperanca-static-${VERSION}`;
const RUNTIME_CACHE = `esperanca-runtime-${VERSION}`;
const IMG_CACHE     = `esperanca-img-${VERSION}`;
const ALL = [STATIC_CACHE, RUNTIME_CACHE, IMG_CACHE];

const PRECACHE = ['./', './index.html', './manifest.json', './icons/icon.svg', './icons/icon-maskable.svg'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !ALL.includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  /* dados.js: REDE PRIMEIRO — para publicações aparecerem rápido */
  if (/dados\.js(\?.*)?$/.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      try {
        const fresh = await fetch(request);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        return (await cache.match(request)) || Response.error();
      }
    })());
    return;
  }

  if (request.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  const isImg = request.destination === 'image';
  const cacheName = isImg ? IMG_CACHE : RUNTIME_CACHE;

  e.respondWith((async () => {
    const cache  = await caches.open(cacheName);
    const cached = await cache.match(request);
    const rede = fetch(request)
      .then(res => { if (res.ok || res.type === 'opaque') cache.put(request, res.clone()); return res; })
      .catch(() => cached);
    return cached || rede;
  })());
});
