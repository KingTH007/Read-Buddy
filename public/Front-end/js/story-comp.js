document.addEventListener("DOMContentLoaded", async () => {
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

  // === FORMAT STORY DISPLAY ===
  function formatStoryText(text) {
    if (!text) return "";
    return text
      .split(/\n+/)
      .map(p => `<p class="story-paragraph">${p.trim()}</p>`)
      .join("");
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

          const sid = String(story.id ?? story.story_id ?? "");

          if (sid === String(selectedStoryId)) {
            btn.classList.add("selected");
          }

          // ⚠️ Replace direct navigation with notification
          btn.addEventListener("click", () => {
            const notifOverlayBackground = document.querySelector(".notification-overlay-background");
            const notifOverlay = document.querySelector(".notification");
            const yesBtn = document.getElementById("yes-switch-story");
            const noBtn = document.getElementById("no-switch-story");
            const storyTitle = document.querySelector(".story-title");

            notifOverlayBackground.classList.add("show");
            notifOverlay.classList.add("show");

            storyTitle.textContent = story.storyname || "Untitled";

            // Remove old listeners to avoid stacking
            const newYesBtn = yesBtn.cloneNode(true);
            const newNoBtn = noBtn.cloneNode(true);
            yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
            noBtn.parentNode.replaceChild(newNoBtn, noBtn);

            // ✅ If user confirms
            newYesBtn.addEventListener("click", () => {
              notifOverlayBackground.classList.remove("show");
              notifOverlay.classList.remove("show");
              window.location.search = `?story_id=${sid}`;
            });

            // ❌ If user cancels
            newNoBtn.addEventListener("click", () => {
              notifOverlayBackground.classList.remove("show");
              notifOverlay.classList.remove("show");
            });
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
      if (!rawText) return [];
      // If JSON stored
      if (typeof rawText === "object") {
        if (Array.isArray(rawText)) return rawText;
        if (rawText.questions) return rawText.questions;
        return [];
      }
      // If stored as JSON string
      if (typeof rawText === "string" && rawText.trim().startsWith("[")) {
        return JSON.parse(rawText);
      }
      // If plain text format (Q1:, Q2:, ...)
      const blocks = String(rawText).split(/Q\d+:/).filter(Boolean);
      return blocks.map((block, index) => {
        const lines = block.trim().split("\n").map(l => l.trim()).filter(Boolean);
        const qText = lines[0];
        const choices = lines.slice(1, -1);
        const answerLine = lines[lines.length - 1] || "";
        const answerLetter = answerLine.replace("Answer:", "").trim();
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

    // ✅ If user has answered all questions → show results
    if (index >= questions.length) {
      showResults(); 
      return;
    }

    // clear content first
    storyContentEl.innerHTML = "";

    // Update progress
    const timerEl = document.getElementById("timer");
    if (timerEl) timerEl.textContent = `${index + 1}/${questions.length}`;

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

      if (answers[index] === i) radio.checked = true;

      radio.addEventListener("change", () => {
        answers[index] = i;
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
    nextBtn.textContent = index === questions.length - 1 ? "Finish Quiz ➡" : "Next ➡";

    nextBtn.addEventListener("click", () => {
      currentQuestionIndex++;

      // ✅ When reaching the 20th question, show the review page
      if (currentQuestionIndex === 20 || currentQuestionIndex >= questions.length) {
        showReview();
      } else {
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

    // ✅ Compute scores
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answerIndex) correctCount++;
    });

    const timeMinutes = seconds / 60;
    const wpm = timeMinutes > 0 ? (totalWords / timeMinutes).toFixed(2) : totalWords;
    const comprehension = ((correctCount / questions.length) * 100).toFixed(2);

    // ✅ Reading speed scoring (200 wpm ideal)
    const wpmCap = 200;
    const wpmScore = Math.min((wpm / wpmCap) * 100, 100);

    // ✅ Weighted final grade (70% comprehension + 30% speed)
    const finalGrade = Math.min(((comprehension * 0.7) + (wpmScore * 0.3)), 100).toFixed(2);

    // ✅ Remarks
    let remark = "";
    if (finalGrade >= 90) remark = "🌟 Outstanding! Keep it up!";
    else if (finalGrade >= 85) remark = "🎉 Very Satisfactory! Great job!";
    else if (finalGrade >= 80) remark = "👍 Satisfactory! You’re improving!";
    else if (finalGrade >= 75) remark = "🙂 Fairly Satisfactory! Try to read a bit more carefully next time.";
    else remark = "💡 Did Not Meet Expectations. Don't give up — practice makes perfect!";

    const failClass = finalGrade < 75 ? "fail" : "";

    // ✅ Clear and friendly message for students
    storyContentEl.innerHTML = `
      <div class="result-card">
        <h2>🎯 Your Story Comprehension Results</h2>
        <p>Great work finishing the story quiz! Here’s a summary of how you did:</p>
        <div class="result-details">
          <p><strong>🕒 Total Reading Time:</strong> ${formatTime(seconds)}</p>
          <p><strong>✅ Correct Answers:</strong> ${correctCount} out of ${questions.length}</p>
          <p><strong>📖 Comprehension Score:</strong> ${comprehension}%</p>
          <p><strong>⚡ Reading Speed (WPM):</strong> ${wpm}</p>
          <p><strong>🏅 Final Grade:</strong> ${finalGrade}%</p>
          <p class="${failClass}" id="result"><strong>📝 Result:</strong> ${remark}</p>
        </div>
        <p>Remember: Reading faster helps, but understanding the story is even more important! You can always try again to improve your score.</p>
      </div>
    `;

    // ✅ Save results to database
    const student = JSON.parse(localStorage.getItem("student"));
    if (student && student.id && currentStoryId) {
      saveResult(student.id, currentStoryId, wpm, correctCount, finalGrade, remark);
    } else {
      console.error("❌ No student or story ID found in localStorage");
      storyContentEl.insertAdjacentHTML("beforeend",
        `<p style="color:red">❌ Unable to save: missing student or story ID</p>`);
    }
  }

  async function saveResult(student_id, story_id, read_speed, read_score, final_grade) {
    try {
      const res = await fetch("/api/save-result", { // ✅ Fixed URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id, story_id, read_speed, read_score, final_grade }),
      });

      const data = await res.json();
      if (data.success) {
        console.log("✅ Result saved successfully:", data.result);
      } else {
        console.error("❌ Failed to save result:", data.message);
      }
    } catch (err) {
      console.error("❌ Error saving result:", err);
    }
  }

  // Fetch one story by ID (and parse questions)
  async function fetchStory() {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get("story_id");
    const storyContentEl = document.getElementById("story-content");
    const qBox = document.getElementById("question-box");
    if (qBox) qBox.style.display = "none";

    if (!storyId) {
      storyContentEl.innerHTML = "<p>❌ No story selected.</p>";
      return;
    }

    try {
      const response = await fetch(`/api/get-story/${storyId}`);
      const data = await response.json();

      if (data.success) {
        const story = data.story;
        const titleEl = document.getElementById("story-title");
        if (titleEl) titleEl.textContent = story.storyname ?? "Untitled";

        currentStory = formatStoryText(story.storycontent ?? "");
        currentStoryId = story.story_id ?? story.id ?? storyId;
        totalWords = (story.storycontent ?? "").split(/\s+/).filter(Boolean).length;

        // Temporarily hold all question levels
        window.storyQuestions = {
          easy: story.storyquest_easy ?? [],
          medium: story.storyquest_med ?? [],
          hard: story.storyquest_hard ?? []
        };

        // Show intro
        storyContentEl.innerHTML = `
          <div class="instruction">
            <p><strong>Story Comprehension Guide:</strong></p>
                <p>Welcome! In this activity, you will practice your reading and understanding skills.</p>
                <p>First, click the <strong>START</strong> button to begin reading the story titled 
                "<strong>${story.storyname ?? 'this story'}</strong>".</p>
                <p>Take your time to carefully read and understand the story.</p>
                <p>Once you are done reading, click the <strong>FINISH</strong> button to mark that you are finished.</p>
                <p>After that, you will be asked to choose your preferred difficulty level — 
                <strong>Easy</strong>, <strong>Medium</strong>, or <strong>Hard</strong>.</p>
                <p>The quiz will then begin automatically, showing <strong>20 questions</strong> 
                based on your chosen difficulty level.</p>
                <p>Answer each question carefully to test your comprehension of the story. Good luck!</p>
          </div>
        `;
      } else {
        storyContentEl.innerHTML = "<p>❌ Failed to load story.</p>";
      }
    } catch (err) {
      console.error("Error fetching story:", err);
      storyContentEl.innerHTML = "<p>❌ Error loading story.</p>";
    }
  }


  await fetchAllStories();
  await fetchStory();

  const startBtn = document.getElementById("start-btn");
  const storyContentEl = document.getElementById("story-content");
  if (!startBtn || !storyContentEl) return;

  // Handle START/STOP button
  startBtn.addEventListener("click", async () => {
    if (!currentStory) return;

    if (!timerRunning) {
      // START READING
      storyContentEl.innerHTML = `<p>${currentStory}</p>`;
      startBtn.textContent = "FINISH";
      timerRunning = true;
      seconds = 0;
      startTimer();
    } else {
      // FINISH READING → STOP TIMER
      stopTimer();
      timerRunning = false;
      startBtn.style.display = "none"; // hide button

      // === Show difficulty mode selection before questions ===
      storyContentEl.innerHTML = `
        <div class="difficulty-select">
          <h3>📘 Choose Difficulty Mode</h3>
          <p>Select your preferred difficulty before starting the quiz:</p>
          <div class="difficulty-buttons">
            <button class="diff-btn easy">Easy</button>
            <button class="diff-btn medium">Medium</button>
            <button class="diff-btn hard">Hard</button>
          </div>
        </div>
      `;

      // Add click listeners for difficulty choices
      const diffButtons = storyContentEl.querySelectorAll(".diff-btn");
      diffButtons.forEach(btn => {
        btn.addEventListener("click", async () => {
          let chosen = btn.classList.contains("easy") ? "easy" :
                      btn.classList.contains("medium") ? "medium" : "hard";

          storyContentEl.innerHTML = `<p>Loading <strong>${chosen}</strong> questions...</p>`;

          // Pick correct set of questions
          const rawSet = window.storyQuestions?.[chosen] ?? [];
          questions = parseQuestions(rawSet);

          if (!questions.length) {
            storyContentEl.innerHTML = `<p>❌ No ${chosen} questions available for this story.</p>`;
            return;
          }

          setTimeout(() => {
            currentQuestionIndex = 0;
            showQuestion(currentQuestionIndex);
          }, 1000);
        });
      });
    }
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
        if (confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("teacher");
            localStorage.removeItem("student");
            window.location.href = "/index.html";
        }
    });
});