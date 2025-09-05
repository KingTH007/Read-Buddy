document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file');
    const overlay = document.querySelector('.overlay-color');
    const overlapModal = document.querySelector('.overlap');
    const cancelBtn = document.getElementById('overlap-cancel');
    const uploadBtn = document.getElementById('overlap-upload');

    let imageUrl = "";

    // Function to generate questions using OpenAI
    async function generateQuestionsFromContext(context) {
        try {
            const response = await fetch("http://localhost:5000/api/generate-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context }),
            });

            const data = await response.json();
            return data.questions;
        } catch (error) {
            console.error("Error fetching questions:", error);
            return "Failed to generate questions. Please try again.";
        }
    }



    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];

        if (file && file.type === "application/pdf") {
            overlay.style.display = "block";
            overlapModal.style.display = "block";

            const fileReader = new FileReader();
            fileReader.onload = async function () {
                const typedarray = new Uint8Array(this.result);

                // Load PDF
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = "";

                // Extract text from all pages
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(" ");
                    fullText += pageText + "\n";
                }

                // Generate title (first sentence or first 8 words)
                let titleGuess = fullText.split(/[.!?]/)[0];
                titleGuess = titleGuess.split(" ").slice(0, 8).join(" ");

                // Generate placeholder image based on first keyword
                const keyword = titleGuess.split(" ")[0] || "story";
                imageUrl = `https://source.unsplash.com/512x512/?${encodeURIComponent(keyword)}`;

                // Fill the modal with defaults
                document.getElementById("title").value = titleGuess;
                document.getElementById("context").value = fullText.trim();
                // document.querySelector(".over-img img").src = imageUrl;

                const questions = await generateQuestionsFromContext(fullText.trim());
                document.getElementById("questions").value = questions;
            };

            fileReader.readAsArrayBuffer(file);
        } else {
            alert("Please upload a valid PDF file.");
            fileInput.value = '';
        }
    });

    // Upload button handler (reads updated values)
    uploadBtn.addEventListener('click', () => {
        const editedTitle = document.getElementById("title").value;
        const editedContext = document.getElementById("context").value;

        // Create new story card
        const newStory = document.createElement("div");
        newStory.classList.add("story", "show");

        newStory.innerHTML = `
            <div class="story-image">
                <img src="${imageUrl}" alt="Story Image" />
            </div>
            <p>${editedTitle}</p>
            <button class="button">Read Now</button>
        `;

        // Append to the activity card container
        document.querySelector(".act-card").appendChild(newStory);

        // Optionally log the full context in console
        console.log("Uploaded Story:", { title: editedTitle, context: editedContext });

        // Hide modal
        overlay.style.display = "none";
        overlapModal.style.display = "none";
    });


    cancelBtn.addEventListener('click', () => {
        overlay.style.display = "none";
        overlapModal.style.display = "none";
        fileInput.value = ''; // reset file input
    });
});


// note: run in terminal "node Back-end/js/upload-ai.js" to start the server