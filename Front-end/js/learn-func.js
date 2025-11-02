document.addEventListener("DOMContentLoaded", () => {
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

            resetActivity();
        });

        // Clicking the black overlay closes the sidebar
        background.addEventListener("click", () => {
            sidebar.classList.remove("show");
            hamburger.classList.remove("show");
            background.classList.remove("show");

            resetActivity();
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

                resetActivity();
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
        window.location.href = "../../Front-end/html/home-page.html";
    });

    // ===============================
    // 🔔 SWITCH LEARNER NOTIFICATION
    // ===============================
    const switchNotif = document.getElementById("switch-learner-notification");
    const notifBackground = document.querySelector(".notification-overlay-background");
    const yesSwitch = document.getElementById("yes-switch-learner");
    const noSwitch = document.getElementById("no-switch-learner");
    const learnTitle = document.querySelector(".learn-title");
    const nofimg = document.getElementById("notif-icon");

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
            window.location.href = "../../Front-end/html/learn-act.html?activity=readUnderstand";
        } else if (pendingActivity === "sayItRight") {
            window.location.href = "../../Front-end/html/learn-act.html?activity=sayItRight";
        } else if (pendingActivity === "storyDetectives") {
            window.location.href = "../../Front-end/html/learn-act.html?activity=storyDetectives";
        }
        pendingActivity = null;
    });

    // Handle NO button
    noSwitch.addEventListener("click", () => {
        closeSwitchNotification();
        pendingActivity = null;
    });

});
