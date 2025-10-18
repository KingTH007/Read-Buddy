document.getElementById("learn1").addEventListener("click", function () {
    // Change "lesson.html" to your actual lesson page
    window.location.href = "../../Front-end/html/learn-act.html?activity=readUnderstand";
});

document.getElementById("learn2").addEventListener("click", function () {
    // Change "lesson.html" to your actual lesson page
    window.location.href = "../../Front-end/html/learn-act.html?activity=sayItRight";
});
    
// Load all stories for logged-in student on page load
async function loadStudentStories() {
    const student = JSON.parse(localStorage.getItem("student")); 
    if (!student || !student.id) {
        console.warn("⚠️ No student found in localStorage");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/get-student-stories/${student.id}`);
        const data = await response.json();

        if (data.success) {
            const container = document.querySelector(".act-card");

            // ✅ Remove old story elements first
            container.querySelectorAll(".story").forEach(storyEl => storyEl.remove());

            // ✅ Append new stories
            data.stories.forEach(story => {
                const storyDiv = document.createElement("div");
                storyDiv.classList.add("story", "show");
                storyDiv.innerHTML = `
                    <div class="story-image">
                        <img src="${story.storyimage || "https://placehold.co/600x400"}" alt="Story Image" />
                    </div>
                    <p>${story.storyname}</p>
                    <button class="button" data-id="${story.story_id}">Read Now</button>
                `;
                container.appendChild(storyDiv);
            });

            // ✅ Redirect on button click
            container.addEventListener("click", (e) => {
                if (e.target.tagName === "BUTTON" && e.target.dataset.id) {
                    const storyId = e.target.dataset.id;
                    window.location.href = `../../Front-end/html/story-comp.html?story_id=${storyId}`;
                }
            });
        } else {
            console.error("❌ Failed to fetch student stories:", data.message);
        }
    } catch (err) {
        console.error("❌ Error loading student stories:", err);
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    const student = JSON.parse(localStorage.getItem("student"));
    if (student) {
        await loadStudentStories(); // auto-load stories for student
    } else {
        console.log("⚠️ No student found in localStorage.");
    }
});
