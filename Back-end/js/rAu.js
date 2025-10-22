document.addEventListener("DOMContentLoaded", () => {
    const contentBox = document.getElementById("rAuBox");
    const startBtn = document.querySelector("#readUnderstand .start-btn");
    const restartBtn = document.querySelector("#readUnderstand .restart-btn");
    const modeButtons = document.querySelectorAll("#readUnderstand .mode-btns button");

    let selectedMode = null;
    let currentStoryIndex = 0;
    let currentQuestionIndex = 0;
    let currentStory = null;
    let storyTimeout = null;
    let storyScores = [];
    let correctCount = 0;
    let totalQuestions = 0;
    let stories = {};

    // References to dynamically created AI images / row
    let aiRowElement = null;
    let idleImgRef = null;
    let talkingImgRef = null;

    // Utility: remove existing AI row (if any)
    function removeAIRow() {
        if (aiRowElement && aiRowElement.parentElement) {
            aiRowElement.parentElement.removeChild(aiRowElement);
        }
        aiRowElement = null;
        idleImgRef = null;
        talkingImgRef = null;

    }

    function createAndInsertAIRow(text = "Press Start to begin.", isStoryOrQuestion = false, positionTop = false) {
        // Main row container
        aiRowElement = document.createElement("div");
        aiRowElement.classList.add("ai-row");

        // Book AI (idle and talking images)
        const bookAi = document.createElement("div");
        bookAi.classList.add("book-ai");

        idleImgRef = document.createElement("img");
        idleImgRef.dataset.role = "idle";
        idleImgRef.src = "../asset/AI-bot.png";
        idleImgRef.alt = "AI Idle";
        idleImgRef.style.display = "block";
        idleImgRef.width = 120;
        idleImgRef.height = 120;

        talkingImgRef = document.createElement("img");
        talkingImgRef.dataset.role = "talking";
        talkingImgRef.src = "../asset/AI-bot-rea.gif";
        talkingImgRef.alt = "AI Talking";
        talkingImgRef.style.display = "none";
        talkingImgRef.width = 120;
        talkingImgRef.height = 120;

        bookAi.appendChild(idleImgRef);
        bookAi.appendChild(talkingImgRef);

        // AI info container
        const aiInfo = document.createElement("div");
        aiInfo.classList.add("ai-info");

        // Name label inside ai-info
        const nameLabel = document.createElement("div");
        nameLabel.classList.add("ai-name-label");
        nameLabel.textContent = "R.E.A";

        // Bubble inside ai-info (with button inside it)
        const bubble = document.createElement("div");
        bubble.classList.add("bubble", "rau-system");

        // Bubble text
        const bubbleText = document.createElement("span");
        bubbleText.classList.add("bubble-text");
        bubbleText.innerHTML = text;

        // 🔊 Speak Again button (icon only)
        const speakBtn = document.createElement("button");
        speakBtn.classList.add("speak-btn");
        speakBtn.setAttribute("aria-label", "Hear again");
        speakBtn.innerHTML = `<i class="fa fa-volume-up"></i>`;
        speakBtn.addEventListener("click", () => speakTTS(stripHTML(text)));

        // Append text + button inside bubble
        bubble.appendChild(bubbleText);
        bubble.appendChild(speakBtn);

        aiInfo.appendChild(nameLabel);
        aiInfo.appendChild(bubble);

        aiRowElement.appendChild(bookAi);
        aiRowElement.appendChild(aiInfo);

        // Append to chat container
        contentBox.appendChild(aiRowElement);
        contentBox.scrollTop = contentBox.scrollHeight;

        // Auto-speak if story/question
        if (isStoryOrQuestion) {
            speakTTS(stripHTML(text));
        }

        return bubble;
    }

    // Toggle to talking image
    function showTalking() {
        if (!idleImgRef || !talkingImgRef) return;
        idleImgRef.style.display = "none";
        talkingImgRef.style.display = "block";
    }

    // Toggle to idle image
    function showIdle() {
        if (!idleImgRef || !talkingImgRef) return;
        idleImgRef.style.display = "block";
        talkingImgRef.style.display = "none";
    }

    // TTS wrapper that toggles images during speaking
    function speakTTS(text) {
        // stop any current speech
        window.speechSynthesis.cancel();

        // ensure AI row exists (create if not)
        if (!aiRowElement) {
            createAndInsertAIRow(text, true);
            return; // createAndInsertAIRow will call speak via isStoryOrQuestion path
        }

        // create utterance
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = 0.85;

        u.onstart = () => {
            showTalking();
        };
        u.onend = () => {
            // small delay before toggling back to idle so GIF finishes nicely
            setTimeout(() => showIdle(), 120);
        };

        window.speechSynthesis.speak(u);
    }

    // Strip HTML helper
    function stripHTML(html) {
        return html.replace(/<[^>]*>?/gm, "");
    }

    // Add user message (creates a fresh user row each time)
    function addUserMessage(text) {
        const userRow = document.createElement("div");
        userRow.classList.add("user-row");

        const bubble = document.createElement("div");
        bubble.classList.add("bubble", "user");
        bubble.textContent = text;

        const userProfile = document.createElement("div");
        userProfile.classList.add("user-profile");
        const img = document.createElement("img");
        img.src = "../asset/user_profile.png";
        img.alt = "User";
        img.width = 48;
        img.height = 48;
        userProfile.appendChild(img);

        const nameLabel = document.createElement("div");
        nameLabel.classList.add("user-name-label");
        const fullName = document.getElementById("user-name")?.textContent.trim() || "User";
        nameLabel.textContent = fullName.split(" ")[0];

        // order: bubble -> profile -> name
        userRow.appendChild(bubble);
        userRow.appendChild(userProfile);
        userRow.appendChild(nameLabel);

        // Always append after AI messages
        contentBox.appendChild(userRow);
        contentBox.scrollTop = contentBox.scrollHeight;
    }

    function addSystemMessage(text, isStoryOrQuestion = false) {
        // Check if this is an "Incorrect" feedback
        const isIncorrect = /^Incorrect/i.test(stripHTML(text));

        // Recreate AI row fresh whenever a new system message is shown
        const bubble = createAndInsertAIRow(text, isStoryOrQuestion, false);

        // If the text starts with "Incorrect", remove the speaker button
        if (isIncorrect) {
            const speakBtn = bubble.querySelector(".speak-btn");
            if (speakBtn) speakBtn.remove();
        }

        if (text.includes("📊 Here are your results")) {
            const speakBtn = bubble.querySelector(".speak-btn");
            if (speakBtn) speakBtn.remove();
        }
    }

    // Reset A-D buttons
    function resetChoiceButtons() {
        const answerBtns = document.querySelectorAll("#readUnderstand .answer-btn");
        answerBtns.forEach((btn, i) => {
            btn.textContent = String.fromCharCode(65 + i); // A, B, C, D
            btn.dataset.answer = "";
        });
    }

    // Load stories JSON
    fetch("../json/rau-stories.json")
        .then(res => res.json())
        .then(data => {
            stories = data;
            console.log("Stories loaded:", stories);
        })
        .catch(err => {
            console.error("Error loading stories:", err);
            addSystemMessage("⚠️ Failed to load stories. Check JSON file.", false);
        });

    const modeInstructions = {
        Easy: "Easy Mode: 3 short and simple stories. Focus on recall and facts.",
        Medium: "Medium Mode: 3 medium-length stories. Focus on sequence and main idea.",
        Hard: "Hard Mode: 3 longer passages. Focus on inference and deeper meaning."
    };

    // MODE clicks: recreate AI row and display instruction
    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            selectedMode = button.textContent.trim();
            currentStoryIndex = 0;
            currentQuestionIndex = 0;
            contentBox.innerHTML = ""; // clear existing rows
            // create new AI row and speak instruction
            addSystemMessage(modeInstructions[selectedMode] + " Click START to begin.", true);
        });
    });

    // START behavior: recreate AI row and start the story flow
    startBtn.addEventListener("click", () => {
        if (!selectedMode) {
            addSystemMessage("Please select a mode first!", false);
            return;
        }
        // disable modes while running
        modeButtons.forEach(btn => btn.disabled = true);
        startStory();
    });

    restartBtn.addEventListener("click", resetAll);

    function resetAll() {
        if (storyTimeout) clearTimeout(storyTimeout);
        window.speechSynthesis.cancel();

        selectedMode = null;
        currentStoryIndex = 0;
        currentQuestionIndex = 0;
        currentStory = null;
        storyScores = [];
        correctCount = 0;
        totalQuestions = 0;

        // Rebuild initial HTML layout
        contentBox.innerHTML = `
            <div class="ai-row">
                <div class="book-ai">
                    <img id="bookIdle" src="../asset/AI-bot.png" alt="AI Idle" style="display:block;">
                    <img id="bookTalking" src="../asset/AI-bot-rea.gif" alt="AI Talking" style="display:none;">
                </div>
                <div class="ai-info">
                    <div class="ai-name-label">R.E.A</div>
                    <div class="bubble rau-system" id="aiBubble">Select a mode to see the instructions.</div>
                </div>
            </div>
        `;

        modeButtons.forEach(btn => btn.disabled = false);
        resetChoiceButtons();
    }

    function startStory() {
        // guard: stories loaded
        if (!stories[selectedMode] || !stories[selectedMode][currentStoryIndex]) {
            addSystemMessage("No stories found for this mode.", false);
            return;
        }

        currentStory = stories[selectedMode][currentStoryIndex];
        currentQuestionIndex = 0;
        // clear content and show story text as system message (this will create AI row and speak)
        contentBox.innerHTML = "";
        addSystemMessage(`Story ${currentStoryIndex + 1}: ${currentStory.text}`, true);

        // after a delay, ask first question
        const storyTimers = {
            Easy: 10000,    // 10s
            Medium: 13000,  // 13s
            Hard: 15000     // 15s
        };

        storyTimeout = setTimeout(() => {
            askQuestion();
        }, storyTimers[selectedMode] || 15000); // shortened delay for UX; change back to 15000 if you want
    }

    function askQuestion() {
        if (!currentStory) return;
        if (currentQuestionIndex < currentStory.questions.length) {
            const q = currentStory.questions[currentQuestionIndex];
            addSystemMessage(q.q, true);

            // set answer buttons
            const answerBtns = document.querySelectorAll("#readUnderstand .answer-btn");
            q.choices.forEach((choice, i) => {
                if (answerBtns[i]) {
                    answerBtns[i].textContent = `${String.fromCharCode(65 + i)}. ${choice}`;
                    answerBtns[i].dataset.answer = choice;
                }
            });
        } else {
            addSystemMessage("Story finished!", true);

            // Track current story score
            const storyCorrect = correctCount - storyScores.reduce((s, x) => s + x.correct, 0);
            const storyTotal = currentStory.questions.length;
            storyScores.push({ story: currentStoryIndex + 1, correct: storyCorrect, total: storyTotal });

            currentStoryIndex++;

            if (currentStoryIndex < stories[selectedMode].length) {
                // Go to next story after short delay
                setTimeout(() => startStory(), 1500);
            } else {
                // All stories done
                addSystemMessage("All stories finished! Preparing your results...", true);

                setTimeout(() => {
                    contentBox.innerHTML = "";

                    removeAIRow();
                    showResults();

                    // Enable mode buttons again
                    modeButtons.forEach(btn => btn.disabled = false);
                    resetChoiceButtons();
                }, 2000);
            }
        }
    }

    function showResults() {
        let resultHTML = `<b>📊 Here are your results:</b><br><br>`;
        storyScores.forEach(s => {
            resultHTML += `Story ${s.story}: ${s.correct}/${s.total}<br>`;
        });

        const percent = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
        resultHTML += `<br><b>Total Score:</b> ${correctCount}/${totalQuestions} (${percent}%)<br><br>`;

        let feedback = "";
        if (percent === 100) feedback = "🌟 Excellent! You got everything correct. Great job!";
        else if (percent >= 80) feedback = "👍 Very good! You understood most of the stories.";
        else if (percent >= 50) feedback = "💪 Good effort! Keep practicing.";
        else feedback = "📖 Don’t give up! Try again and you'll improve.";

        resultHTML += feedback;

        // 🟢 Create new AI row like a new screen
        addSystemMessage(resultHTML, false);

        // 🟢 Add a restart message below results
        const restartNote = document.createElement("div");
        restartNote.classList.add("restart-note");
        restartNote.innerHTML = `<br><b>Click "Restart" to try again or choose a new mode.</b>`;
        contentBox.appendChild(restartNote);
        contentBox.scrollTop = contentBox.scrollHeight;
    }


    // Answer button handling
    document.querySelectorAll("#readUnderstand .answer-btn").forEach(button => {
        button.addEventListener("click", () => {
            if (!button.dataset.answer || !currentStory) return;

            const selectedText = button.dataset.answer;
            // create dynamic user message row (fresh)
            addUserMessage(selectedText);

            const q = currentStory.questions[currentQuestionIndex];
            if (selectedText === q.correct) {
                addSystemMessage("Correct!", true);
                correctCount++;
            } else {
                addSystemMessage(`Incorrect. Correct answer: ${q.correct}`, true);
            }

            totalQuestions++;
            currentQuestionIndex++;
            setTimeout(() => askQuestion(), 8000);
        });
    });

    // stop TTS on unload
    window.addEventListener("beforeunload", () => window.speechSynthesis.cancel());
});
