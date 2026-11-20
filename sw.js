// Service worker: guarda la app en el teléfono para que abra sin internet.
// Al publicar una versión nueva de index.html, cambia el número de CACHE.
const CACHE = "osp-offline-v5";
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// La página (index.html): con señal se descarga la versión más nueva (espera máx. 4 s);
// sin señal se abre la copia guardada en el teléfono.
// Íconos y demás: primero la copia guardada y se actualiza en segundo plano.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const esPagina = req.mode === "navigate" || new URL(req.url).pathname.endsWith("/index.html");

  e.respondWith(caches.open(CACHE).then(async cache => {
    const enCache = await cache.match(req, { ignoreSearch: true }) ||
                    (esPagina ? await cache.match("./index.html") : undefined);
    const red = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; });

    if (esPagina) {
      const limite = new Promise(res => setTimeout(() => res(null), 4000));
      try {
        const r = await Promise.race([red, limite]);
        if (r && r.ok) return r;
      } catch (err) {}
      return enCache || red;
    }
    return enCache || red.catch(() => enCache);
  }));
});
