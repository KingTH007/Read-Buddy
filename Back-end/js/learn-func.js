document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburger");
    const sidebar = document.getElementById("sidebar");
    const background = document.querySelector(".background");

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
    const readSection = document.getElementById("readUnderstand");
    const speakSection = document.getElementById("sayItRight");

    readBtn.addEventListener("click", () => {
        readSection.style.display = "flex";
        speakSection.style.display = "none";
    });

    speakBtn.addEventListener("click", () => {
        speakSection.style.display = "flex";
        readSection.style.display = "none";
    });

    // --- Detect selected learning activity from URL ---
    const params = new URLSearchParams(window.location.search);
    const selectedActivity = params.get("activity");

    // Hide both first
    if (readSection) readSection.style.display = "none";
    if (speakSection) speakSection.style.display = "none";

    // Show selected activity
    if (selectedActivity === "readUnderstand" && readSection) {
        readSection.style.display = "flex";
    } else if (selectedActivity === "sayItRight" && speakSection) {
        speakSection.style.display = "flex";
    } else {
        // Default state (if no parameter found)
        if (readSection) readSection.style.display = "flex";
    }

    // LOGOUT FUNCTIONALITY
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
        window.location.href = "../../Front-end/html/home-page.html";
    });
});