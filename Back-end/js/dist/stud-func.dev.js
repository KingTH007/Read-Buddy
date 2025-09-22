"use strict";

document.getElementById("learn1").addEventListener("click", function () {
  // Change "lesson.html" to your actual lesson page
  window.location.href = "../../Front-end/html/learn-act.html";
});
document.getElementById("logout-btn").addEventListener("click", function () {
  localStorage.removeItem("teacher");
  window.location.reload();
  window.location.href = "../../Front-end/html/home-page.html"; // Clear UI
}); // Load all stories for logged-in student on page load

function loadStudentStories() {
  var student, response, data, container;
  return regeneratorRuntime.async(function loadStudentStories$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          student = JSON.parse(localStorage.getItem("student"));

          if (!(!student || !student.id)) {
            _context.next = 4;
            break;
          }

          console.warn("⚠️ No student found in localStorage");
          return _context.abrupt("return");

        case 4:
          _context.prev = 4;
          _context.next = 7;
          return regeneratorRuntime.awrap(fetch("http://localhost:5000/get-student-stories/".concat(student.id)));

        case 7:
          response = _context.sent;
          _context.next = 10;
          return regeneratorRuntime.awrap(response.json());

        case 10:
          data = _context.sent;

          if (data.success) {
            container = document.querySelector(".act-card"); // ✅ Remove old story elements first

            container.querySelectorAll(".story").forEach(function (storyEl) {
              return storyEl.remove();
            }); // ✅ Append new stories

            data.stories.forEach(function (story) {
              var storyDiv = document.createElement("div");
              storyDiv.classList.add("story", "show");
              storyDiv.innerHTML = "\n                    <div class=\"story-image\">\n                        <img src=\"".concat(story.storyimage || "https://placehold.co/600x400", "\" alt=\"Story Image\" />\n                    </div>\n                    <p>").concat(story.storyname, "</p>\n                    <button class=\"button\" data-id=\"").concat(story.story_id, "\">Read Now</button>\n                ");
              container.appendChild(storyDiv);
            });
          } else {
            console.error("❌ Failed to fetch student stories:", data.message);
          }

          _context.next = 17;
          break;

        case 14:
          _context.prev = 14;
          _context.t0 = _context["catch"](4);
          console.error("❌ Error loading student stories:", _context.t0);

        case 17:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[4, 14]]);
}

window.addEventListener("DOMContentLoaded", function _callee() {
  var student;
  return regeneratorRuntime.async(function _callee$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          student = JSON.parse(localStorage.getItem("student"));

          if (!student) {
            _context2.next = 6;
            break;
          }

          _context2.next = 4;
          return regeneratorRuntime.awrap(loadStudentStories());

        case 4:
          _context2.next = 7;
          break;

        case 6:
          console.log("⚠️ No student found in localStorage.");

        case 7:
        case "end":
          return _context2.stop();
      }
    }
  });
});