document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file');
    const overlay = document.querySelector('.overlay-color');
    const overlapModal = document.querySelector('.overlap');
    const cancelBtn = document.getElementById('overlap-cancel');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];

    if (file && file.type === "application/pdf") {
        overlay.style.display = "block";
        overlapModal.style.display = "block";

        // Prepare form data
        const formData = new FormData();
        formData.append("pdf", file);

        try {
            const response = await fetch("../Back-end/py/teach-ai.py", {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Failed to process PDF");

            const data = await response.json();

            // Fill in modal content
            document.getElementById("title").value = data.title;
            document.getElementById("context").value = data.story;
            document.querySelector(".over-img img").src = data.imageUrl;

        } catch (error) {
            alert("Error extracting story: " + error.message);
            overlay.style.display = "none";
            overlapModal.style.display = "none";
            fileInput.value = "";
        }
    } else {
        alert("Please upload a valid PDF file.");
        fileInput.value = '';
    }
});

    cancelBtn.addEventListener('click', () => {
        overlay.style.display = "none";
        overlapModal.style.display = "none";
        fileInput.value = ''; // Optional: reset file input when cancelled
    });
});