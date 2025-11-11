    const hamburger = document.getElementById("hamburger");
    const sidebar = document.getElementById("sidebar");
    const background = document.querySelector(".background");

    // --- Helper: Stop all text-to-speech ---
    function stopTTS() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel(); // ✅ stops all ongoing TTS
        }
    }

    // --- Helper: Reset activity fully by reloading the page ---
    function resetActivity() {
        stopTTS();
        console.log("Resetting activity and reloading page...");
        window.location.reload(); // ✅ fully reloads the page
    }
    
    if (hamburger && sidebar && background) {
        hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("show");
        hamburger.classList.toggle("show");
        background.classList.toggle("show");
        });
        
    // Clicking the black overlay closes the sidebar
    background.addEventListener("click", () => {
        sidebar.classList.remove("show");
        hamburger.classList.remove("show");
        background.classList.remove("show");
        });

    // Click outside sidebar closes it too
    document.addEventListener("click", (e) => {
        if (
            !sidebar.contains(e.target) &&
            !hamburger.contains(e.target) &&
            sidebar.classList.contains("show")
        ) {
            sidebar.classList.remove("show");
            hamburger.classList.remove("show");
            background.classList.remove("show");
        }
        });
    }

    // SIDEBAR TOGGLE FOR LEARN & PRACTICE
    const readBtn = document.getElementById("rAu");
    const speakBtn = document.getElementById("wPa");
    const detectBtn = document.getElementById("sD");
    const readSection = document.getElementById("readUnderstand");
    const speakSection = document.getElementById("sayItRight");
    const detectSection = document.getElementById("storyDetectives");

    // Intercept clicks on learn-list buttons (show notification first before proceeding)
    readBtn.addEventListener("click", (e) => {
        e.preventDefault();
        stopTTS();
        pendingActivity = "readUnderstand";
        openSwitchNotification("Read and Understand");
    });

    speakBtn.addEventListener("click", (e) => {
        e.preventDefault();
        stopTTS();
        pendingActivity = "sayItRight";
        openSwitchNotification("Say It Right!");
    });

    detectBtn.addEventListener("click", (e) => {
        e.preventDefault();
        stopTTS();
        pendingActivity = "storyDetectives";
        openSwitchNotification("Story Detectives");
    });

    // --- Detect selected learning activity from URL ---
    const params = new URLSearchParams(window.location.search);
    const selectedActivity = params.get("activity");

    // Hide all first
    if (readSection) readSection.style.display = "none";
    if (speakSection) speakSection.style.display = "none";
    if (detectSection) detectSection.style.display = "none";

    // Show selected activity
    if (selectedActivity === "readUnderstand" && readSection) {
        readSection.style.display = "flex";
    } else if (selectedActivity === "sayItRight" && speakSection) {
        speakSection.style.display = "flex";
    } else if (selectedActivity === "storyDetectives" && detectSection) {
        detectSection.style.display = "flex";
    } else {
        if (readSection) readSection.style.display = "flex";
    }

    // LOGOUT FUNCTIONALITY
    const logoutBtn = document.getElementById("logout-btn");
    const userNameSpan = document.getElementById("user-name");

    const teacherData = JSON.parse(localStorage.getItem("teacher"));
    const studentData = JSON.parse(localStorage.getItem("student"));

    if (teacherData && teacherData.fullname) {
        userNameSpan.textContent = teacherData.fullname;
    } else if (studentData && studentData.fullname) {
        userNameSpan.textContent = studentData.fullname;
    } else {
        userNameSpan.textContent = "User";
    }

    logoutBtn.addEventListener("click", () => {
        stopTTS();
        localStorage.removeItem("teacher");
        localStorage.removeItem("student");
        window.location.href = "/index.html";
    });

    // ===================
    // GLOBAL RESTART LOGIC
    // ===================

    // Restart buttons for all activities
    const raubtn = document.getElementById("restartRead");
    const sirbtn = document.getElementById("restartVoice");
    const sdbtn = document.getElementById("restartStory");

    // Notification elements (shared across all)
    const restartNotification = document.getElementById("restart-notification");
    const yesRestart = document.getElementById("yes-restart");
    const noRestart = document.getElementById("no-restart");
    const notifBackground = document.querySelector(".notification-overlay-background");
    const nofimg = document.getElementById("notif-icon");

    // Variable to store which activity is being restarted
    let currentActivity = "";

    // ==========
    // Event Listeners
    // ==========
    if (raubtn) {
    raubtn.addEventListener("click", () => showRestartPopup("readUnderstand"));
    }

    if (sirbtn) {
    sirbtn.addEventListener("click", () => showRestartPopup("sayItRight"));
    }

    if (sdbtn) {
    sdbtn.addEventListener("click", () => showRestartPopup("storyDetectives"));
    }

    // ==========
    // SHOW RESTART POPUP
    // ==========
    function showRestartPopup(activity) {
    currentActivity = activity;
    restartNotification.style.display = "flex";
    notifBackground.classList.add("show");
    nofimg.classList.add("show");
    }

    // ==========
    // HANDLE CONFIRMATION
    // ==========
    if (yesRestart && noRestart) {
    yesRestart.addEventListener("click", () => {
        restartNotification.style.display = "none";
        notifBackground.classList.remove("show");
        nofimg.classList.remove("show");
        resetAll(); // call shared function
    });

    noRestart.addEventListener("click", () => {
        restartNotification.style.display = "none";
        notifBackground.classList.remove("show");
        nofimg.classList.remove("show");
    });
    }

    // ==========
    // SHARED RESET FUNCTION
    // ==========
    function resetAll() {
    if (!currentActivity) return;
    window.location.href = `/learn-act.html?activity=${currentActivity}`;
    }


    // ===============================
    // 🔔 SWITCH LEARNER NOTIFICATION
    // ===============================
    const switchNotif = document.getElementById("switch-learner-notification");
    const yesSwitch = document.getElementById("yes-switch-learner");
    const noSwitch = document.getElementById("no-switch-learner");
    const learnTitle = document.querySelector(".learn-title");

    let pendingActivity = null; // stores which activity to switch to

    // Helper to open switch notification
    function openSwitchNotification(activityName) {
        stopTTS();
        learnTitle.textContent = activityName;
        notifBackground.classList.add("show");
        nofimg.classList.add("show");
        switchNotif.classList.add("show");
    }

    // Helper to close notification
    function closeSwitchNotification() {
        notifBackground.classList.remove("show");
        nofimg.classList.remove("show");
        switchNotif.classList.remove("show");
    }

    // Handle YES button
    yesSwitch.addEventListener("click", () => {
        closeSwitchNotification();
        if (pendingActivity === "readUnderstand") {
            window.location.href = "/learn-act.html?activity=readUnderstand";
        } else if (pendingActivity === "sayItRight") {
            window.location.href = "/learn-act.html?activity=sayItRight";
        } else if (pendingActivity === "storyDetectives") {
            window.location.href = "/learn-act.html?activity=storyDetectives";
        }
        pendingActivity = null;
    });

    // Handle NO button
    noSwitch.addEventListener("click", () => {
        closeSwitchNotification();
        pendingActivity = null;
    });

