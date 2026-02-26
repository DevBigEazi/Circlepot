const CACHE_NAME = "circlepot-v1";

// Assets to precache for offline support
const PRECACHE_ASSETS = [
  "/",
  "/assets/images/pwa-192x192.png",
  "/assets/images/pwa-512x512.png",
  "/assets/images/logo.png",
  "/assets/images/full-logo.png",
  "/assets/images/favicon.ico",
  "/assets/images/apple-touch-icon-180x180.png",
];

// Install event — precache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Use individual adds to avoid failing the entire operation
        // if one asset is missing (important for iOS resilience)
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn("[SW] Failed to precache:", url, err);
            }),
          ),
        );
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate event — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch event — network-first strategy with cache fallback
// iOS Safari kills service workers more aggressively, so robust
// error handling and cache fallbacks are critical.
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip Next.js internal requests (HMR, webpack, etc.) during development
  if (
    event.request.url.includes("/_next/webpack") ||
    event.request.url.includes("/__next") ||
    event.request.url.includes("/_next/static/development") ||
    event.request.url.includes("__nextjs")
  ) {
    return;
  }

  // For navigation requests: network-first with cache fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match("/");
          });
        }),
    );
    return;
  }

  // For static assets: cache-first with network fallback (faster on iOS)
  if (
    event.request.url.match(/\.(png|jpg|jpeg|svg|gif|ico|woff2?|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cache immediately, but refresh in background
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {
              /* Network unavailable, cache is still valid */
            });
          event.waitUntil(fetchPromise);
          return cachedResponse;
        }
        // Not in cache, try network
        return fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return new Response("", {
              status: 503,
              statusText: "Service Unavailable",
            });
          });
      }),
    );
    return;
  }

  // For all other requests: network-first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      }),
  );
});

// Push notification event — handle incoming push messages
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/assets/images/pwa-192x192.png",
      badge: "/assets/images/pwa-64x64.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "1",
        url: data.url || "/",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification click event — open the app when notification is tapped
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a Circlepot window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      }),
  );
});
