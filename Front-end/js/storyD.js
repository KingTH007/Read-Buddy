document.addEventListener("DOMContentLoaded", () => {
    const sdBox = document.getElementById("sdBox");
    const answerContainer = document.getElementById("sdAnswers");
    const answerButtons = answerContainer.querySelectorAll(".answer-btn");
    const modeButtons = document.querySelectorAll("#storyDetectives-mode button");
    const startBtn = document.getElementById("startStory");
    const restartBtn = document.getElementById("restartStory");

    let stories = {};
    let selectedMode = null;
    let currentStoryIndex = 0;
    let currentQuestionIndex = 0;
    let currentStory = null;
    let correctCount = 0;
    const storyScores = [];
    let currentTextToSpeak = "";

    const JSON_PATH = "../json/storydetectives.json";

    // 🧾 Load stories
    fetch(JSON_PATH)
        .then(res => res.json())
        .then(data => {
            stories = {
                Easy: data.easy || [],
                Medium: data.medium || [],
                Hard: data.hard || []
            };
        })
        .catch(err => {
            console.error("Failed to load storydetectives.json:", err);
            addAIMessage("⚠️ Failed to load stories.", false);
        });

    const modeInstructions = {
        Easy: "Easy Mode: 3 short stories. Focus on recall and fill-in-the-blank answers.",
        Medium: "Medium Mode: 3 medium stories. Focus on inference and sequence.",
        Hard: "Hard Mode: 3 longer stories. Focus on deeper comprehension."
    };

    // 🔊 Voice setup
    function stripHTML(html) {
        return String(html).replace(/<[^>]*>?/gm, "");
    }

    function speakTTS(text, callback = null) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        utter.rate = 0.9;

        const activeRow = sdBox.querySelector(".ai-row:last-child");
        if (activeRow) {
            const idleImg = activeRow.querySelector("img[alt='AI Idle']");
            const talkingGif = activeRow.querySelector("img[alt='AI Talking']");
            if (idleImg && talkingGif) {
                idleImg.style.display = "none";
                talkingGif.style.display = "block";
            }
        }

        utter.onend = () => {
            const activeRow = sdBox.querySelector(".ai-row:last-child");
            if (activeRow) {
                const idleImg = activeRow.querySelector("img[alt='AI Idle']");
                const talkingGif = activeRow.querySelector("img[alt='AI Talking']");
                if (idleImg && talkingGif) {
                    idleImg.style.display = "block";
                    talkingGif.style.display = "none";
                }
            }
            if (callback) setTimeout(callback, 500);
        };

        window.speechSynthesis.speak(utter);
    }

    // 💬 Chat functions
    function addUserMessage(text) {
        const row = document.createElement("div");
        row.classList.add("user-row");
        row.innerHTML = `
            <div class="bubble user">${text}</div>
            <div class="user-profile">
                <img src="../asset/user_profile.png" alt="User" width="48" height="48">
            </div>
        `;
        sdBox.appendChild(row);
        sdBox.scrollTop = sdBox.scrollHeight;
    }

    // 🟢 AI bubble
    function addAIMessage(text, speak = false, callback = null) {
        const row = document.createElement("div");
        row.classList.add("ai-row");
        row.innerHTML = `
            <div class="book-ai">
                <img src="../asset/AI-bot.png" alt="AI Idle" style="display:block;">
                <img src="../asset/AI-bot-rea.gif" alt="AI Talking" style="display:none;">
            </div>
            <div class="ai-info">
                <div class="ai-name-label">Rea</div>
                <div class="bubble system">
                    <span class="bubble-text">${text}</span>
                    <button class="speak-btn"><i class="fa fa-volume-up"></i></button>
                </div>
            </div>
        `;

        row.querySelector(".speak-btn").addEventListener("click", () => {
            speakTTS(stripHTML(text));
        });

        // 🟡 Ensure video background is present before message
        ensureVideoWrapper();

        sdBox.appendChild(row);
        sdBox.scrollTop = sdBox.scrollHeight;

        if (speak) speakTTS(stripHTML(text), callback);
    }

    // 🟢 Ensure video wrapper exists
    function ensureVideoWrapper() {
        let videoWrapper = sdBox.querySelector(".video-wrapper");
        if (!videoWrapper) {
            const wrapperHTML = `
                <div class="video-wrapper">
                    <video autoplay muted loop playsinline class="box-bg-video">
                        <source src="../asset/bg.mp4" type="video/mp4">
                    </video>
                </div>
            `;
            sdBox.insertAdjacentHTML("afterbegin", wrapperHTML);
        }
    }

    // 🎯 Mode selection
    modeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            modeButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedMode = btn.textContent.trim();
            sdBox.innerHTML = "";
            ensureVideoWrapper();
            addAIMessage(modeInstructions[selectedMode] + " Click START to begin.", true);
        });
    });

    // ▶️ Start story
    startBtn.addEventListener("click", () => {
        if (!selectedMode) {
            addAIMessage("Please select a mode first.", true);
            return;
        }

        const list = stories[selectedMode];
        if (!list?.length) {
            addAIMessage("Stories are still loading. Please wait.", true);
            return;
        }

        modeButtons.forEach(b => (b.disabled = true));
        currentStoryIndex = 0;
        currentQuestionIndex = 0;
        correctCount = 0;
        storyScores.length = 0;

        startNextStory();
    });

    // 📖 Start each story
    function startNextStory() {
        const list = stories[selectedMode];
        if (currentStoryIndex >= list.length) {
            showResults();
            return;
        }

        currentStory = list[currentStoryIndex];
        currentQuestionIndex = 0;
        sdBox.innerHTML = "";
        ensureVideoWrapper();

        const storyText = `<strong>Story ${currentStoryIndex + 1}:</strong><br>${currentStory.passage}`;
        addAIMessage(storyText, true, () => showQuestion());
    }

    // ❓ Show question
    function showQuestion() {
        if (currentQuestionIndex >= currentStory.questions.length) {
            storyScores.push({
                story: currentStoryIndex + 1,
                correct: correctCount,
                total: currentStory.questions.length
            });
            currentStoryIndex++;
            setTimeout(startNextStory, 1000);
            return;
        }

        const q = currentStory.questions[currentQuestionIndex];
        addAIMessage(`Question ${currentQuestionIndex + 1}: ${q.question}`, true, () => {
            const [choiceA, choiceB] = q.choices;
            answerContainer.querySelector('[data-choice="A"]').textContent = `A. ${choiceA}`;
            answerContainer.querySelector('[data-choice="B"]').textContent = `B. ${choiceB}`;
            answerContainer.style.display = "flex";
        });
    }

    // ✅ Handle answers
    answerButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const q = currentStory.questions[currentQuestionIndex];
            const selectedChoice = btn.dataset.choice === "A" ? q.choices[0] : q.choices[1];
            addUserMessage(selectedChoice);

            if (selectedChoice === q.answer) {
                correctCount++;
                addAIMessage("Correct!", true, () => {
                    currentQuestionIndex++;
                    setTimeout(showQuestion, 1000);
                });
            } else {
                addAIMessage(`Wrong. The correct answer is "${q.answer}".`, true, () => {
                    currentQuestionIndex++;
                    setTimeout(showQuestion, 1000);
                });
            }
        });
    });

    // 🏁 Results
    function showResults() {
        sdBox.innerHTML = "";
        ensureVideoWrapper();

        const totalCorrect = storyScores.reduce((sum, s) => sum + s.correct, 0);
        const totalQs = storyScores.reduce((sum, s) => sum + s.total, 0);
        const breakdown = storyScores.map(s => `Story ${s.story}: ${s.correct}/${s.total}`).join("<br>");

        const msg = `
            <b>🎉 You finished all stories!</b><br><br>
            <strong>Total Score:</strong> ${totalCorrect}/${totalQs}<br><br>
            ${breakdown}<br><br>
            Click <b>Restart</b> to play again.
        `;
        addAIMessage(msg, true);
        modeButtons.forEach(b => (b.disabled = false));
    }

    // 🔁 Restart confirmation
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

    // 🔁 Reset
    function resetAll() {
        window.speechSynthesis.cancel();
        sdBox.innerHTML = "";
        ensureVideoWrapper();

        const welcomeHTML = `
            <div class="ai-row">
                <div class="book-ai">
                    <img src="../asset/AI-bot.png" alt="AI Idle" style="display:block;">
                    <img src="../asset/AI-bot-rea.gif" alt="AI Talking" style="display:none;">
                </div>
                <div class="ai-info">
                    <div class="ai-name-label">Rea</div>
                    <div class="bubble system" id="aiBubble">
                        <p>
                            Welcome to <b>Story Detectives!</b> 🔎 <br>
                            Here, you’ll become a reading detective! I’ll show you short stories with <b>missing words</b>.
                            Your task is to identify the correct word by choosing from the given options.
                            <br><br>
                            <b>Select a difficulty mode to show instructions.</b>
                        </p>
                    </div>
                </div>
            </div>
        `;
        sdBox.insertAdjacentHTML("beforeend", welcomeHTML);

        modeButtons.forEach(b => {
            b.disabled = false;
            b.classList.remove("active");
        });
        selectedMode = null;
    }

    // 🟡 Add video wrapper initially
    ensureVideoWrapper();
});
