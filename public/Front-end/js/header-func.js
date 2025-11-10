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

    const loginBtn = document.querySelector('.login-btn');
    const menu = document.getElementById('menu');

    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        menu.classList.toggle('show');
    });

    // Hide menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!loginBtn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('show');
        }
    });
});
