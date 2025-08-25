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

// TTS function
function speak(text) {
    window.speechSynthesis.cancel(); // stop any previous speech
    speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
    speechSynthesisUtterance.lang = "en-US"; 
    window.speechSynthesis.speak(speechSynthesisUtterance);
}

// Add chat bubble
function addMessage(text, type = "system") {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble", type);
    bubble.textContent = text;
    contentBox.appendChild(bubble);
    contentBox.scrollTop = contentBox.scrollHeight;
    if (type === "system") speak(text);
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
    Easy: "Easy Mode: 10 short and simple stories. Focus on recall and facts.",
    Medium: "Medium Mode: 10 medium-length stories. Focus on sequence and main idea.",
    Hard: "Hard Mode: 10 longer passages. Focus on inference and deeper meaning."
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
    answerInput.value = "";

    // unlock mode buttons for fresh start
    modeButtons.forEach(btn => btn.disabled = false);

    // stop TTS
    window.speechSynthesis.cancel();
}

// Begin story flow
function startStory() {
    currentStory = stories[selectedMode][currentStoryIndex];
    currentQuestionIndex = 0;
    contentBox.innerHTML = "";
    addMessage(`Story ${currentStoryIndex + 1}: ${currentStory.text}`, "system");

    // Show first question after short delay
    storyTimeout = setTimeout(() => {
        askQuestion();
    }, 12000);
}

// Ask current question
function askQuestion() {
    if (currentQuestionIndex < currentStory.questions.length) {
        let currentQ = currentStory.questions[currentQuestionIndex];
        addMessage(currentQ.q, "system");

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
            addMessage(`You finished ALL stories in ${selectedMode} mode!`, "system");

            // Unlock restart
            modeButtons.forEach(btn => btn.disabled = false);
        }
    }
}

// Check answer
document.querySelectorAll(".answer-btn").forEach(button => {
    button.addEventListener("click", () => {
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
