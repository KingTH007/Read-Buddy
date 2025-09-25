// story-comp.js (fixed)
let timerInterval;
let seconds = 0;
let currentStory = "";
let currentStoryId = null;
let timerRunning = false;

let questions = [];           // parsed questions array from DB
let currentQuestionIndex = 0; // which question is showing
let correctCount = 0;
let totalWords = 0;


// Format timer as mm:ss
function formatTime(sec) {
  const minutes = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

    if (data.success && Array.isArray(data.stories)) {
      const storyListEl = document.getElementById("story-list");
      storyListEl.innerHTML = "";

      const params = new URLSearchParams(window.location.search);
      const selectedStoryId = params.get("story_id");

      data.stories.forEach(story => {
        const btn = document.createElement("button");
        btn.classList.add("side-btn");
        btn.textContent = story.storyname || "Untitled";

        // support both story.id (alias) or story.story_id from DB
        const sid = String(story.id ?? story.story_id ?? "");

        if (sid === String(selectedStoryId)) {
          btn.classList.add("selected");
        }

        btn.addEventListener("click", () => {
          window.location.search = `?story_id=${sid}`;
        });

        storyListEl.appendChild(btn);
      });
    } else {
      console.warn("No stories found or invalid response", data);
    }
  } catch (err) {
    console.error("Error fetching all stories:", err);
  }
}

// Robustly parse storyquest -> questions array
function parseQuestions(rawText) {
  try {
    // Split into question blocks (Q1:, Q2:, ...)
    const blocks = rawText.split(/Q\d+:/).filter(Boolean);

    return blocks.map((block, index) => {
      const lines = block.trim().split("\n").map(l => l.trim()).filter(Boolean);

      const qText = lines[0];
      const choices = lines.slice(1, -1);
      const answerLine = lines[lines.length - 1] || "";
      const answerLetter = answerLine.replace("Answer:", "").trim();

      // find correct choice index by letter (A/B/C/D)
      let correctIndex = -1;
      if (answerLetter.length === 1) {
        correctIndex = choices.findIndex(c => c.startsWith(answerLetter + ")"));
      }

      return {
        number: index + 1,
        question: qText,
        choices: choices,
        answer: answerLetter,
        answerIndex: correctIndex >= 0 ? correctIndex : null
      };
    });
  } catch (err) {
    console.error("parseQuestions error:", err);
    return [];
  }
}

// Show question at index (1-by-1)
function showQuestion(index) {
  const storyContentEl = document.getElementById("story-content");
  if (!storyContentEl) return;

  storyContentEl.innerHTML = ""; // clear for new question

  if (index >= questions.length) {
    showResults();
    return;
  }

  const q = questions[index];
  const qWrapper = document.createElement("div");
  qWrapper.classList.add("question-wrapper");

  const qText = document.createElement("p");
  qText.textContent = `Q${index + 1}: ${q.question ?? "Untitled question"}`;
  qWrapper.appendChild(qText);

  const optionsContainer = document.createElement("div");
  optionsContainer.classList.add("options");

  (q.choices || []).forEach((choiceText, i) => {
    const btn = document.createElement("button");
    btn.classList.add("answer-btn");
    btn.textContent = choiceText;

    btn.addEventListener("click", () => {
      if (i === q.answerIndex) {
        correctCount++;
      }
      currentQuestionIndex++;
      showQuestion(currentQuestionIndex);
    });

    optionsContainer.appendChild(btn);
  });

  qWrapper.appendChild(optionsContainer);
  storyContentEl.appendChild(qWrapper);
}

