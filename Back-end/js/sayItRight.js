document.addEventListener("DOMContentLoaded", () => {
    const startVoice = document.getElementById("startVoice");
    const restartVoice = document.getElementById("restartVoice");
    const aiMessage = document.getElementById("aiMessage");
    const userMessage = document.getElementById("userMessage");
    const modeButtons = document.querySelectorAll("#sayItRight-mode button");
    const micButton = document.querySelector(".openVoice");
    const aiBubble = document.getElementById('aiBubble');
    const userBubble = document.getElementById('userBubble');

    let recognition;
    let words = {};
    let currentWordIndex = 0;
    let score = 0;
    let selectedMode = "";
    let modeSelected = false;
    let isStarted = false;
    let isListening = false;

    // Show mic button (add .show)
    function showMicButton() {
        micButton.classList.add("show");
    }

    // Hide mic button (remove .show)
    function hideMicButton() {
        micButton.classList.remove("show");
    }

    micButton.addEventListener("mousedown", () => {
        if (recognition && !isListening) {
            isListening = true;
            recognition.start();
            console.log("🎤 Mic opened...");
        }
    });

    micButton.addEventListener("touchstart", () => {
        if (recognition && !isListening) {
            isListening = true;
            recognition.start();
            console.log("🎤 Mic opened (mobile)...");
        }
    });

    // Stop recognition when released or unheld
    micButton.addEventListener("mouseup", () => {
        if (recognition && isListening) {
            recognition.stop();
            isListening = false;
            console.log("🛑 Mic closed...");
        }
    });

    micButton.addEventListener("mouseleave", () => {
        if (recognition && isListening) {
            recognition.stop();
            isListening = false;
        }
    });

    micButton.addEventListener("touchend", () => {
        if (recognition && isListening) {
            recognition.stop();
            isListening = false;
        }
    });

    // given you already have references:
    // bookChar = document.getElementById('bookChar')

    function speakWithAnimation(text) {
        // cancel previous then speak
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.85;

        u.onstart = () => {
            bookChar.classList.add('talking');   // mouth animates
        };
        u.onend = () => {
            bookChar.classList.remove('talking');
        };
        window.speechSynthesis.speak(u);
    }

    function setAIBubble(text, speakNow = false) {
        aiBubble.innerHTML = text;
        aiBubble.classList.add('pop-in');
        setTimeout(()=> aiBubble.classList.remove('pop-in'), 350);
        if (speakNow) speakWithAnimation(stripHTML(text));
    }

    function setUserBubble(text) {
        userBubble.innerHTML = text;
        userBubble.classList.add('pop-in');
        setTimeout(()=> userBubble.classList.remove('pop-in'), 350);
    }
        
    function stripHTML(html) { return html.replace(/<[^>]*>?/gm, ''); }

    // ✅ Speech Recognition Setup
    if ("webkitSpeechRecognition" in window) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const userSpeech = event.results[0][0].transcript.trim().toLowerCase();
            const targetWord = words[selectedMode][currentWordIndex].word.toLowerCase();

            setUserBubble(userSpeech);

            if (userSpeech === targetWord || userSpeech.includes(targetWord)) {
                score++;
                setAIBubble(`✅ Great job! You pronounced "${targetWord}" correctly!`);
                currentWordIndex++;

                if (currentWordIndex < words[selectedMode].length) {
                    setTimeout(showWord, 2000);
                } else {
                    setAIBubble(`🏁 Mode complete! You scored ${score}/${words[selectedMode].length}!`, true);
                }
            } else {
                setAIBubble(`❌ Wrong pronounce, try again.<br><b>${targetWord}</b>`);
                speakWithAnimation(targetWord);
            }
        };

        recognition.onerror = (e) => {
            setAIBubble("⚠️ Mic error. Please allow microphone access.");
        };
    }

    // ✅ Fetch JSON
    fetch("../../Back-end/json/sayItRightWords.json")
        .then(res => res.json())
        .then(data => {
            words = data;
            console.log("Loaded words:", words);
        })
        .catch(() => {
            setAIBubble("⚠️ Failed to load words. Check JSON file.");
        });

    // ✅ Mode Button Behavior
    modeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            selectedMode = btn.textContent.toLowerCase();
            currentWordIndex = 0;
            score = 0;
            modeSelected = true;
            isStarted = false;
            setAIBubble(`Mode: ${selectedMode.toUpperCase()} selected! Press "START" to begin.`, true);
        });
    });

    // ✅ Show Word Function
    function showWord() {
        const current = words[selectedMode][currentWordIndex];
        if (!current) return;

        const textHTML = `
            <b>${current.word}</b><br>
            <small><i>${current.pronunciation}</i></small><br>
            <button class="play-btn"><i class="fa fa-volume-up"></i></button>
        `;

        aiMessage.innerHTML = textHTML;

        // Play button
        aiMessage.querySelector(".play-btn").addEventListener("click", () => speakWithAnimation(current.word));

        speakWithAnimation(current.word);
        showMicButton();
    }

    // ✅ START Button Behavior
    startVoice.addEventListener("click", () => {
        if (!modeSelected) {
            setAIBubble("⚠️ Please select a mode first.");
            return;
        }

        if (!isStarted) {
            isStarted = true;
            showWord();
        } else {
            recognition.start();
        }
    });

    // ✅ RESTART Button
    restartVoice.addEventListener("click", () => {
        window.speechSynthesis.cancel();
        aiMessage.innerHTML = `🔁 Restarted. Select a mode again.`;
        userMessage.innerHTML = "";
        currentWordIndex = 0;
        score = 0;
        modeSelected = false;
        isStarted = false;
        hideMicButton();
    });

    // ✅ Stop TTS when leaving
    window.addEventListener("beforeunload", () => {
        window.speechSynthesis.cancel();
    });
});
