/* PodPod — Service Worker (v5: push notifications vendedor) */
const CACHE = "podpod-pwa-v5";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache
          .addAll([
            "/vendedor",
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

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "PodPod";
  const options = {
    body: data.body || "Você tem uma nova atualização.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "podpod-notification",
    data: {
      url: data.url || "/vendedor/pedidos-cardapio",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "/vendedor/pedidos-cardapio";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const absolute = new URL(target, self.location.origin).toString();
      for (const client of clients) {
        if (client.url === absolute && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(absolute);
      return undefined;
    })
  );
});
