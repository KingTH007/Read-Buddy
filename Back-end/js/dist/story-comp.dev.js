"use strict";

var timerInterval;
var seconds = 0;
var currentStory = "";
var currentStoryId = null;
var timerRunning = false; // Format timer as mm:ss

function formatTime(sec) {
  var minutes = Math.floor(sec / 60);
  var seconds = sec % 60;
  return "".concat(String(minutes).padStart(2, "0"), ":").concat(String(seconds).padStart(2, "0"));
} // Start timer


function startTimer() {
  timerInterval = setInterval(function () {
    seconds++;
    var timerEl = document.getElementById("timer");
    if (timerEl) timerEl.textContent = formatTime(seconds);
  }, 1000);
} // Stop timer


function stopTimer() {
  clearInterval(timerInterval);
} // Fetch ALL stories for sidebar


function fetchAllStories() {
  var response, data, storyListEl, params, selectedStoryId;
  return regeneratorRuntime.async(function fetchAllStories$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(fetch("http://localhost:5000/get-stories"));

        case 3:
          response = _context.sent;
          _context.next = 6;
          return regeneratorRuntime.awrap(response.json());

        case 6:
          data = _context.sent;

          if (data.success) {
            storyListEl = document.getElementById("story-list");
            storyListEl.innerHTML = "";
            params = new URLSearchParams(window.location.search);
            selectedStoryId = params.get("story_id");
            data.stories.forEach(function (story) {
              var btn = document.createElement("button");
              btn.classList.add("side-btn");
              btn.textContent = story.storyname; // ✅ only the title

              if (String(story.id) === String(selectedStoryId)) {
                btn.classList.add("selected"); // highlight selected story
              }

              btn.addEventListener("click", function () {
                window.location.search = "?story_id=".concat(story.id);
              });
              storyListEl.appendChild(btn);
            });
          }

          _context.next = 13;
          break;

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](0);
          console.error("Error fetching all stories:", _context.t0);

        case 13:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 10]]);
} // Fetch one story by ID


function fetchStory() {
  var params, storyId, storyContentEl, response, data, story;
  return regeneratorRuntime.async(function fetchStory$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          params = new URLSearchParams(window.location.search);
          storyId = params.get("story_id");
          storyContentEl = document.getElementById("story-content");

          if (storyId) {
            _context2.next = 6;
            break;
          }

          storyContentEl.innerHTML = "<p>❌ No story selected.</p>";
          return _context2.abrupt("return");

        case 6:
          _context2.prev = 6;
          _context2.next = 9;
          return regeneratorRuntime.awrap(fetch("http://localhost:5000/get-story/".concat(storyId)));

        case 9:
          response = _context2.sent;
          _context2.next = 12;
          return regeneratorRuntime.awrap(response.json());

        case 12:
          data = _context2.sent;

          if (data.success) {
            story = data.story;
            document.getElementById("story-title").textContent = story.storyname;
            currentStory = story.storycontent;
            currentStoryId = story.id;
            storyContentEl.innerHTML = "<p>Click START to read \"".concat(story.storyname, "\".</p>");
          } else {
            storyContentEl.innerHTML = "<p>❌ Failed to load story.</p>";
          }

          _context2.next = 20;
          break;

        case 16:
          _context2.prev = 16;
          _context2.t0 = _context2["catch"](6);
          console.error("Error fetching story:", _context2.t0);
          storyContentEl.innerHTML = "<p>❌ Error loading story.</p>";

        case 20:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[6, 16]]);
} // Handle START/STOP button


document.addEventListener("DOMContentLoaded", function () {
  fetchAllStories();
  fetchStory();
  var startBtn = document.getElementById("start-btn");
  var storyContentEl = document.getElementById("story-content");

  if (startBtn && storyContentEl) {
    startBtn.addEventListener("click", function _callee() {
      var response, data;
      return regeneratorRuntime.async(function _callee$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (currentStory) {
                _context3.next = 2;
                break;
              }

              return _context3.abrupt("return");

            case 2:
              if (timerRunning) {
                _context3.next = 22;
                break;
              }

              _context3.prev = 3;
              _context3.next = 6;
              return regeneratorRuntime.awrap(fetch("http://localhost:5000/api/format-story", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  content: currentStory
                })
              }));

            case 6:
              response = _context3.sent;
              _context3.next = 9;
              return regeneratorRuntime.awrap(response.json());

            case 9:
              data = _context3.sent;
              storyContentEl.innerHTML = "<p>".concat(data.formatted || currentStory, "</p>");
              _context3.next = 17;
              break;

            case 13:
              _context3.prev = 13;
              _context3.t0 = _context3["catch"](3);
              console.error("Error formatting story:", _context3.t0);
              storyContentEl.innerHTML = "<p>".concat(currentStory, "</p>");

            case 17:
              startBtn.textContent = "STOP";
              timerRunning = true;
              startTimer();
              _context3.next = 25;
              break;

            case 22:
              // STOP reading
              stopTimer();
              startBtn.textContent = "START";
              timerRunning = false;

            case 25:
            case "end":
              return _context3.stop();
          }
        }
      }, null, null, [[3, 13]]);
    });
  }
});