function showResults() {
  const storyContentEl = document.getElementById("story-content");
  storyContentEl.innerHTML = "";

  // Time in minutes
  const timeMinutes = seconds / 60;

  // Reading Speed (WPM)
  const wpm = timeMinutes > 0 ? (totalWords / timeMinutes).toFixed(2) : totalWords;

  // Comprehension %
  const comprehension = ((correctCount / questions.length) * 100).toFixed(2);

  // Reading Efficiency Score (RES)
  const res = timeMinutes > 0 ? (comprehension / timeMinutes).toFixed(2) : comprehension;

  // Weighted Final Grade
  const finalGrade = ((comprehension * 0.7) + (wpm * 0.3)).toFixed(2);

  // Grading System
  let remark = "";
  if (finalGrade >= 90) remark = "Outstanding";
  else if (finalGrade >= 85) remark = "Very Satisfactory";
  else if (finalGrade >= 80) remark = "Satisfactory";
  else if (finalGrade >= 75) remark = "Fairly Satisfactory";
  else remark = "Did Not Meet Expectations";

  const failClass = finalGrade < 75 ? "fail" : "";
  storyContentEl.innerHTML = `
    <h3>📊 Results</h3>
    <p><strong>Time:</strong> ${formatTime(seconds)} (${timeMinutes.toFixed(2)} min)</p>
    <p><strong>Number of Words:</strong> ${totalWords}</p>
    <p><strong>Correct Answers:</strong> ${correctCount} / ${questions.length}</p>
    <hr>
    <p><strong>Reading Speed (WPM):</strong> ${wpm}</p>
    <p><strong>Reading Efficiency Score (RES):</strong> ${res}</p>
    <p><strong>Final Grade:</strong> ${finalGrade}%</p>
    <p class="${failClass}" id="result"><strong>Result:</strong> ${remark}</p>
  `;
}


// Fetch one story by ID (and parse questions)
async function fetchStory() {
  const params = new URLSearchParams(window.location.search);
  const storyId = params.get("story_id");
  const storyContentEl = document.getElementById("story-content");

  // reset question box hidden by default
  const qBox = document.getElementById("question-box");
  if (qBox) qBox.style.display = "none";

  if (!storyId) {
    if (storyContentEl) storyContentEl.innerHTML = "<p>❌ No story selected.</p>";
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/get-story/${storyId}`);
    const data = await response.json();

    if (data.success) {
      const story = data.story;

      const titleEl = document.getElementById("story-title");
      if (titleEl) titleEl.textContent = story.storyname ?? "Untitled";

      currentStory = story.storycontent ?? "";
      currentStoryId = story.story_id ?? story.id ?? story.storyId ?? storyId;

      totalWords = currentStory.split(/\s+/).filter(Boolean).length;

      questions = parseQuestions(story.storyquest ?? story.storyquest_json ?? []);

      if (storyContentEl) storyContentEl.innerHTML = `<p>Click START to read "${story.storyname ?? 'this story'}".</p>`;

      // ensure question-box hidden until STOP
      if (qBox) qBox.style.display = "none";
    } else {
      if (storyContentEl) storyContentEl.innerHTML = "<p>❌ Failed to load story.</p>";
    }
  } catch (err) {
    console.error("Error fetching story:", err);
    if (storyContentEl) storyContentEl.innerHTML = "<p>❌ Error loading story.</p>";
  }
}


// Handle START/STOP button
document.addEventListener("DOMContentLoaded", async () => {
  await fetchAllStories();
  await fetchStory();

  const startBtn = document.getElementById("start-btn");
  const storyContentEl = document.getElementById("story-content");

  if (!startBtn || !storyContentEl) return;

  // Handle START/STOP button
  startBtn.addEventListener("click", async () => {
    if (!currentStory) return;

    if (!timerRunning) {
      // START
      storyContentEl.innerHTML = `<p>${currentStory}</p>`;
      startBtn.textContent = "STOP";
      timerRunning = true;
      seconds = 0;
      startTimer();
    } else {
      // STOP
      stopTimer();
      startBtn.style.display = "none"; // hide button
      timerRunning = false;
      currentQuestionIndex = 0;
      showQuestion(currentQuestionIndex);
    }
  });
});
