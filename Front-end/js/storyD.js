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

    function toggleModeButtons(state) {
        answerButtons.forEach(b => {
            b.disabled = !state;
            b.classList.toggle("disabled-btn", !state);
        });
    }

    answerButtons.forEach(b => b.disabled = true);


    function speakTTS(text, callback = null) {
        const voice = window.selectedVoice;

        if (!voice) {
            console.warn("Voice not loaded yet. Waiting 100ms...");
            setTimeout(() => speakTTS(text), 100); // retry
            return;
        }
        
        window.speechSynthesis.cancel();

        // 🧠 Replace one or multiple underscores with a single spoken "blank"
        const cleanText = String(text)
            .replace(/_+/g, " blank ") // convert any number of underscores to one "blank"
            .replace(/\s+/g, " ") // normalize spaces
            .trim();

        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.voice = voice;
        utter.lang = voice.lang;
        utter.rate = 1.0;
        utter.pitch = 2.2;
        utter.volume = 1.0;

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

        const isChoiceMessage = text.startsWith("A.") || text.startsWith("B.") || text.includes("Question") || text.includes("Choice:");    

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

        const speakBtn = row.querySelector(".speak-btn");
        if (speakBtn) {
            speakBtn.addEventListener("click", () => {
                speakTTS(stripHTML(text));
            });
        }

        // 🟡 Ensure video background is present before message
        ensureVideoWrapper();
        sdBox.appendChild(row);
        sdBox.scrollTop = sdBox.scrollHeight;

        if (speak) speakTTS(stripHTML(text), callback);
    }

    // 🟢 Ensure video wrapper exists
    function ensureVideoWrapper() {
        const contentBoxes = document.querySelectorAll(".content-box");

        // 🧱 Prevent body/page scroll
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";

        contentBoxes.forEach(box => {
            let videoWrapper = box.querySelector(".video-wrapper");

            // ✅ If no video-wrapper exists, create it inside the content-box
            if (!videoWrapper) {
                videoWrapper = document.createElement("div");
                videoWrapper.classList.add("video-wrapper");
                videoWrapper.innerHTML = `
                    <video autoplay muted loop playsinline class="box-bg-video">
                        <source src="../asset/bg.mp4" type="video/mp4">
                    </video>
                `;
                box.prepend(videoWrapper);
            }

                // ✅ Set video-wrapper position fixed relative to viewport but aligned to box
            videoWrapper.style.position = "fixed";
            videoWrapper.style.top = box.getBoundingClientRect().top + "px";
            videoWrapper.style.left = box.getBoundingClientRect().left + "px";
            videoWrapper.style.width = box.offsetWidth + "px";
            videoWrapper.style.height = box.offsetHeight + "px";
            videoWrapper.style.zIndex = "0";
            videoWrapper.style.pointerEvents = "none";
            videoWrapper.style.overflow = "hidden";

            const video = videoWrapper.querySelector("video");
            if (video) {
                video.style.width = "100%";
                video.style.height = "100%";
                video.style.objectFit = "cover";
            }

            // ✅ Keep video aligned and fixed even while scrolling inside the box
            box.addEventListener("scroll", () => {
                if (box.scrollTop < 0) box.scrollTop = 0;
                const maxScroll = box.scrollHeight - box.clientHeight;
                if (box.scrollTop > maxScroll) box.scrollTop = maxScroll;

                videoWrapper.style.top = box.getBoundingClientRect().top + "px";
            });

            // ✅ Prevent scroll bleed or bounce on mobile (touch)
            box.addEventListener("touchmove", e => {
                const maxScroll = box.scrollHeight - box.clientHeight;
                if (maxScroll <= 0) {
                    e.preventDefault();
                    return;
                }

                const currentY = e.touches[0].clientY;
                const atTop = box.scrollTop === 0;
                const atBottom = box.scrollTop === maxScroll;
                const isScrollingUp = currentY > (box.lastTouchY || 0);
                const isScrollingDown = currentY < (box.lastTouchY || 0);

                // 🚫 Prevent scrolling beyond top/bottom
                if ((atTop && isScrollingUp) || (atBottom && isScrollingDown)) {
                    e.preventDefault();
                }

                box.lastTouchY = currentY;
            }, { passive: false });

            // ✅ Adjust video-wrapper on window resize
            window.addEventListener("resize", () => {
                videoWrapper.style.width = box.offsetWidth + "px";
                videoWrapper.style.height = box.offsetHeight + "px";
                videoWrapper.style.top = box.getBoundingClientRect().top + "px";
                videoWrapper.style.left = box.getBoundingClientRect().left + "px";
            });

            // ✅ Ensure all inner elements stay above background
            box.querySelectorAll("*:not(.video-wrapper)").forEach(el => {
                el.style.position = "relative";
                el.style.zIndex = "2";
            });
        });
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
            speakTTS("Please select a mode first.", true);
            return;
        }

        // ✅ Disable Start button to prevent multiple clicks
        startBtn.disabled = true;
        startBtn.classList.add("disabled-btn");

        // ✅ Hide mode buttons
        modeButtons.forEach(b => b.style.display = "none");

        // ✅ Show answer container
        answerContainer.style.display = "flex";

        // Disable mode buttons to prevent changing mode during story
        modeButtons.forEach(b => b.disabled = true);

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

            toggleModeButtons(true);
        });
    }

    // ✅ Handle answers
    answerButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            toggleModeButtons(false);

            const q = currentStory.questions[currentQuestionIndex];
            const selectedChoice = btn.dataset.choice === "A" ? q.choices[0] : q.choices[1];
            addUserMessage(selectedChoice);

            if (selectedChoice === q.answer) {
                correctCount++;
                addAIMessage(`Correct! The correct answer is "${q.answer}".`, false, () => {
                    currentQuestionIndex++;
                    setTimeout(showQuestion, 2500);
                });
            } else {
                addAIMessage(`Wrong. The correct answer is "${q.answer}".`, false, () => {
                    currentQuestionIndex++;
                    setTimeout(showQuestion, 2500);
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
        const percent = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

        let feedback = "";
        if (percent >= 90) {
            feedback = "🎉 Excellent work!";
        } else if (percent >= 70) {
            feedback = "👍 Good job! Keep practicing.";
        } else if (percent >= 50) {
            feedback = "🙂 Not bad, but you can do better.";
        } else {
            feedback = "⚠️ You need more practice.";
        }

        const breakdown = storyScores.map(s => `Story ${s.story}: ${s.correct}/${s.total}`).join("<br>");

        const msg = `
            <b>🎉 You finished all stories!</b><br><br>
            <strong>Total Score:</strong> ${totalCorrect}/${totalQs} (${percent}%)<br>
            <strong>Feedback:</strong> ${feedback}<br><br>
            <strong>Story Breakdown:</strong><br>${breakdown}<br><br>
            Click <b>Restart</b> to play again.
        `;

        // Add results without speak button
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
                    <span class="bubble-text">${msg}</span>
                </div>
            </div>
        `;
        sdBox.appendChild(row);
        sdBox.scrollTop = sdBox.scrollHeight;

        modeButtons.forEach(b => (b.disabled = false));

        // Save result to backend
        saveLearningResult("Story Detectives", selectedMode, percent);
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
        window.location.href = "../../Front-end/html/learn-act.html?activity=storyDetectives";
    }

    ensureVideoWrapper();
});