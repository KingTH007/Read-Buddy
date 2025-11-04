    document.addEventListener("DOMContentLoaded", () => {
        const contentBox = document.getElementById("rAuBox");
        const startBtn = document.querySelector("#readUnderstand .start-btn");
        const restartBtn = document.querySelector("#readUnderstand .restart-btn");
        const modeButtons = document.querySelectorAll("#readUnderstand-mode button");
        const modeContainer = document.getElementById("readUnderstand-mode");
        const answerContainer = document.getElementById("rAuAnswers");

        let selectedMode = null;
        let currentStoryIndex = 0;
        let currentQuestionIndex = 0;
        let currentStory = null;
        let storyTimeout = null;
        let storyScores = [];
        let correctCount = 0;
        let totalQuestions = 0;
        let stories = {};
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

        const boxes = document.querySelectorAll(".content-box");
        document.body.style.overflow = "hidden"; // 🧱 Prevent body/page scroll
        document.documentElement.style.overflow = "hidden";

        boxes.forEach(box => {
            const videoWrapper = box.querySelector(".video-wrapper");
            if (videoWrapper) {
                // existing video-wrapper fixed positioning
                videoWrapper.style.position = "fixed";
                videoWrapper.style.top = box.getBoundingClientRect().top + "px";
                videoWrapper.style.left = box.getBoundingClientRect().left + "px";
                videoWrapper.style.width = box.offsetWidth + "px";
                videoWrapper.style.height = box.offsetHeight + "px";
                videoWrapper.style.zIndex = "0";
                videoWrapper.style.pointerEvents = "none";

                // ✅ NEW: Prevent overscroll / bounce especially on mobile
                box.addEventListener("scroll", () => {
                    if (box.scrollTop < 0) box.scrollTop = 0;
                    const maxScroll = box.scrollHeight - box.clientHeight;
                    if (box.scrollTop > maxScroll) box.scrollTop = maxScroll;

                    // keep video-wrapper aligned even when scrolling
                    videoWrapper.style.top = box.getBoundingClientRect().top + "px";
                });

                // ✅ NEW: Prevent the body from scrolling when user reaches top/bottom of box
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

                    // 🚫 Prevent scroll bleed beyond top/bottom
                    if ((atTop && isScrollingUp) || (atBottom && isScrollingDown)) {
                        e.preventDefault();
                    }

                    box.lastTouchY = currentY;
                }, { passive: false });

                // Adjust on resize to match box dimensions
                window.addEventListener("resize", () => {
                    videoWrapper.style.width = box.offsetWidth + "px";
                    videoWrapper.style.height = box.offsetHeight + "px";
                    videoWrapper.style.top = box.getBoundingClientRect().top + "px";
                    videoWrapper.style.left = box.getBoundingClientRect().left + "px";
                });
            }
        });

        function ensureVideoBackground() {
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

        function createAndInsertAIRow(text = "Press Start to begin.", isStoryOrQuestion = false, positionTop = false) {
            // Main row container
            aiRowElement = document.createElement("div");
            aiRowElement.classList.add("ai-row");

            aiRowElement.style.position = "relative";
            aiRowElement.style.zIndex = "2";
            
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
            nameLabel.textContent = "Rea";

            // Bubble inside ai-info (with button inside it)
            const bubble = document.createElement("div");
            bubble.classList.add("bubble", "system");

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

            utter.onstart = () => showTalking();
            utter.onend = () => setTimeout(() => showIdle());

            window.speechSynthesis.speak(utter);
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
            const isIncorrect = /^Incorrect/i.test(stripHTML(text));
            const isCorrect = /^Correct/i.test(stripHTML(text));

            // Recreate AI row fresh whenever a new system message is shown
            const bubble = createAndInsertAIRow(text, isStoryOrQuestion, false);

            // If the text starts with "Incorrect", remove the speaker button
            if (isIncorrect || isCorrect) {
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
        fetch("/json/rau-stories.json")
            .then(res => res.json())
            .then(data => {
                stories = data;

                // Normalize selectedMode to lowercase to avoid mismatch (e.g., "Easy" vs "easy")
                const modeKey = selectedMode?.toLowerCase();

                // Check if the mode exists in the JSON
                if (!stories || !stories[modeKey]) {
                    console.error(`⚠️ No stories found for mode: ${modeKey}`);
                    return; // Stop here to avoid undefined errors
                }

                // ✅ Apply mode-based story limits
                if (modeKey === "easy") {
                    stories[modeKey] = stories[modeKey].slice(0, 2);
                } else if (modeKey === "medium") {
                    stories[modeKey] = stories[modeKey].slice(0, 4);
                } else if (modeKey === "hard") {
                    stories[modeKey] = stories[modeKey].slice(0, 6);
                }

                // ✅ Limit each story to 5 questions
                stories[modeKey].forEach(story => {
                    if (story.questions && Array.isArray(story.questions)) {
                        story.questions = story.questions.slice(0, 5);
                    }
                });

                console.log(`✅ Loaded ${stories[modeKey].length} stories for mode: ${modeKey}`);
            })
            .catch(err => console.error("❌ Error loading stories:", err));


        const modeInstructions = {
            Easy: "Easy Mode: 2 short and simple stories, each with 5 questions. Focus on recall and facts. Choose the answer wisely.",
            Medium: "Medium Mode: 4 medium-length stories. Focus on sequence and main idea. Choose the answer wisely.",
            Hard: "Hard Mode: 6 longer passages. Focus on inference and deeper meaning. Choose the answer wisely."
        };

        // MODE clicks: recreate AI row and display instruction
        modeButtons.forEach(button => {
            button.addEventListener("click", () => {
                selectedMode = button.textContent.trim();
                currentStoryIndex = 0;
                currentQuestionIndex = 0;
                contentBox.innerHTML = ""; // clear existing rows
                ensureVideoBackground(); 
                addSystemMessage(modeInstructions[selectedMode] + " Click START to begin.", true);
            });
        });

        // START behavior: recreate AI row and start the story flow
        startBtn.addEventListener("click", () => {
            if (!selectedMode) {
                speakTTS("Please select a mode first!", false);
                return;
            }

            // Disable Start button after click to prevent multiple presses
            startBtn.disabled = true;
            startBtn.classList.add("disabled-btn");

            modeContainer.style.display = "none";
            answerContainer.style.display = "flex";

            // Disable mode buttons while running
            modeButtons.forEach(btn => btn.disabled = true);

            startStory();
        });

        // Restart confirmation logic
        const restartNotification = document.getElementById("restart-notification");
        const yesRestart = document.getElementById("yes-restart");
        const noRestart = document.getElementById("no-restart");
        const notifBackground = document.querySelector(".notification-overlay-background");

        restartBtn.addEventListener("click", () => {
            restartNotification.style.display = "flex";
            notifBackground.classList.add("show"); // Show popup
        });

        // YES → restart activity
        yesRestart.addEventListener("click", () => {
            restartNotification.style.display = "none";
            notifBackground.classList.remove("show");
            resetAll(); // existing restart function
        });

        // NO → stay on current progress
        noRestart.addEventListener("click", () => {
            restartNotification.style.display = "none";
            notifBackground.classList.remove("show");
        });


        function resetAll() {
            window.location.href = "/learn-act.html?activity=readUnderstand";
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
            ensureVideoBackground();
            addSystemMessage(`Story ${currentStoryIndex + 1}: ${currentStory.text}`, true);

            // after a delay, ask first question
            const storyTimers = {
                Easy: 12000,    // 10s
                Medium: 14000,  // 13s
                Hard: 16000     // 15s
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

                setAnswerButtonsEnabled(true);
            } else {
                // Track current story score
                const storyCorrect = correctCount - storyScores.reduce((s, x) => s + x.correct, 0);
                const storyTotal = currentStory.questions.length;
                storyScores.push({ story: currentStoryIndex + 1, correct: storyCorrect, total: storyTotal });

                currentStoryIndex++;

                if (currentStoryIndex < stories[selectedMode].length) {
                    // Go to next story after short delay
                    setTimeout(() => startStory(), 6000);
                } else {
                    // All stories done
                    addSystemMessage("All stories finished! Preparing your results...", true);

                    setTimeout(() => {
                        contentBox.innerHTML = "";
                        ensureVideoBackground();
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

            ensureVideoBackground();

            // 🟢 Create new AI row like a new screen
            addSystemMessage(resultHTML, false);
            saveLearningResult("Read and Understand", selectedMode, percent);
        }

        // Answer button handling
        document.querySelectorAll("#readUnderstand .answer-btn").forEach(button => {
            button.addEventListener("click", () => {
                if (!button.dataset.answer || !currentStory) return;

                const selectedText = button.dataset.answer;

                // 🗣️ Show user's selected answer as chat bubble
                addUserMessage(selectedText);

                const q = currentStory.questions[currentQuestionIndex];

                setAnswerButtonsEnabled(false);

                if (selectedText === q.correct) {
                    addSystemMessage(`Correct! The answer is "${q.correct}"`, true);
                    correctCount++;
                    delayTime = 4000;
                } else {
                    addSystemMessage(`Incorrect. Correct answer is "${q.correct}"`, true);
                    delayTime = 8000;
                }

                totalQuestions++;
                currentQuestionIndex++;

                // ⏳ Wait according to feedback type before showing next question
                setTimeout(() => askQuestion(), delayTime);
            });
        });

        // 🔹 Helper function for enabling/disabling answer buttons
        function setAnswerButtonsEnabled(enabled) {
            const answerBtns = document.querySelectorAll("#readUnderstand .answer-btn");
            answerBtns.forEach(btn => {
                btn.disabled = !enabled;
                btn.style.pointerEvents = enabled ? "auto" : "none";
                btn.style.opacity = enabled ? "1" : "0.6";
            });
        }


        // stop TTS on unload
        window.addEventListener("beforeunload", () => window.speechSynthesis.cancel());
    });
