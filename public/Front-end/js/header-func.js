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

    // ✅ PWA INSTALL PROMPT HANDLER (Android only)
  let deferredPrompt;
  const downloadBtn = document.querySelector(".download");
  const isAndroid = /Android/i.test(navigator.userAgent);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // stop automatic prompt
    deferredPrompt = e;
    console.log("✅ beforeinstallprompt event saved");
  });

  if (downloadBtn) {
    downloadBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      if (!isAndroid) {
        alert("This app can only be installed on Android devices.");
        return;
      }

      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);

        if (outcome === "accepted") {
          alert("✅ ReadBuddy is now installing...");
        } else {
          alert("❌ Installation was cancelled.");
        }

        deferredPrompt = null; // reset so it won’t block next time
      } else {
        alert("Please open this page in Chrome on your Android device to install.");
      }
    });
  }

  // ✅ SERVICE WORKER REGISTRATION
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register('/Front-end/service-worker.js')
        .then(() => console.log("✅ Service Worker Registered"))
        .catch((err) => console.error("❌ Service Worker failed:", err));
    });
  }
});
