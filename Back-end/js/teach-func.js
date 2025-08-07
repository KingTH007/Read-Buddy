document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file');
    const overlay = document.querySelector('.overlay-color');
    const overlapModal = document.querySelector('.overlap');
    const cancelBtn = document.getElementById('overlap-cancel');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];

        // Only proceed if a file is selected and is a PDF
        if (file && file.type === "application/pdf") {
            overlay.style.display = "block";
            overlapModal.style.display = "block";
        } else {
            alert("Please upload a valid PDF file.");
            fileInput.value = ''; // Reset file input
        }
    });

    cancelBtn.addEventListener('click', () => {
        overlay.style.display = "none";
        overlapModal.style.display = "none";
        fileInput.value = ''; // Optional: reset file input when cancelled
    });
});