// make globally accessible
window.selectedVoice = null;

function loadVoices() {
    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) {
        // Wait for voices to load
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return;
    }

    const preferredVoices = [
        "Microsoft Aria Online (Natural) - English (United States)",
        "Microsoft Ava Online (Natural) - English (United States)",
        "Microsoft Lani Online (Natural) - Filipino (Philippines)"
    ];

    window.selectedVoice =
        voices.find(v => preferredVoices.includes(v.name)) ||
        voices.find(v => v.name.toLowerCase().includes("female")) ||
        voices.find(v => v.name.toLowerCase().includes("child")) ||
        voices.find(v => v.lang.startsWith("en") || v.lang.startsWith("fil")) ||
        voices[0];

    console.log("🎤 Using voice:", window.selectedVoice?.name || "default");
}

// call immediately
loadVoices();

async function saveLearningResult(learningName, difficultyMode, finalResult) {
  try {
    // Get student info from localStorage
    const student = JSON.parse(localStorage.getItem("student"));

    // If no student data or studId, show notification and stop
    if (!student || !student.id) {
      alert("⚠️ Student not logged in. Please log in to save your progress.");
      console.error("❌ No student ID found in localStorage.");
      return;
    }

    const studId = student.id; // must match DB column studId

    // Send data to backend
    const res = await fetch("/api/save-learning-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studId: studId,
        learnName: learningName,
        f_result: finalResult,
        modes: difficultyMode
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      console.log("✅ Learning activity saved:", data.activity);
    } else {
      console.error("❌ Failed to save learning activity:", data.message || data.error);
    }
  } catch (err) {
    console.error("❌ Error sending learning activity:", err);
  }
}

// Make globally accessible
window.saveLearningResult = saveLearningResult;