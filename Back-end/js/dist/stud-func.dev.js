"use strict";

document.getElementById("learn1").addEventListener("click", function () {
  // Change "lesson.html" to your actual lesson page
  window.location.href = "../../Front-end/html/learn-act.html";
});
document.getElementById("logout-btn").addEventListener("click", function () {
  localStorage.removeItem("teacher");
  window.location.reload();
  window.location.href = "../../Front-end/html/home-page.html"; // Clear UI
});