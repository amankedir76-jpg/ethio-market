// ETHIO MARKET Service Worker: hält das App-Grundgerüst offline bereit.
// Daten aus Supabase werden NIE zwischengespeichert (immer aktuell, keine privaten Daten im Cache).
const CACHE = "ethio-shell-v1";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/icon.svg", "/manifest.webmanifest"])));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  // Seitenaufrufe: zuerst Netz, offline das gespeicherte Grundgerüst
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/")));
    return;
  }
  // Gebaute Dateien haben eindeutige Namen: aus dem Cache, sonst laden und merken
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    })));
  }
});
