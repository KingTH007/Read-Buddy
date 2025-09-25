let timerInterval;
let seconds = 0;
let currentStory = "";
let currentStoryId = null;
let timerRunning = false;

// Format timer as mm:ss
function formatTime(sec) {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Start timer
function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        const timerEl = document.getElementById("timer");
        if (timerEl) timerEl.textContent = formatTime(seconds);
    }, 1000);
}

// Stop timer
function stopTimer() {
    clearInterval(timerInterval);
}

// Fetch ALL stories for sidebar
async function fetchAllStories() {
  try {
    const response = await fetch("http://localhost:5000/get-stories");
    const data = await response.json();

    if (data.success) {
      const storyListEl = document.getElementById("story-list");
      storyListEl.innerHTML = "";

      const params = new URLSearchParams(window.location.search);
      const selectedStoryId = params.get("story_id");

      data.stories.forEach(story => {
        const btn = document.createElement("button");
        btn.classList.add("side-btn");
        btn.textContent = story.storyname;  // ✅ only the title

        if (String(story.id) === String(selectedStoryId)) {
          btn.classList.add("selected"); // highlight selected story
        }

        btn.addEventListener("click", () => {
          window.location.search = `?story_id=${story.id}`;
        });

        storyListEl.appendChild(btn);
      });
    }
  } catch (err) {
    console.error("Error fetching all stories:", err);
  }
}


// Fetch one story by ID
async function fetchStory() {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get("story_id");
    const storyContentEl = document.getElementById("story-content");

    if (!storyId) {
        storyContentEl.innerHTML = "<p>❌ No story selected.</p>";
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/get-story/${storyId}`);
        const data = await response.json();

        if (data.success) {
            const story = data.story;
            document.getElementById("story-title").textContent = story.storyname;

            currentStory = story.storycontent;
            currentStoryId = story.id;

            storyContentEl.innerHTML = `<p>Click START to read "${story.storyname}".</p>`;
        } else {
            storyContentEl.innerHTML = "<p>❌ Failed to load story.</p>";
        }
    } catch (err) {
        console.error("Error fetching story:", err);
        storyContentEl.innerHTML = "<p>❌ Error loading story.</p>";
    }
}

// Handle START/STOP button
document.addEventListener("DOMContentLoaded", () => {
    fetchAllStories();
    fetchStory();

    const startBtn = document.getElementById("start-btn");
    const storyContentEl = document.getElementById("story-content");

    if (startBtn && storyContentEl) {
        startBtn.addEventListener("click", async () => {
            if (!currentStory) return;

            if (!timerRunning) {
                // START reading
                try {
                    const response = await fetch("http://localhost:5000/api/format-story", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ content: currentStory })
                    });

                    const data = await response.json();
                    storyContentEl.innerHTML = `<p>${data.formatted || currentStory}</p>`;
                } catch (err) {
                    console.error("Error formatting story:", err);
                    storyContentEl.innerHTML = `<p>${currentStory}</p>`;
                }

                startBtn.textContent = "STOP";
                timerRunning = true;
                startTimer();
            } else {
                // STOP reading
                stopTimer();
                startBtn.textContent = "START";
                timerRunning = false;
            }
        });
    }
});
