const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");

hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("show");
});

// ✅ Show teacher or student name beside user icon
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout-btn");
    const userNameSpan = document.getElementById("user-name");

    // Check localStorage for login info
    const teacherData = JSON.parse(localStorage.getItem("teacher"));
    const studentData = JSON.parse(localStorage.getItem("student"));

    if (teacherData && teacherData.fullname) {
        userNameSpan.textContent = teacherData.fullname;
    } else if (studentData && studentData.fullname) {
        userNameSpan.textContent = studentData.fullname;
    } else {
        userNameSpan.textContent = "User";
    }

    // ✅ Add logout functionality
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("teacher");
        localStorage.removeItem("student");
        window.location.href = "/index.html";
    });

    //pwa
    let deferredPrompt;
    const downloadBtn = document.querySelector(".download");

    // Detect Android
    const isAndroid = /Android/i.test(navigator.userAgent);

    // Hide button initially
    if (downloadBtn) downloadBtn.style.display = "none";

    // Listen for install prompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log("✅ beforeinstallprompt event captured");

      // Show button once event is captured
      if (downloadBtn) downloadBtn.style.display = "inline-block";
    });

    // Handle button click
    if (downloadBtn) {
      downloadBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        if (!isAndroid) {
          alert("⚠️ Installation is only supported on Android devices with Chrome.");
          return;
        }

        if (!deferredPrompt) {
          alert("❌ Install prompt not available. Try refreshing this page in Chrome.");
          return;
        }

        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        console.log("User choice:", result.outcome);

        if (result.outcome === "accepted") {
          alert("🎉 ReadBuddy is now installing!");
        } else {
          alert("❌ Installation was cancelled.");
        }

        deferredPrompt = null;
        downloadBtn.style.display = "none";
      });
    }

    // Optional: detect if already installed
    window.addEventListener("appinstalled", () => {
      console.log("✅ ReadBuddy installed successfully!");
      if (downloadBtn) downloadBtn.style.display = "none";
    });

    const CACHE_NAME = "read-buddy-cache-v1";

    const urlsToCache = [
      "/Front-end/index.html",
      "/Front-end/css/header.css",
      "/Front-end/css/home-page.css",
      "/Front-end/js/header-func.js",
      "/Front-end/js/home-func.js",
      "/Front-end/js/pwa-install.js",
      "/Front-end/asset/Logo.png",
      "/Front-end/asset/trans-logo.png",
    ];

    // Install service worker
    self.addEventListener("install", (event) => {
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
      );
      console.log("✅ Service Worker Installed");
    });

    // Fetch cached content
    self.addEventListener("fetch", (event) => {
      event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
      );
    });

    // Activate and clean old cache
    self.addEventListener("activate", (event) => {
      event.waitUntil(
        caches.keys().then((cacheNames) =>
          Promise.all(
            cacheNames.map((cache) => {
              if (cache !== CACHE_NAME) return caches.delete(cache);
            })
          )
        )
      );
    });

});
