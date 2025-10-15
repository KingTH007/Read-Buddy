const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");

if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
        navMenu.classList.toggle("show");
    });
}

// ✅ Show teacher or student name beside user icon
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout-btn");
    const userNameSpan = document.getElementById("user-name");

    // Only proceed if the elements exist (not on home page)
    if (!logoutBtn || !userNameSpan) {
        return;
    }

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
        if (confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("teacher");
            localStorage.removeItem("student");
            window.location.href = "../../Front-end/html/home-page.html";
        }
    });
});
