document.addEventListener("DOMContentLoaded", () => {
  const sirSection = document.querySelector("#sayItRight");
  if (!sirSection) return;

  const aiBubble = sirSection.querySelector("#aiBubble");
  const bookIdle = sirSection.querySelector("#bookIdle");
  const bookTalking = sirSection.querySelector("#bookTalking");
  const micButton = sirSection.querySelector(".openVoice");
  const startBtn = sirSection.querySelector("#startVoice");
  const restartBtn = sirSection.querySelector("#restartVoice");
  const modeButtons = sirSection.querySelectorAll("#sayItRight-mode button");

  if (!aiBubble) {
    console.error("Missing #aiBubble inside #sayItRight");
    return;
  }

  let recognition = null;
  let wordData = {};
  let selectedMode = "";
  let modeSelected = false;
  let currentWordIndex = 0;
  let score = 0;
  let isListening = false;

  // ✅ Correct JSON path
  const fetchPath = "../../Back-end/json/sayItRightWords.json";

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

  function speakTTS(text) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    u.onstart = () => {
      bookIdle.style.display = "none";
      bookTalking.style.display = "block";
    };
    u.onend = () => {
      bookIdle.style.display = "block";
      bookTalking.style.display = "none";
    };
    window.speechSynthesis.speak(u);
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

    micButton.classList.add("show");
    currentWordIndex = 0;
    score = 0;
    showCurrentWord();
  });

  restartBtn.addEventListener("click", () => {
    resetActivity();
  });

  function resetActivity() {
    window.speechSynthesis.cancel();
    micButton.classList.remove("show");
    currentWordIndex = 0;
    score = 0;
    aiBubble.innerHTML = `<p>
                            Welcome to <b>Story Detectives!</b> 🔎  <br>
                            Here, you’ll become a reading detective! I’ll show you short stories with <b>missing words</b>. Your task is to identify the correct word that completes the sentence by choosing from the given options. This will help you boost your vocabulary and understanding of story context.  
                            <br><br>
                            <b>Select a difficulty mode to show instructions.</b>
                          </p>`;
  }

  // Render current word card
  function renderWordCard(wordObj) {
    const word = wordObj.word || "";
    const type = wordObj.type || "";
    const target = wordObj.target || "";
    const pronunciation = wordObj.pronunciation || "";

    aiBubble.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="font-size:2.6rem; font-weight:700; line-height:1; color:#fff;">
          ${escapeHtml(word)}
        </div>
        <div style="font-size:0.9rem; opacity:0.95; color:#fff;">
          <em>${escapeHtml(type)}</em> · Target: ${escapeHtml(target)} · Pronunciation: ${escapeHtml(pronunciation)}
        </div>
      </div>
      <button class="speak-btn" aria-label="Play word" title="Play word" style="background:none;border:none;color:white;font-size:1.1rem;">
        <i class="fa fa-volume-up"></i>
      </button>
    `;

    const playBtn = aiBubble.querySelector(".speak-btn");
    if (playBtn) {
      playBtn.onclick = (e) => {
        e.stopPropagation();
        speakTTS(word);
      };
    }
  }

  function showCurrentWord() {
    const list = wordData[selectedMode];
    if (!list || currentWordIndex >= list.length) {

      showResults();
      return;
    }
    const wordObj = list[currentWordIndex];
    renderWordCard(wordObj);
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

      // Track wrong words array
      if (!window.wrongWords) window.wrongWords = [];

      if (userSpeech.includes(correct)) {
        score++;
        speakTTS("Correct");
        currentWordIndex++;

        // ✅ Check if this was the LAST word
        if (currentWordIndex >= wordData[selectedMode].length) {
          setTimeout(() => showResults(), 1000);
        } else {
          setTimeout(() => showCurrentWord(), 1000);
        }
      } else {
        speakTTS(`Try again. The correct word is ${correct}`);
        if (!wrongWords.includes(correct)) {
          wrongWords.push(correct);
        }
      }
  }


  // ✅ Redirects to new page
  function showResults() {
    const total = (wordData[selectedMode] || []).length;
    const wrongCount = wrongWords.length || 0;
    const rightCount = total - wrongCount;
    const percent = total ? Math.round((rightCount / total) * 100) : 0;

    let feedback = "";
    if (percent >= 90) feedback = "Excellent! Keep it up!";
    else if (percent >= 70) feedback = "Good! You’re improving!";
    else feedback = "Needs more practice.";

    // ✅ Display list of wrong words without duplicates
    const wrongListHTML = wrongWords.length
      ? `<div style="margin-top:6px;color:#fff;">${escapeHtml(wrongWords.join(", "))}</div>`
      : `<div style="margin-top:6px;color:#fff;"><em>None — great job!</em></div>`;

    const resultHTML = `
      <div class="bubble-text" style="color:#fff;">
        <strong>HERE’S YOUR RESULT</strong><br><br>
        ✅ Correct words: ${rightCount}/${total}<br>
        ❌ Words pronounced wrong: ${wrongWords.length > 0 ? '' : '(none)'}<br>
        ${wrongListHTML}
        <br>
        Accuracy: ${percent}%<br>
        <em>${feedback}</em>
      </div>
    `;

    aiBubble.innerHTML = resultHTML;

    // ✅ Spoken summary
    speakTTS(`Here is your result. You pronounced ${rightCount} out of ${total} words correctly. Your accuracy is ${percent} percent.`);
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
