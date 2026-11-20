// Service worker: guarda la app en el teléfono para que abra sin internet.
// Al publicar una versión nueva de index.html, cambia el número de CACHE.
const CACHE = "osp-offline-v3";
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

// Primero responde desde el teléfono (rápido y offline) y, si hay señal, actualiza en segundo plano.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const enCache = await cache.match(req, { ignoreSearch: true }) ||
                      (req.mode === "navigate" ? await cache.match("./index.html") : undefined);
      const red = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(() => enCache);
      return enCache || red;
    })
  );
});
