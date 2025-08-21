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
const stories = {
    Beginner: [
        {
            text: "Ben has a pet cat. The cat is white and small. Ben feeds the cat every morning.",
            questions: [
                { q: "What pet does Ben have?", a: ["cat"] },
                { q: "What color is the cat?", a: ["white"] },
                { q: "When does Ben feed it?", a: ["morning", "every morning"] }
            ]
        }
    ],
    Standard: [
        {
            text: "Rico loves playing basketball. After school, he practices shooting with his friends. He also watches games on TV to learn new moves.",
            questions: [
                { q: "What sport does Rico play?", a: ["basketball"] },
                { q: "Who does he practice with?", a: ["friends", "his friends"] },
                { q: "What does he watch?", a: ["games", "tv", "basketball games"] },
                { q: "What’s the main idea?", a: ["rico loves basketball", "playing basketball"] }
            ]
        }
    ]
};

// Mode instructions
const modeInstructions = {
    Beginner: "Beginner Mode: 10 short and simple stories. Focus on recall and facts.",
    Standard: "Standard Mode: 10 medium-length stories. Focus on sequence and main idea.",
    Difficult: "Difficult Mode: 10 longer passages. Focus on inference and deeper meaning."
};

// Mode selection
modeButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedMode = button.textContent.trim();
        currentStoryIndex = 0;
        currentQuestionIndex = 0;
        contentBox.innerHTML = "";
        addMessage(modeInstructions[selectedMode] + "Click START to begin.", "system");
    });
});

// START button
startBtn.addEventListener("click", () => {
    if (!selectedMode) {
        addMessage("⚠ Please select a mode first!", "system");
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
    selectedMode = null;
    currentStoryIndex = 0;
    currentQuestionIndex = 0;
    currentStory = null;
    contentBox.innerHTML = "";
    addMessage("📘 Select a mode to see the instructions.", "system");
    answerInput.value = "";
    // unlock mode buttons
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
    setTimeout(() => {
        askQuestion();
    }, 8000);
}

// Ask current question
function askQuestion() {
    if (currentQuestionIndex < currentStory.questions.length) {
        let qText = currentStory.questions[currentQuestionIndex].q;
        addMessage(`${qText}`, "system");
    } else {
        addMessage("All questions answered for this story!", "system");
    }
}

// Check answer
submitAnswerBtn.addEventListener("click", () => {
    const answer = answerInput.value.trim().toLowerCase();
    if (!answer) {
        addMessage("⚠ Please type an answer!", "system");
        return;
    }

    addMessage(answer, "user"); // show user bubble
    answerInput.value = "";

    // Check correctness
    let correctAnswers = currentStory.questions[currentQuestionIndex].a;
    if (correctAnswers.some(ans => answer.includes(ans))) {
        addMessage("Correct!", "system");
    } else {
        addMessage(`Incorrect. Correct answer: ${correctAnswers[0]}`, "system");
    }

    // Move to next question
    currentQuestionIndex++;
    setTimeout(() => askQuestion(), 1200);
});

// Stop TTS on reload
window.addEventListener("beforeunload", () => {
    window.speechSynthesis.cancel();
});
