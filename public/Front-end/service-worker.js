const CACHE_NAME = "read-buddy-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json"
];

// Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/Front-end/index.html",
        "/Front-end/css/header.css",
        "/Front-end/css/home-page.css",
        "/Front-end/js/header-func.js",
        "/Front-end/js/home-func.js",
        "/Front-end/js/pwa-install.js",
        "/Front-end/asset/Logo.png",
        "/Front-end/asset/trans-logo.png",
      ]);
    })
  );
  console.log("✅ Service Worker Installed");
});

// Fetch cached content
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Activate and clean old cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
});
