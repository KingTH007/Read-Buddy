document.getElementById("learn1").addEventListener("click", function () {
    // Change "lesson.html" to your actual lesson page
    window.location.href = "../../Front-end/html/learn-act.html?activity=readUnderstand";
});

document.getElementById("learn2").addEventListener("click", function () {
    // Change "lesson.html" to your actual lesson page
    window.location.href = "../../Front-end/html/learn-act.html?activity=sayItRight";
});

document.getElementById("learn2").addEventListener("click", function () {
    // Change "lesson.html" to your actual lesson page
    window.location.href = "../../Front-end/html/learn-act.html?activity=sayItRight";
});

document.getElementById("learn3").addEventListener("click", function () {
    // Change "lesson.html" to your actual lesson page
    window.location.href = "../../Front-end/html/learn-act.html?activity=storyDetectives";
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

// ============================
// Load Student Videos by Class Code
// ============================
async function loadStudentVideos(code) {
    const container = document.querySelector(".res-video-list");
    const videoList = document.getElementById("res-video-list-ul");

    if (!container || !videoList) {
        console.error("❌ Missing video container elements in HTML.");
        return;
    }

    videoList.innerHTML = "<p>🎥 Loading available videos...</p>";

    if (!code) {
        videoList.innerHTML = "<p style='color:red;'>No class code found.</p>";
        console.error("❌ Missing class code for student.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/get-student-videos?code=${code}`);
        const data = await response.json();

        if (!data.success) {
            videoList.innerHTML = `<p style='color:red;'>${data.message || "Failed to load videos."}</p>`;
            return;
        }

        const videos = data.videos || [];
        if (videos.length === 0) {
            videoList.innerHTML = "<p>No videos available yet.</p>";
            return;
        }

        // ✅ Clear existing content
        videoList.innerHTML = "";

        // ✅ Add each video
        videos.forEach(video => {
            const li = document.createElement("li");
            li.className = "res-item";

            const videoName = video.videoname || "Untitled Video";
            const videoFile = video.videofile || "";

            li.innerHTML = `
                <div class="res-card" title="${videoName}">
                    <i class="fa fa-video res-icon-file"></i>
                    <p class="res-name">${videoName}</p>
                </div>
            `;

            // 🎥 Click to open player overlay
            li.querySelector(".res-card").addEventListener("click", (e) => {
                e.preventDefault();
                openVideoPlayer(videoFile, videoName);
            });

            videoList.appendChild(li);
        });

    } catch (err) {
        console.error("❌ Error loading student videos:", err);
        videoList.innerHTML = "<p style='color:red;'>Failed to load videos.</p>";
    }
}

// ============================
// Video Player Overlay
// ============================
function openVideoPlayer(file, name) {
    const overlay = document.getElementById("video-player-overlay");
    const player = document.getElementById("player-video");
    const title = document.getElementById("player-video-title");
    const bg = document.querySelector(".video-player-background");

    if (!overlay || !player) return;

    player.src = file;
    if (title) title.textContent = name;

    overlay.style.display = "flex";
    bg.style.display = "block";
    player.play();
}

document.querySelector(".close-btn").addEventListener("click", () => {
    const overlay = document.getElementById("video-player-overlay");
    const bg = document.querySelector(".video-player-background");
    const player = document.getElementById("player-video");

    overlay.style.display = "none";
    bg.style.display = "none";
    player.pause();
});


window.addEventListener("DOMContentLoaded", async () => {
    const student = JSON.parse(localStorage.getItem("student"));
    if (student && student.code) {
        await loadStudentStories();
        await loadStudentVideos(student.code); // ✅ Pass the class code
    } else {
        console.warn("⚠️ No student or class code found in localStorage.");
    }
});
