document.addEventListener("DOMContentLoaded", () => {
  const sirSection = document.querySelector("#sayItRight");
  if (!sirSection) return;

  const aiBubble = sirSection.querySelector("#aiBubble");
  const bookIdle = sirSection.querySelector("#bookIdle");
  const bookTalking = sirSection.querySelector("#bookTalking");
  const textbookIdle = sirSection.querySelector("#textbookIdle");
  const textbookTalking = sirSection.querySelector("#textbookTalking");
  const micButton = sirSection.querySelector(".openVoice");
  const skipButton = sirSection.querySelector(".skip-btn");
  const startBtn = sirSection.querySelector("#startVoice");
  const restartBtn = sirSection.querySelector("#restartVoice");
  const modeButtons = sirSection.querySelectorAll("#sayItRight-mode button");
  const aiContainer = sirSection.querySelector(".ai-container");
  const aiRow = sirSection.querySelector(".ai-row");
  const aiTextCard = sirSection.querySelector("#aiTextCard");

  aiContainer.style.display = "none";
  aiTextCard.style.display = "none";

  let recognition = null;
  let wordData = {};
  let selectedMode = "";
  let modeSelected = false;
  let currentWordIndex = 0;
  let score = 0;
  let isListening = false;

  // Track wrong & skipped words
  let wrongWords = [];
  let skippedWords = [];
  let selectedVoice = null;

  // ✅ Correct JSON path
  const fetchPath = "/json/sayItRightWords.json";

  // Load JSON
  fetch(fetchPath)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      wordData = {
        Easy: data.easy || [],
        Medium: data.medium || [],
        Hard: data.hard || []
      };
    })
    .catch(err => {
      console.error("Error loading JSON:", err);
      aiBubble.innerHTML = `<span class="bubble-text">⚠️ Failed to load word list.</span>`;
    });

  const modeInstructions = {
    Easy: "Easy Mode: Simple words to warm up your pronunciation.",
    Medium: "Medium Mode: Practice longer words for clearer speech.",
    Hard: "Hard Mode: Challenge your tongue with difficult words!"
  };

  // Mode selection
  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedMode = btn.textContent.trim();
      modeSelected = true;
      aiBubble.innerHTML = `<span class="bubble-text">${modeInstructions[selectedMode]} Press START when you are ready.</span>`;
      speakTTS(modeInstructions[selectedMode] + " Press start when you are ready.");
    });
  });

  // ✅ Speech function with talking animation
  function speakTTS(text) {
    const voice = window.selectedVoice;

    if (!voice) {
        console.warn("Voice not loaded yet. Waiting 100ms...");
        setTimeout(() => speakTTS(text), 100); // retry
        return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = voice;
    utter.lang = voice.lang;
    utter.rate = 1.0;
    utter.pitch = 2.2;
    utter.volume = 1.0;

    utter.onstart = () => {
      bookIdle.style.display = "none";
      bookTalking.style.display = "block";
      textbookIdle.style.display = "none";
      textbookTalking.style.display = "block";
    };

    utter.onend = () => {
      bookIdle.style.display = "block";
      bookTalking.style.display = "none";
      textbookIdle.style.display = "block";
      textbookTalking.style.display = "none";
    };

    window.speechSynthesis.speak(utter);
  }

  // Start exercise
  startBtn.addEventListener("click", () => {
    if (!modeSelected) {
      speakTTS("Please select a mode first.");
      return;
    }

    const list = wordData[selectedMode];
    if (!list || list.length === 0) {
      speakTTS("Words are still loading. Please wait a moment.");
      return;
    }

    aiRow.style.display = "none";
    modeButtons.forEach(btn => btn.style.display = "none");
    startBtn.disabled = true;
    startBtn.classList.add("disabled-btn");

    aiContainer.style.display = "flex";
    aiTextCard.style.display = "flex";
    micButton.classList.add("show");
    skipButton.classList.add("show");

    currentWordIndex = 0;
    score = 0;
    wrongWords = [];
    skippedWords = [];
    showCurrentWord();
  });

  // ✅ Skip word feature
  skipButton.addEventListener("click", () => {
    const list = wordData[selectedMode];
    if (!list || currentWordIndex >= list.length) return;

    const skippedWord = list[currentWordIndex].word;
    if (!skippedWords.includes(skippedWord)) skippedWords.push(skippedWord);

    speakTTS(`Let's skip this one. Moving to the next word.`);

    currentWordIndex++;
    if (currentWordIndex >= list.length) {
      setTimeout(() => showResults(), 1000);
    } else {
      setTimeout(() => showCurrentWord(), 1000);
    }
  });

  // Restart confirmation logic
  const restartNotification = document.getElementById("restart-notification");
  const yesRestart = document.getElementById("yes-restart");
  const noRestart = document.getElementById("no-restart");
  const notifBackground = document.querySelector(".notification-overlay-background");
  const nofimg = document.getElementById("notif-icon");

  restartBtn.addEventListener("click", () => {
    restartNotification.style.display = "flex";
    notifBackground.classList.add("show");
    nofimg.classList.add("show");
  });

  yesRestart.addEventListener("click", () => {
    restartNotification.style.display = "none";
    notifBackground.classList.remove("show");
    nofimg.classList.remove("show");
    resetAll();
  });

  noRestart.addEventListener("click", () => {
    restartNotification.style.display = "none";
    notifBackground.classList.remove("show");
    nofimg.classList.remove("show");
  });

  function resetAll() {
    window.location.href = "/learn-act.html?activity=sayItRight";
  }

  function renderAiText(wordObj) {
    const wordHeader = sirSection.querySelector("#word-pronouncation");
    const wordContext = sirSection.querySelector("#word-context");
    const speakBtn = sirSection.querySelector(".speak-btn");

    wordHeader.textContent = wordObj.word;
    wordContext.textContent = `${wordObj.type} · Target: ${wordObj.target} · Pronunciation: ${wordObj.pronunciation}`;
    speakBtn.onclick = () => speakTTS(wordObj.word);
  }

  function showCurrentWord() {
    const list = wordData[selectedMode];
    if (!list || currentWordIndex >= list.length) {
      showResults();
      return;
    }

    const wordObj = list[currentWordIndex];
    renderAiText(wordObj);
    speakTTS(`Say the word: ${wordObj.word}`);
  }

  function setupRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn("Speech Recognition not supported");
      return null;
    }
    const recog = new SR();
    recog.lang = "en-US";
    recog.continuous = false;
    recog.interimResults = false;

    recog.onresult = (ev) => {
      const spoken = ev.results[0][0].transcript.trim().toLowerCase();
      evaluateSpoken(spoken);
    };
    recog.onerror = () => speakTTS("Sorry, I didn't catch that. Try again.");
    recog.onend = () => isListening = false;
    return recog;
  }

  recognition = setupRecognition();

  micButton.addEventListener("mousedown", startListening);
  micButton.addEventListener("touchstart", e => { e.preventDefault(); startListening(); }, {passive:false});
  micButton.addEventListener("mouseup", stopListening);
  micButton.addEventListener("mouseleave", stopListening);
  micButton.addEventListener("touchend", stopListening);

  function startListening() {
    if (!recognition) recognition = setupRecognition();
    if (!recognition || isListening) return;
    isListening = true;
    try {
      recognition.start();
    } catch (err) {
      console.warn("recognition.start() error:", err);
    }
  }

  function stopListening() {
    if (!recognition || !isListening) return;
    try {
      recognition.stop();
    } catch (err) {
      console.warn("recognition.stop() error:", err);
    }
  }

  function evaluateSpoken(userSpeech) {
    const current = wordData[selectedMode]?.[currentWordIndex];
    if (!current) return;

    const correct = current.word.toLowerCase();
    const spoken = userSpeech.toLowerCase();

    // ✅ Track total attempts
    if (!current.attempted) current.attempted = true;

    if (spoken === correct || spoken.includes(correct)) {
      score++;
      speakTTS("Correct!");
      currentWordIndex++;

      // ✅ Mark as correct once
      current.correct = true;

      if (currentWordIndex >= wordData[selectedMode].length) {
        setTimeout(() => showResults(), 1000);
      } else {
        setTimeout(() => showCurrentWord(), 1000);
      }
    } else {
      speakTTS(`Incorrect. The correct word is ${correct}. Try again.`);
      if (!wrongWords.includes(correct)) wrongWords.push(correct);
    }
  }

  // ✅ Show result as chat bubble & hide ai-container
  function showResults() {
    const total = (wordData[selectedMode] || []).length;
    const wrongCount = wrongWords.length || 0;
    const skippedCount = skippedWords.length || 0;

    // Compute correct words explicitly
    const correctCount = total - wrongCount - skippedCount;

    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    let feedback = "";
    if (percent >= 90) feedback = "Excellent! Keep it up!";
    else if (percent >= 70) feedback = "Good! You’re improving!";
    else feedback = "Needs more practice.";

    // Hide AI Text and controls
    aiContainer.style.display = "none";
    aiTextCard.style.display = "none";
    micButton.classList.remove("show");
    skipButton.classList.remove("show");

    aiRow.style.display = "flex";
    aiBubble.style.display = "flex";

    const wrongHTML = wrongWords.length
      ? `<div style="margin-top:6px;color:#fff;">${escapeHtml(wrongWords.join(", "))}</div>`
      : `<div style="margin-top:6px;color:#fff;"><em>None — great job!</em></div>`;

    const skippedHTML = skippedWords.length
      ? `<div style="margin-top:6px;color:#fff;">${escapeHtml(skippedWords.join(", "))}</div>`
      : `<div style="margin-top:6px;color:#fff;"><em>None — nice work!</em></div>`;

    // ✅ Enhanced bubble styling: larger font, bold, and wider line spacing
    const resultHTML = `
      <div class="bubble-text" style="
        color:#fff; 
        font-size:1.1rem; 
        font-weight:500; 
        line-height:1.6; 
        max-width:420px;
        word-wrap: break-word;
      ">
        <strong style="font-size:1.2rem;">📊 HERE’S YOUR RESULT</strong><br><br>
        ✅ Correct words: <strong>${correctCount}/${total}</strong><br>
        ❌ Wrong words: <strong>${wrongCount}</strong><br>
        ⏭️ Skipped words: <strong>${skippedCount}</strong><br><br>
        <strong>Wrong words:</strong><br>${wrongHTML}<br>
        <strong>Skipped words:</strong><br>${skippedHTML}<br><br>
        <strong>Accuracy:</strong> <strong>${percent}%</strong><br>
        <em>${feedback}</em>
      </div>
    `;

    aiBubble.innerHTML = resultHTML;

    // Spoken summary
    speakTTS(
      `Here is your result. You pronounced ${correctCount} out of ${total} words correctly. 
      You got ${wrongCount} wrong and skipped ${skippedCount}. 
      Your accuracy is ${percent} percent.`
    );

    // After computing percent
    saveLearningResult("Say It Right", selectedMode, percent);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
