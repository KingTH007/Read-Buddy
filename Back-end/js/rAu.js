const contentBox = document.getElementById("contentBox");
const answerInput = document.getElementById("answerInput");
const submitAnswerBtn = document.getElementById("submitAnswer");
const startBtn = document.querySelector(".start-btn");
const restartBtn = document.querySelector(".restart-btn");
const modeButtons = document.querySelectorAll(".mode-btns button");

let selectedMode = null;
let currentStoryIndex = 0;
let currentQuestionIndex = 0;
let currentStory = null;
let speechSynthesisUtterance = null;
let stories = {};
let storyTimeout = null; // <-- ensure defined globally

// TTS function
function speak(text) {
    window.speechSynthesis.cancel(); // stop any previous speech
    speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
    speechSynthesisUtterance.lang = "en-US"; 
    window.speechSynthesis.speak(speechSynthesisUtterance);
}

// Add chat bubble
function addMessage(text, type = "system", isStoryOrQuestion = false) {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble", type);

    // message text
    const messageText = document.createElement("span");
    messageText.textContent = text;
    bubble.appendChild(messageText);

    // only add 🔊 for story or question bubbles
    if (type === "system" && isStoryOrQuestion) {
        const speakBtn = document.createElement("button");
        speakBtn.innerHTML = "🔊"; // speaker icon
        speakBtn.classList.add("speak-btn");

        speakBtn.addEventListener("click", () => {
            speak(text);
        });

        bubble.appendChild(speakBtn);
        speak(text); // speak automatically first time
    } else if (type === "system") {
        // still speak system messages without icon
        speak(text);
    }

    contentBox.appendChild(bubble);
    contentBox.scrollTop = contentBox.scrollHeight;
}

// Reset choice buttons back to plain A–D
function resetChoiceButtons() {
    const answerBtns = document.querySelectorAll(".answer-btn");
    answerBtns.forEach((btn, i) => {
        btn.textContent = String.fromCharCode(65 + i); // A, B, C, D
        btn.dataset.answer = ""; // clear stored choice
    });
}

// Stories with correct answers
fetch("../../Back-end/json/rau-stories.json")
  .then(res => res.json())
  .then(data => {
    stories = data;
    console.log("Stories loaded:", stories);
  })
  .catch(err => console.error("Error loading stories:", err));

// Mode instructions
const modeInstructions = {
    Easy: "Easy Mode: 3 short and simple stories. Focus on recall and facts.",
    Medium: "Medium Mode: 3 medium-length stories. Focus on sequence and main idea.",
    Hard: "Hard Mode: 3 longer passages. Focus on inference and deeper meaning."
};

// Mode selection
modeButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedMode = button.textContent.trim();
        currentStoryIndex = 0;
        currentQuestionIndex = 0;
        contentBox.innerHTML = "";
        addMessage(modeInstructions[selectedMode] + " Click START to begin.", "system");
    });
});

// START button
startBtn.addEventListener("click", () => {
    if (!selectedMode) {
        addMessage("Please select a mode first!", "system");
        return;
    }
    // lock mode buttons
    modeButtons.forEach(btn => btn.disabled = true);
    startStory();
});

// Restart button
restartBtn.addEventListener("click", () => {
    resetAll();
});

// Reset function
function resetAll() {
    if (storyTimeout) clearTimeout(storyTimeout);

    selectedMode = null;
    currentStoryIndex = 0;
    currentQuestionIndex = 0;
    currentStory = null;
    contentBox.innerHTML = "";
    addMessage("Select a mode to see the instructions.", "system");

    // unlock mode buttons for fresh start
    modeButtons.forEach(btn => btn.disabled = false);

    // reset choices
    resetChoiceButtons();

    // stop TTS
    window.speechSynthesis.cancel();
}

// Begin story flow
function startStory() {
    currentStory = stories[selectedMode][currentStoryIndex];
    currentQuestionIndex = 0;
    contentBox.innerHTML = "";
    addMessage(`Story ${currentStoryIndex + 1}: ${currentStory.text}`, "system", true);

    // Show first question after short delay
    storyTimeout = setTimeout(() => {
        askQuestion();
    }, 15000);
}

// Ask current question
function askQuestion() {
    if (currentQuestionIndex < currentStory.questions.length) {
        let currentQ = currentStory.questions[currentQuestionIndex];
        addMessage(currentQ.q, "system", true);

        // Update answer buttons
        const answerBtns = document.querySelectorAll(".answer-btn");
        currentQ.choices.forEach((choice, i) => {
            answerBtns[i].textContent = `${String.fromCharCode(65 + i)}. ${choice}`;
            answerBtns[i].dataset.answer = choice; // store actual text for checking
        });
    } else {
        // Finished all questions for this story
        addMessage("Story finished!", "system");

        // Move to next story
        currentStoryIndex++;
        if (currentStoryIndex < stories[selectedMode].length) {
            setTimeout(() => {
                startStory(); // load next story
            }, 2000);
        } else {
            // FINISHED ALL STORIES
            addMessage(`You finished ALL stories in ${selectedMode} mode!`, "system");

            // unlock modes & reset choices
            modeButtons.forEach(btn => btn.disabled = false);
            resetChoiceButtons();
        }
    }
}

// Check answer
document.querySelectorAll(".answer-btn").forEach(button => {
    button.addEventListener("click", () => {
        if (!button.dataset.answer) return; // ignore empty buttons

        const selectedAnswer = button.dataset.answer;
        addMessage(selectedAnswer, "user");

        let currentQ = currentStory.questions[currentQuestionIndex];
        if (selectedAnswer === currentQ.correct) {
            addMessage("Correct!", "system");
        } else {
            addMessage(`Incorrect. Correct answer: ${currentQ.correct}`, "system");
        }

        // Move to next question
        currentQuestionIndex++;
        setTimeout(() => askQuestion(), 3200);
    });
});

// Stop TTS on reload
window.addEventListener("beforeunload", () => {
    window.speechSynthesis.cancel();
});
