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
let answers = {};

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
    const response = await fetch("/api/get-stories");
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

  storyContentEl.innerHTML = "";

  // Update question progress
  const timerEl = document.getElementById("timer");
  if (timerEl && index < questions.length) {
    timerEl.textContent = `${index + 1}/${questions.length}`;
  }
  // If index is past last question → show review page
  if (index >= questions.length) {
    showReview();
    return;
  }

  const q = questions[index];
  const qWrapper = document.createElement("div");
  qWrapper.classList.add("question-wrapper");

  // Question text
  const qText = document.createElement("p");
  qText.textContent = `Q${index + 1}: ${q.question ?? "Untitled question"}`;
  qWrapper.appendChild(qText);

  // Choices container
  const optionsContainer = document.createElement("div");
  optionsContainer.classList.add("options");

  (q.choices || []).forEach((choiceText, i) => {
    const label = document.createElement("label");
    label.classList.add("choice-label");

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `question-${index}`;
    radio.value = i;

    // restore previous selection
    if (answers[index] === i) {
      radio.checked = true;
    }

    radio.addEventListener("change", () => {
      answers[index] = i; // save selected choice
    });

    label.appendChild(radio);
    label.appendChild(document.createTextNode(choiceText));
    optionsContainer.appendChild(label);
    optionsContainer.appendChild(document.createElement("br"));
  });

  qWrapper.appendChild(optionsContainer);

  // Navigation buttons
  const navDiv = document.createElement("div");
  navDiv.classList.add("nav-btns");

  const backBtn = document.createElement("button");
  backBtn.textContent = "⬅ Back";
  backBtn.disabled = index === 0;
  backBtn.addEventListener("click", () => {
    currentQuestionIndex--;
    showQuestion(currentQuestionIndex);
  });

  const nextBtn = document.createElement("button");
  if (index === questions.length - 1) {
    nextBtn.textContent = "Proceed to Review ➡";
  } else {
    nextBtn.textContent = "Next ➡";
  }

  nextBtn.addEventListener("click", () => {
  if (index === questions.length - 1) {
    // last question → go to review
    showReview();
  } else {
    currentQuestionIndex++;
    showQuestion(currentQuestionIndex);
  }
});

  navDiv.appendChild(backBtn);
  navDiv.appendChild(nextBtn);

  qWrapper.appendChild(navDiv);
  storyContentEl.appendChild(qWrapper);
}

// Review Page
function showReview() {
  const storyContentEl = document.getElementById("story-content");
  storyContentEl.innerHTML = "<h3>📝 Review Your Answers</h3>";

  questions.forEach((q, idx) => {
    const block = document.createElement("div");
    block.classList.add("review-block");

    block.innerHTML = `<p><strong>Q${idx + 1}:</strong> ${q.question}</p>`;
    
    q.choices.forEach((c, i) => {
      const mark = (answers[idx] === i) ? "✅" : "";
      const p = document.createElement("p");
      p.textContent = `${c} ${mark}`;
      block.appendChild(p);
    });

    // Edit Button
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit Answer";
    editBtn.addEventListener("click", () => {
      currentQuestionIndex = idx;
      showQuestion(idx);
    });
    block.appendChild(editBtn);

    storyContentEl.appendChild(block);
  });

  // Submit Button
  const submitBtn = document.createElement("button");
  submitBtn.id = "submit-btn";              // unique ID
  submitBtn.classList.add("submit");        // class for styling
  submitBtn.textContent = "Submit All";
  
  submitBtn.addEventListener("click", () => {
    console.log("✅ Submit button clicked");
    showResults();
  });

  storyContentEl.appendChild(submitBtn);
}

