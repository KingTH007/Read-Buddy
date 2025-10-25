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

    readBtn.addEventListener("click", () => {
        stopTTS();
        readSection.style.display = "flex";
        speakSection.style.display = "none";
        detectSection.style.display = "none";
    });

    speakBtn.addEventListener("click", () => {
        stopTTS();
        speakSection.style.display = "flex";
        readSection.style.display = "none";
        detectSection.style.display = "none";
    });

    detectBtn.addEventListener("click", () => {
        stopTTS();
        detectSection.style.display = "flex";
        readSection.style.display = "none";
        speakSection.style.display = "none";
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
});
