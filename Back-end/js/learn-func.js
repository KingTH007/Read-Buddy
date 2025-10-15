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
});