/* PodPod — Service Worker (v3: ícones dedicados + bust de cache) */
const CACHE = "podpod-pwa-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache
          .addAll([
            "/vendedor/offline",
            "/manifest.json",
            "/icon-192.png",
            "/icon-512.png",
            "/favicon.ico",
            "/favicon.png",
            "/apple-touch-icon.png",
          ])
          .catch(() => {})
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches
          .match("/vendedor/offline")
          .then(
            (r) =>
              r ||
              new Response(
                "<!DOCTYPE html><html><body><p>Offline</p></body></html>",
                {
                  status: 503,
                  headers: { "Content-Type": "text/html; charset=utf-8" },
                }
              )
          )
      )
    );
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (/\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(event.request, copy));
            }
            return res;
          })
      )
    );
  }
});
