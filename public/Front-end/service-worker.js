const CACHE_NAME = "readbuddy-cache-v1";
const ASSETS_TO_CACHE = [
  "/index.html",
  "/css/header.css",
  "/css/home-page.css",
  "/asset/Logo.png",
  "/asset/main1.png",
  "/asset/main2.png",
  "/asset/main3.png",
  "/Front-end/js/header-func.js",
  "/Front-end/js/home-func.js",
  "/Front-end/js/pwa-install.js",
  "/manifest.json"
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  console.log("✅ Service Worker installed");
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  console.log("✅ Service Worker activated");
});

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request))
  );
});