function showResults() {
  const storyContentEl = document.getElementById("story-content");
  storyContentEl.innerHTML = "";

  // compute scores
  correctCount = 0;
  questions.forEach((q, idx) => {
    if (answers[idx] === q.answerIndex) correctCount++;
  });

  const timeMinutes = seconds / 60;
  const wpm = timeMinutes > 0 ? (totalWords / timeMinutes).toFixed(2) : totalWords;
  const comprehension = ((correctCount / questions.length) * 100).toFixed(2);

  const wpmCap = 200; 
  const wpmScore = Math.min((wpm / wpmCap) * 100, 100);

  const finalGrade = Math.min(((comprehension * 0.7) + (wpmScore * 0.3)), 100).toFixed(2);

  let remark = "";
  if (finalGrade >= 90) remark = "Outstanding";
  else if (finalGrade >= 85) remark = "Very Satisfactory";
  else if (finalGrade >= 80) remark = "Satisfactory";
  else if (finalGrade >= 75) remark = "Fairly Satisfactory";
  else remark = "Did Not Meet Expectations";

  const failClass = finalGrade < 75 ? "fail" : "";
  storyContentEl.innerHTML = `
    <h3>📊 Results</h3>
    <p><strong>Time:</strong> ${formatTime(seconds)}</p>
    <p><strong>Correct:</strong> ${correctCount} / ${questions.length}</p>
    <p><strong>Comprehension:</strong> ${comprehension}%</p>
    <p><strong>WPM:</strong> ${wpm}</p>
    <p><strong>Final Grade:</strong> ${finalGrade}%</p>
    <p class="${failClass}" id="result"><strong>Result:</strong> ${remark}</p>
  `;

  // ✅ Save results to DB only now
  const student = JSON.parse(localStorage.getItem("student"));
  if (student && student.id && currentStoryId) {
    saveResult(student.id, currentStoryId, wpm, correctCount, finalGrade);
  } else {
    console.error("❌ No student or story ID found in localStorage");
    storyContentEl.insertAdjacentHTML("beforeend",
      `<p style="color:red">❌ Unable to save: missing student or story ID</p>`);
  }
}

async function saveResult(studentId, storyId, readSpeed, readScore, finalGrade) {
  const storyContentEl = document.getElementById("story-content");

  try {
    const response = await fetch("/api/save-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        story_id: storyId,
        read_speed: readSpeed,
        read_score: readScore,
        final_grade: finalGrade
      })
    });

    const data = await response.json();
    if (!data.success) {
      console.error("❌ Failed to save result:", data.message);
      storyContentEl.insertAdjacentHTML("beforeend",
        `<p style="color:red">❌ Failed to save result: ${data.message}</p>`);
    } else {
      console.log("✅ Result saved:", data.result);
      storyContentEl.insertAdjacentHTML("beforeend",
        `<p style="color:green">✅ Result saved successfully!</p>`);
    }
  } catch (err) {
    console.error("❌ Error saving result:", err);
    storyContentEl.insertAdjacentHTML("beforeend",
      `<p style="color:red">❌ Error saving result. Check server logs.</p>`);
  }
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
    const response = await fetch(`/api/get-story/${storyId}`);
    const data = await response.json();

    if (data.success) {
      const story = data.story;

      const titleEl = document.getElementById("story-title");
      if (titleEl) titleEl.textContent = story.storyname ?? "Untitled";

      currentStory = story.storycontent ?? "";
      currentStoryId = story.story_id ?? story.id ?? story.storyId ?? storyId;

      totalWords = currentStory.split(/\s+/).filter(Boolean).length;

      questions = parseQuestions(story.storyquest ?? story.storyquest_json ?? []);

      // ✅ AI Format story
      try {
        const formatRes = await fetch("/api/api/format-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: currentStory })
        });

        const formatData = await formatRes.json();
        if (formatData.success && formatData.formatted) {
          console.log("✅ Story formatted by AI");
          currentStory = formatData.formatted;
        } else {
          console.warn("⚠️ Using raw story content, AI format failed:", formatData.message);
        }
      } catch (err) {
        console.error("❌ Error calling format API:", err);
      }

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
      // STOP → show questions
      stopTimer();
      startBtn.style.display = "none"; // hide button
      timerRunning = false;
      currentQuestionIndex = 0;

      const timerEl = document.getElementById("timer");
      if (timerEl) {
        timerEl.textContent = `0/${questions.length}`;
      }

      showQuestion(currentQuestionIndex);
    }
  });
});

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