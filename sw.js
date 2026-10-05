const VERSION = 'v5';
const STATIC_CACHE  = `esperanca-static-${VERSION}`;
const RUNTIME_CACHE = `esperanca-runtime-${VERSION}`;
const IMG_CACHE     = `esperanca-img-${VERSION}`;
const ALL = [STATIC_CACHE, RUNTIME_CACHE, IMG_CACHE];

/* Só pré-cacheia o essencial — e cada item individualmente,
   para que UM arquivo faltando não quebre a instalação do SW */
const PRECACHE = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.allSettled(PRECACHE.map(p => cache.add(p).catch(() => {})));
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
  let url;
  try { url = new URL(request.url); } catch(err) { return; }
  if (!url.protocol.startsWith('http')) return;

  /* dados.js: SEMPRE da rede quando possível — publicações aparecem na hora */
  if (/dados\.js(\?.*)?$/.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        return (await cache.match(request)) || Response.error();
      }
    })());
    return;
  }

  /* Navegação: rede primeiro, cache como fallback (funciona offline) */
  if (request.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        const cache = await caches.open(STATIC_CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match('./index.html'))
            || (await cache.match('./'))
            || (await cache.match(request))
            || Response.error();
      }
    })());
    return;
  }

  /* Imagens: cache primeiro (velocidade) + atualização em segundo plano */
  if (request.destination === 'image') {
    e.respondWith((async () => {
      const cache  = await caches.open(IMG_CACHE);
      const cached = await cache.match(request);
      const rede = fetch(request)
        .then(res => { if (res.ok || res.type === 'opaque') cache.put(request, res.clone()); return res; })
        .catch(() => cached);
      return cached || rede;
    })());
    return;
  }

  /* Restante (Tailwind, fontes): cache com revalidação */
  e.respondWith((async () => {
    const cache  = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    const rede = fetch(request)
      .then(res => { if (res.ok || res.type === 'opaque') cache.put(request, res.clone()); return res; })
      .catch(() => cached);
    return cached || rede;
  })());
});
