const activities = {
    beginner: [
        { q: "The cat runs. (Identify the verb)", a: "runs" },
        { q: "I eat. (Identify the verb)", a: "eat" },
        { q: "Fill in: He ___ (jump/jumps) high.", a: "jumps" }
    ],
    standard: [
        { q: "My father drives the car to work every morning. (Identify the verb)", a: "drives" },
        { q: "Fill in: She ___ (write/writes) letters every week.", a: "writes" }
    ],
    difficult: [
        { q: "The students study hard and prepare for the test. (Identify all verbs)", a: "study,prepare" },
        { q: "Fill in: The teacher ___ (teach/teaches) science and ___ (check/checks) our work carefully.", a: "teaches,checks" }
    ]
};

let currentMode = "";
let currentIndex = 0;

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
}

function startGame(mode) {
    currentMode = mode;
    currentIndex = 0;
    loadQuestion();
}

function loadQuestion() {
    if (currentIndex < activities[currentMode].length) {
        const question = activities[currentMode][currentIndex].q;
        document.getElementById("activity-box").textContent = question;
        document.getElementById("feedback").textContent = "";
        speak(question);
    } else {
        document.getElementById("activity-box").textContent = "Great work! You've finished all questions.";
        speak("Great work! You've finished all questions.");
    }
}

function checkAnswer() {
    const userAns = document.getElementById("answer").value.trim().toLowerCase();
    const correctAns = activities[currentMode][currentIndex].a.toLowerCase();
    if (userAns === correctAns) {
        document.getElementById("feedback").textContent = "✅ Correct!";
        speak("Correct!");
    } else {
        document.getElementById("feedback").textContent = `❌ Try again. Correct answer: ${correctAns}`;
        speak(`The correct answer is ${correctAns}`);
    }
    currentIndex++;
    document.getElementById("answer").value = "";
    setTimeout(loadQuestion, 1500);
}