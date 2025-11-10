// === NAV MENU TOGGLE ===
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");

hamburger.addEventListener("click", () => {
  navMenu.classList.toggle("show");
});

// === INSTALL PWA ON BUTTON CLICK ===
let deferredPrompt;
const downloadBtn = document.querySelector(".nav-btn.download");

// Hide the button until it's installable
if (downloadBtn) downloadBtn.style.display = "none";

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("📱 PWA install prompt available");

  // Show the download button when installable
  if (downloadBtn) downloadBtn.style.display = "inline-block";
});

if (downloadBtn) {
  downloadBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("✅ User accepted install");
      } else {
        console.log("❌ User dismissed install");
      }

      deferredPrompt = null;
      // Hide the button again after install
      downloadBtn.style.display = "none";
    } else {
      alert(
        "📦 App not ready for install yet. Make sure you're on Chrome with HTTPS or localhost."
      );
    }
  });
}

// Optional: detect when PWA is already installed
window.addEventListener("appinstalled", () => {
  console.log("🎉 PWA installed successfully!");
  if (downloadBtn) downloadBtn.style.display = "none";
});
