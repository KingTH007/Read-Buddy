document.getElementById("learn1").addEventListener("click", function () {
    // Change "lesson.html" to your actual lesson page
    window.location.href = "/learn-act.html?activity=readUnderstand";
});

document.getElementById("learn2").addEventListener("click", function () {
    // Change "lesson.html" to your actual lesson page
    window.location.href = "/learn-act.html?activity=sayItRight";
});

document.getElementById("learn3").addEventListener("click", function () {
    // Change "lesson.html" to your actual lesson page
    window.location.href = "/learn-act.html?activity=storyDetectives";
});

// Load all stories for logged-in student on page load
async function loadStudentStories() {
    const student = JSON.parse(localStorage.getItem("student")); 
    if (!student || !student.id) {
        console.warn("⚠️ No student found in localStorage");
        return;
    }

    try {
        const response = await fetch(`/api/get-student-stories/${student.id}`);
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
                    <button class="button" data-id="${story.story_id}" data-name="${story.storyname}">Read Now</button>
                `;
                container.appendChild(storyDiv);
            });

            // ✅ Handle notification before redirect
            container.addEventListener("click", (e) => {
                if (e.target.tagName === "BUTTON" && e.target.dataset.id) {
                    const storyId = e.target.dataset.id;
                    const storyName = e.target.dataset.name;

                    // Show notification popup
                    showStoryNotification(storyId, storyName);
                }
            });
        } else {
            console.error("❌ Failed to fetch student stories:", data.message);
        }
    } catch (err) {
        console.error("❌ Error loading student stories:", err);
    }
}

function showStoryNotification(storyId, storyName) {
    const overlay = document.querySelector(".notification-overlay");
    const background = document.querySelector(".notification-overlay-background");
    const notification = document.getElementById("select-story-notification");
    const storyTitle = notification.querySelector(".story-title");
    const yesBtn = notification.querySelector("#yes-modify");
    const noBtn = notification.querySelector("#no-modify");
    const closeBtn = notification.querySelector("#select-cancel-btn"); // 👈 new close button

    if (!overlay || !background || !notification) {
        console.error("❌ Notification elements missing in DOM.");
        return;
    }

    // ✅ Set the story title dynamically
    storyTitle.textContent = storyName;

    // ✅ Show the overlay (center modal)
    overlay.style.display = "flex";
    background.style.display = "block";
    document.body.style.overflow = "hidden"; // prevent background scrolling

    // ✅ Remove old listeners (to avoid stacking)
    const newYesBtn = yesBtn.cloneNode(true);
    const newNoBtn = noBtn.cloneNode(true);
    const newCloseBtn = closeBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    noBtn.parentNode.replaceChild(newNoBtn, noBtn);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

    // ✅ "Yes" → Go to learning activities
    newYesBtn.addEventListener("click", () => {
        hideOverlay();
        window.location.href = "/learn-act.html";
    });

    // ✅ "No" → Go to story page
    newNoBtn.addEventListener("click", () => {
        hideOverlay();
        window.location.href = `/story-comp.html?story_id=${storyId}`;
    });

    // ✅ "Close" → Just close overlay
    newCloseBtn.addEventListener("click", () => {
        hideOverlay();
    });

    // ✅ Clicking outside closes overlay
    overlay.addEventListener("click", function handleOutsideClick(e) {
        if (e.target === overlay) {
            hideOverlay();
            overlay.removeEventListener("click", handleOutsideClick);
        }
    });

    // ✅ Helper function to hide modal
    function hideOverlay() {
        overlay.style.display = "none";
        background.style.display = "none";
        document.body.style.overflow = "";
    }
}

// ============================
// Student Video: Convert YouTube Link → EMBED
// ============================
function convertToEmbed(url) {
    let id = "";

    if (url.includes("watch?v=")) {
        id = url.split("v=")[1].split("&")[0];
    }
    else if (url.includes("youtu.be/")) {
        id = url.split("youtu.be/")[1].split("?")[0];
    }
    else if (url.includes("/shorts/")) {
        id = url.split("/shorts/")[1].split("?")[0];
    }
    else {
        return null;
    }

    return `https://www.youtube.com/embed/${id}?autoplay=1`;
}

// ============================
// Load Student Videos (Same UI as Teacher)
// ============================
async function loadStudentVideos(code) {
    const container = document.querySelector(".res-video-list");
    if (!container) return;

    container.innerHTML = "<p>🎥 Loading videos...</p>";

    if (!code) {
        container.innerHTML = "<p style='color:red;'>No class code found.</p>";
        return;
    }

    try {
        const response = await fetch(`/api/get-student-videos?code=${code}`);
        const data = await response.json();

        if (!data.success) {
            container.innerHTML = `<p style='color:red;'>${data.message}</p>`;
            return;
        }

        const videos = data.videos;
        if (videos.length === 0) {
            container.innerHTML = "<p>No videos available yet.</p>";
            return;
        }

        const list = document.createElement("ul");
        list.className = "res-list-grid";

        videos.forEach(video => {
            const li = document.createElement("li");
            li.className = "res-item res-video-item"; // added class for easier targeting

            li.innerHTML = `
                <div class="res-card">
                    <i class="fa fa-video res-icon-file"></i>
                    <p class="res-name">${video.videoname}</p>
                </div>
            `;

            // FIX: click on LI, not on .res-card
            li.addEventListener("click", () => {
                openStudentVideoPlayer(video.videoname, video.videofile);
            });

            list.appendChild(li);
        });

        container.innerHTML = "";
        container.appendChild(list);

    } catch (err) {
        console.error("❌ Student load error:", err);
        container.innerHTML = "<p style='color:red;'>Failed to load videos.</p>";
    }
}

// ============================
// Open Student Video Player Overlay (MATCHES TEACHER VERSION)
// ============================
function openStudentVideoPlayer(title, url) {
    const overlay = document.getElementById("video-player-overlay");
    const titleBox = document.getElementById("player-video-title");
    const videoBox = document.getElementById("player-video-container");

    const embedUrl = convertToEmbed(url);
    if (!embedUrl) {
        alert("Invalid YouTube link.");
        return;
    }

    titleBox.textContent = title;

    videoBox.innerHTML = `
        <iframe
            width="100%"
            height="350"
            src="${embedUrl}&mute=1&playsinline=1"
            frameborder="0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowfullscreen>
        </iframe>
    `;

    overlay.style.display = "flex";
}

// ============================
// Close Button (Student)
// ============================
document.querySelector(".close-btn").addEventListener("click", () => {
    const overlay = document.getElementById("video-player-overlay");
    const videoBox = document.getElementById("player-video-container");

    overlay.style.display = "none";
    videoBox.innerHTML = ""; // remove iframe to stop video
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
