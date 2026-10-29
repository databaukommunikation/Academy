// DATABAU Academy – Service Worker
// Macht die Seite installierbar und hält die App-Hülle für schlechten Empfang bereit.
// Inhalte und Anmeldung laufen immer live über Supabase und werden hier nicht gespeichert.
const CACHE = "academy-v1";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Immer zuerst das Netz fragen (damit Updates sofort ankommen), nur offline auf den Speicher zurückgreifen.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase und Dateien nie zwischenspeichern
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          const key = url.pathname.endsWith("config.js") ? "./config.js" : req;
          caches.open(CACHE).then((c) => c.put(key, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(url.pathname.endsWith("config.js") ? "./config.js" : req)
          .then((r) => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined))
      )
  );
});
