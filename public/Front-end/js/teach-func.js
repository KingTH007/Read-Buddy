document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('file');
    const overlay = document.querySelector('.overlay-color');
    const overlapModal = document.querySelector('.overlap');
    const cancelBtn = document.getElementById('cancel-story-btn');
    const uploadBtn = document.getElementById('overlap-upload');

    if (!fileInput || !overlay || !overlapModal) {
        console.warn("⚠️ Missing essential elements for upload functionality (file input, overlay, or modal).");
        return;
    }

    //===============
    // STORY SECTION
    //===============

    let imageUrl = "";
    uploadBtn.disabled = true;
    uploadBtn.classList.add('locked');

    // === 🔹 Function to Validate Required Fields ===
    function checkRequiredFields() {
        const title = document.getElementById("title").value.trim();
        const context = document.getElementById("context").value.trim();
        const q1 = document.getElementById("question1").value.trim();
        const q2 = document.getElementById("question2").value.trim();
        const q3 = document.getElementById("question3").value.trim();

        const allFilled = title && context && q1 && q2 && q3;

        if (allFilled) {
            uploadBtn.disabled = false;
            uploadBtn.classList.remove('locked');
        } else {
            uploadBtn.disabled = true;
            uploadBtn.classList.add('locked');
        }
    }

    // === 🔹 Add Input Event Listeners to Revalidate ===
    ["title", "context", "question1", "question2", "question3"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", checkRequiredFields);
    });

    // === 🔹 Shake Animation on Click when Locked ===
    uploadBtn.addEventListener("click", e => {
        if (uploadBtn.disabled) {
            uploadBtn.classList.add("shake");
            setTimeout(() => uploadBtn.classList.remove("shake"), 400);
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    });

    // Function to generate questions for each difficulty separately
    async function generateAllModesQuestions(contextParam) {
        try {
            // prefer explicit contextParam if caller sends one, otherwise read from textarea
            const contextText = (contextParam && contextParam.trim()) || (document.getElementById("context")?.value || "").trim();

            if (!contextText) {
                console.error("No story/context provided.");
                showNotification("error", "Please provide the story text before generating questions.");
                return;
            }

            // abort previous requests if any
            if (window.currentAbortController) {
                try { window.currentAbortController.abort(); } catch(e) {}
            }
            window.currentAbortController = new AbortController();

            const response = await fetch("/api/generate-questions-all-modes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context: contextText }),
                signal: window.currentAbortController.signal,
            });

            // handle non-200 status
            if (!response.ok) {
                const text = await response.text();
                console.error("❌ Server returned non-OK:", response.status, text);
                showNotification("error", "Server error while generating questions. Check console for details.");
                return;
            }

            const data = await response.json();

            // data should be an object with keys Easy/Medium/Hard arrays - but handle gracefully if not
            const easyArr = Array.isArray(data.Easy) ? data.Easy : (Array.isArray(data.easy) ? data .easy : []);
            const medArr  = Array.isArray(data.Medium) ? data.Medium : (Array.isArray(data.medium) ? data.medium : []);
            const hardArr = Array.isArray(data.Hard) ? data.Hard : (Array.isArray(data.hard) ? data.hard : []);

            const easyQs = easyArr.length ? easyArr.join("\n\n") : "No easy questions generated.";
            const medQs  = medArr.length ? medArr.join("\n\n") : "No medium questions generated.";
            const hardQs = hardArr.length ? hardArr.join("\n\n") : "No hard questions generated.";

            if (document.getElementById("question1")) document.getElementById("question1").value = easyQs;
            if (document.getElementById("question2")) document.getElementById("question2").value = medQs;
            if (document.getElementById("question3")) document.getElementById("question3").value = hardQs;

            showNotification("success", "Questions generated (check textareas).");
            checkRequiredFields();
        } catch (error) {
            if (error.name === "AbortError") {
            console.warn("Request aborted by user");
            showNotification("info", "Generation aborted.");
            return;
            }
            console.error("Error fetching questions:", error);
            showNotification("error", "Failed to generate questions. See console for details.");
        }
    }

    // main.js — generateImageFromKeyword (frontend)
    async function generateImageFromKeyword(keyword) {
        const loadingDiv = document.getElementById("loading-img");
        const overImgDiv = document.getElementById("over-img");
        
        // Show loading animation
        loadingDiv.style.display = "flex";
        overImgDiv.style.display = "none";

        try {
            window.currentAbortController = new AbortController();

            const response = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `Generate a detailed, realistic illustration that accurately represents the main scene or concept of the story: ${keyword}. 
                    The image must visually match the description and mood of the story, without including any text, captions, or watermarks. 
                    Focus on clarity, composition, and visual storytelling to ensure the image aligns perfectly with the story’s theme.`,
                    size: "512x512",
                }),
                signal: window.currentAbortController.signal,
            });

            let imageUrl;

            if (!response.ok) {
                const errText = await response.text();
                console.error("Image API returned error:", response.status, errText);
                imageUrl = `https://source.unsplash.com/512x512/?${encodeURIComponent(keyword)}`;
            } else {
                const data = await response.json();

                if (data.url && typeof data.url === "string") {
                    imageUrl = data.url;
                } else if (data.raw && typeof data.raw === "string" && data.raw.startsWith("data:image/")) {
                    imageUrl = data.raw;
                } else {
                    console.warn("⚠️ No usable image URL, fallback to Unsplash");
                    imageUrl = `https://source.unsplash.com/512x512/?${encodeURIComponent(keyword)}`;
                }
            }

            // ✅ Hide loading and show image
            loadingDiv.style.display = "none";
            overImgDiv.style.display = "flex";

            return imageUrl;

        } catch (err) {
            console.error("Error calling generate-image:", err);

            // ✅ Hide loading even if there’s an error
            loadingDiv.style.display = "none";
            overImgDiv.style.display = "flex";

            return `https://source.unsplash.com/512x512/?${encodeURIComponent(keyword)}`;
        }
    }

    // ====== 🔹 Handle File Upload (PDF) ======
    async function handleFileUpload(file) {
        if (!file || file.type !== "application/pdf") {
            showNotification('error', "Please upload a valid PDF file.");
            return;
        }

        overlay.style.display = "block";
        overlapModal.style.display = "block";

        const reader = new FileReader();
        reader.onload = async function () {
            const typedarray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => item.str).join(" ") + "\n";
            }

            const titleGuess = fullText.split(/[.!?]/)[0].split(" ").slice(0, 8).join(" ");
            const keyword = fullText.split(" ")[0] || "story";
            imageUrl = await generateImageFromKeyword(keyword);

            document.getElementById("title").value = titleGuess;
            document.getElementById("context").value = fullText.trim();
            document.querySelector(".over-img img").src = imageUrl;

            await generateAllModesQuestions(fullText.trim());
            checkRequiredFields();
        };
        reader.readAsArrayBuffer(file);
    }

    // ====== 🔹 File Input Change ======
    fileInput.addEventListener('change', e => handleFileUpload(e.target.files[0]));
    const uploadButton = document.querySelector('.upload-btn');
    if (uploadButton) {
        uploadButton.addEventListener('dragover', e => { e.preventDefault(); uploadButton.classList.add('dragover'); });
        uploadButton.addEventListener('dragleave', () => uploadButton.classList.remove('dragover'));
        uploadButton.addEventListener('drop', e => {
            e.preventDefault();
            uploadButton.classList.remove('dragover');
            handleFileUpload(e.dataTransfer.files[0]);
        });
    }

    // ====== 🔹 Upload Confirmation ======
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async () => {
            if (uploadBtn.disabled) return;

            const editedTitle = document.getElementById("title").value.trim();
            const editedContext = document.getElementById("context").value.trim();
            const questionEasy = document.getElementById("question1").value.trim();
            const questionMedium = document.getElementById("question2").value.trim();
            const questionHard = document.getElementById("question3").value.trim();
            const teacher = JSON.parse(localStorage.getItem("teacher"));
            if (!teacher?.id) return showNotification('error', "Please log in again.");

            try {
                const res = await fetch("/api/save-story", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        teach_id: teacher.id,
                        storyname: editedTitle,
                        storycontent: editedContext,
                        storyquest_easy: questionEasy,
                        storyquest_med: questionMedium,
                        storyquest_hard: questionHard,
                        storyimage: imageUrl
                    })
                });
                const data = await res.json();
                if (data.success) {
                    showNotification('success', "Story uploaded successfully!");
                    overlay.style.display = "none";
                    overlapModal.style.display = "none";
                    fileInput.value = "";
                    await loadStories();
                } else {
                    showNotification('error', data.message || "Upload failed.");
                }
            } catch (err) {
                console.error(err);
                showNotification('error', "Failed to upload story.");
            }
        });
    }
    
    // ====== 🔹 Cancel Upload ======
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            showNotification('close-story', '', () => {
                // 🧩 Get reference to active AbortController (for API)
                const activeController = window.currentAbortController;

                // Stop any ongoing API request
                if (activeController) {
                    activeController.abort();
                    console.log("⛔ API generation aborted.");
                    window.currentAbortController = null;
                }

                // Hide overlay/modal
                if (overlay) overlay.style.display = "none";
                if (overlapModal) overlapModal.style.display = "none";

                // Clear file input
                if (fileInput) fileInput.value = "";

                // Clear all textareas
                document.querySelectorAll('textarea').forEach(t => t.value = '');

                // Clear any image preview
                const img = document.querySelector('.over-img img');
                if (img) img.src = '';

                // Clear story title
                const storyTitle = document.querySelector('.story-title');
                if (storyTitle) storyTitle.textContent = '';

                // ✅ Notify user
                showNotification('create', 'Story upload cancelled. All progress cleared.');
            });
        });
    }


    async function loadStories() {
        const teacher = JSON.parse(localStorage.getItem("teacher"));
        if (!teacher?.id) return;

        try {
            const res = await fetch(`/api/get-stories/${teacher.id}`);
            const data = await res.json();
            if (!data.success) return;

            const container = document.querySelector(".act-card");
            container.querySelectorAll(".story").forEach(el => el.remove());

            data.stories.forEach(story => {
                const div = document.createElement("div");
                div.className = "story show";
                div.dataset.storyId = story.story_id;
                div.innerHTML = `
                    <div class="story-image"><img src="${story.storyimage}" alt="Story Image"/></div>
                    <p>${story.storyname}</p>
                    <button class="modify">Modify Now</button>
                `;
                container.appendChild(div);
            });
        } catch (err) {
            console.error("Failed to load stories:", err);
        }
    }

    // 🔹 Auto-load stories on page load
    if (JSON.parse(localStorage.getItem("teacher"))) loadStories();

    // ==============================
    // 🔹 Handle Modify Story Button
    // ==============================
    async function openModifyStory(storyId) {
        const modifyOverlay = document.getElementById("modify-overlap");
        const overlay = document.querySelector(".overlay-color");

        try {
            const response = await fetch(`/api/get-story/${storyId}`);
            const data = await response.json();
            if (!data.success) return showNotification('error', "Failed to load story.");

            const story = data.story || {};

            // Fill input fields
            document.getElementById("modify-title").value = story.storyname || "";
            document.getElementById("modify-context").value = story.storycontent || "";
            document.getElementById("modify-question1").value = story.storyquest_easy || "";
            document.getElementById("modify-question2").value = story.storyquest_med || "";
            document.getElementById("modify-question3").value = story.storyquest_hard || "";
            document.getElementById("modify-img").src = story.storyimage || "https://placehold.co/250x180";

            // Show overlay
            overlay.style.display = "block";
            modifyOverlay.style.display = "block";

            // Store snapshot for change detection
            modifyOverlay.dataset.editingStoryId = story.story_id;
            modifyOverlay.dataset.originalStory = JSON.stringify({
                storyname: story.storyname || "",
                storycontent: story.storycontent || "",
                storyquest_easy: story.storyquest_easy || "",
                storyquest_med: story.storyquest_med || "",
                storyquest_hard: story.storyquest_hard || "",
                storyimage: story.storyimage || ""
            });

            // Lock save button initially
            const saveBtn = document.getElementById("modify-save");
            saveBtn.disabled = true;

            // Enable Save when user edits any field
            ["modify-title", "modify-context", "modify-question1", "modify-question2", "modify-question3"].forEach(id => {
                document.getElementById(id).addEventListener("input", () => {
                    const original = JSON.parse(modifyOverlay.dataset.originalStory);
                    const current = {
                        storyname: document.getElementById("modify-title").value.trim(),
                        storycontent: document.getElementById("modify-context").value.trim(),
                        storyquest_easy: document.getElementById("modify-question1").value.trim(),
                        storyquest_med: document.getElementById("modify-question2").value.trim(),
                        storyquest_hard: document.getElementById("modify-question3").value.trim(),
                    };

                    const hasChanges =
                        current.storyname !== original.storyname ||
                        current.storycontent !== original.storycontent ||
                        current.storyquest_easy !== original.storyquest_easy ||
                        current.storyquest_med !== original.storyquest_med ||
                        current.storyquest_hard !== original.storyquest_hard;

                    saveBtn.disabled = !hasChanges;
                });
            });

        } catch (err) {
            console.error("Error fetching story details:", err);
            showNotification('error', "Error: " + err.message);
        }
    }

    // ==============================
    // 🔹 Listen for Modify Button Clicks
    // ==============================
    document.addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains("modify")) {
            const storyCard = e.target.closest(".story");
            if (!storyCard) return;

            const storyId = storyCard.dataset.storyId;
            if (storyId) openModifyStory(storyId);
        }
    });

    // 🔹 Close Modify Overlay
    document.getElementById("modify-cancel-btn").addEventListener("click", () => {
        const modifyOverlay = document.getElementById("modify-overlap");
        const overlayColor = document.querySelector(".overlay-color");
        if (!modifyOverlay) return;

        const storyTitle = document.getElementById("modify-title")?.value || "this story";

        showNotification("close-story", storyTitle, () => {
            modifyOverlay.style.display = "none";
            overlayColor.style.display = "none";
        });
    });
    
    // 🔹 Save Modified Story
    document.getElementById("modify-save").addEventListener("click", async () => {
        const modifyOverlay = document.getElementById("modify-overlap");
        const storyId = modifyOverlay?.dataset?.editingStoryId;
        if (!storyId) return showNotification('error', "No story selected.");

        const original = JSON.parse(modifyOverlay.dataset.originalStory);
        const current = {
            storyname: document.getElementById("modify-title").value.trim(),
            storycontent: document.getElementById("modify-context").value.trim(),
            storyquest_easy: document.getElementById("modify-question1").value.trim(),
            storyquest_med: document.getElementById("modify-question2").value.trim(),
            storyquest_hard: document.getElementById("modify-question3").value.trim(),
            storyimage: document.getElementById("modify-img").src || ""
        };

        const updatedStory = {};
        for (const key in current) {
            if (current[key] !== original[key]) updatedStory[key] = current[key];
        }

        if (Object.keys(updatedStory).length === 0) {
            showNotification('info', 'No changes detected.');
            return;
        }

        try {
            const saveBtn = document.getElementById("modify-save");
            saveBtn.disabled = true; // lock during saving

            const response = await fetch(`/api/update-story/${storyId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedStory)
            });

            const data = await response.json();
            if (data.success) {
                showNotification('modify', current.storyname, async () => {
                    modifyOverlay.style.display = "none";
                    document.querySelector(".overlay-color").style.display = "none";
                    await loadStories();
                });
            } else {
                showNotification('error', "Update failed: " + (data.message || "unknown"));
            }
        } catch (err) {
            console.error("Error updating story:", err);
            showNotification('error', "Error saving changes.");
        }
    });

    // Assuming each story card or row has a data-id attribute
    document.getElementById("modify-delete").addEventListener("click", () => {
        const storyId = document.getElementById("modify-overlap").dataset.editingStoryId;
        if (!storyId) return showNotification('error', "No story selected to delete.");

        // Show the confirmation notification
        showNotification('delete-story', "this story", async () => {
            try {
                const response = await fetch(`/api/delete-story/${storyId}`, {
                    method: "DELETE",
                });
                const data = await response.json();

                if (data.success) {
                    showNotification('success', "Story deleted successfully!");
                    document.getElementById("modify-overlap").style.display = "none";
                    document.querySelector(".overlay-color").style.display = "none";
                    await loadStories();
                } else {
                    showNotification('error', "Error: " + data.message);
                }
            } catch (err) {
                console.error("❌ Error deleting story:", err);
                showNotification('error', "Server error while deleting story.");
            }
        }, () => {
            // ❌ "No" button action
            console.log("Delete cancelled.");
            document.getElementById("modify-overlap").style.display = "none";
            document.querySelector(".overlay-color").style.display = "none";
        });
    });

    // ===============
    // Class Section
    // ===============

    const createClassBtn = document.getElementById("create-class-btn");
    const classOverlay = document.querySelector(".class-overlay-color");
    const classOverlap = document.querySelector(".class-overlap");
    const cancelBtn1 = document.getElementById("class-cancel-btn");
    const codeInput = document.getElementById("class-code");

    const createBtn = document.getElementById("class-overlap-create");
    const classListUl = document.getElementById("class-list-ul");
    const classNameInput = document.getElementById("class-name");

    // Generate random 4-digit class code
    function generateClassCode() {
        return Math.floor(1000 + Math.random() * 9000);
    }

    // Open modal
    createClassBtn.addEventListener("click", () => {
        codeInput.value = generateClassCode(); // Auto-generate code
        classOverlay.style.display = "block";
        classOverlap.style.display = "block";
    });

    // Close modal
    cancelBtn1.addEventListener("click", () => {
        classOverlay.style.display = "none";
        classOverlap.style.display = "none";
        document.getElementById("class-name").value = '';
    });


    classOverlay.addEventListener("click", () => {
        classOverlay.style.display = "none";
        classOverlap.style.display = "none";
    });

    // Create new class on click
    createBtn.addEventListener("click", async () => {
        const className = classNameInput.value.trim();
        const classCode = codeInput.value;

        if (className === "") {
            showNotification('info', 'Please enter a class name!');
            return;
        }

        const teacherData = JSON.parse(localStorage.getItem("teacher"));
        if (!teacherData) {
            showNotification('error', "Please log in again. Teacher not found.");
            return;
        }
        const teacherId = teacherData.id;

        try {
            const response = await fetch("/api/create-class", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: className,
                    code: classCode,
                    teacher_id: teacherId
                }),
            });

            const data = await response.json();

            if (data.success) {
                showNotification('create', data.class.name, () => {
                    console.log('Class created successfully.');
                });

                // Optional: Give user feedback before reload
                setTimeout(() => {
                    location.reload(); // ✅ Reload the page after class creation
                }, 1500); // waits 1.5 seconds before reloading

            } else {
                showNotification('error', "Error: " + data.message);
            }
        } catch (err) {
            console.error("Error creating class:", err);
            showNotification('error', "Failed to create class. Please try again.");
        }
    });
    
    // Function to load teacher’s classes
    async function loadTeacherClasses() {
        const teacher = JSON.parse(localStorage.getItem("teacher"));
        if (!teacher || !teacher.id) {
            console.error("No teacher found in localStorage");
            return;
        }

        try {
            const res = await fetch(`/api/get-classes/${teacher.id}`);
            const data = await res.json();

            console.log("API response:", data);

            const classes = Array.isArray(data) ? data : data.classes || [];

            // ✅ fix here: use class-list-ul
            const container = document.getElementById("class-list-ul");
            container.innerHTML = "";

            classes.forEach(cls => {
                const li = document.createElement("li");
                li.classList.add("class-card");

                // ✅ store classCode and className in dataset
                li.dataset.classCode = cls.code;
                li.dataset.className = cls.name;

                li.innerHTML = `
                    <h3>${cls.name}</h3>
                    <p>
                        Class Code: 
                        <span class="class-code" data-code="${cls.code}">****</span>
                        <button class="toggle-code" aria-label="Toggle Code Visibility">
                            <i class="fa fa-eye"></i>
                        </button>
                    </p>
                    <p>Students: <span class="student-count">${cls.no_students}</span></p>
                `;
                container.appendChild(li);

                // toggle show/hide class code
                const toggleBtn = li.querySelector(".toggle-code");
                const codeSpan = li.querySelector(".class-code");
                let isHidden = true;

                toggleBtn.addEventListener("click", (e) => {
                    e.stopPropagation(); // ✅ prevent triggering class view when clicking eye button
                    if (isHidden) {
                        codeSpan.textContent = codeSpan.dataset.code;
                        toggleBtn.innerHTML = `<i class="fa fa-eye-slash"></i>`;
                    } else {
                        codeSpan.textContent = "****";
                        toggleBtn.innerHTML = `<i class="fa fa-eye"></i>`;
                    }
                    isHidden = !isHidden;
                });

                // ✅ add click event for opening class view
                li.addEventListener("click", () => {
                    const classCode = parseInt(li.dataset.classCode, 10);
                    if (!classCode) {
                        console.error("Class code missing!", li.dataset);
                        return;
                    }
                    openClassView(classCode, li.dataset.className);
                    openClass(classCode);
                });
            });
        } catch (err) {
            console.error("Error loading classes:", err);
        }
    }

    // 🔹 Auto-load stories after login/reload
    window.addEventListener("DOMContentLoaded", async () => {
        const teacher = JSON.parse(localStorage.getItem("teacher"));
        if (teacher) {
            await loadStories(); // autoload stories
            await loadTeacherClasses(teacher.id); // also autoload classes
        } else {
            console.log("No teacher found in localStorage.");
        }
    });

    // Class View Overlay Elements
    const classViewOverlay = document.querySelector(".class-view-overlay");
    const classViewModal = document.querySelector(".class-view-modal");
    const studentList = document.getElementById("student-list");
    const closeClassViewBtn = document.getElementById("close-class-view");
    const deleteClassBtn = document.getElementById("delete-class-btn");
    const classViewTitle = document.getElementById("class-view-title");

    let currentClassCode = null;

    // Function to open class view
    async function openClassView(classCode, className) {
        if (!classCode) {
            console.error("openClassView called without classCode!");
            return;
        }
        currentClassCode = classCode;
        classViewTitle.textContent = className;
        studentList.innerHTML = "";

        try {
            const res = await fetch(`/api/get-students/${classCode}`);
            const data = await res.json();

            if (!data.students) {
                console.warn("No students found for class", classCode, data);
                return;
            }

            data.students.forEach((student, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${student.fullname}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-bar-inner" style="width: ${student.progress || 0}%;">
                                <span class="progress-text">${student.progress || 0}%</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <button class="delete-student" data-id="${student.id}">🗑</button>
                    </td>
                `;
                studentList.appendChild(tr);
            });

            // Open modal
            classViewOverlay.style.display = "block";
            classViewModal.style.display = "block";

            // Attach delete student handlers
            document.querySelectorAll(".delete-student").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const studentId = e.target.dataset.id;
                    showNotification('delete-student', e.target.closest('tr').querySelector('td:nth-child(2)').textContent, async () => {
                        try {
                            const response = await fetch(`/api/delete-student/${studentId}`, {
                                method: "DELETE"
                            });

                            if (response.ok) {
                                // ✅ Remove the student row immediately
                                e.target.closest("tr").remove();

                                // ✅ Update the student count in the class list
                                const classCard = document.querySelector(`.class-card[data-class-code='${currentClassCode}']`);
                                if (classCard) {
                                    const countEl = classCard.querySelector(".student-count");
                                    const currentCount = parseInt(countEl.textContent, 10) || 0;
                                    countEl.textContent = Math.max(0, currentCount - 1); // avoid negative
                                }

                                console.log(`Student ${studentId} deleted. Count updated.`);
                            } else {
                                showNotification('error', "Failed to delete student.");
                            }
                        } catch (err) {
                            console.error("Error deleting student:", err);
                            showNotification('error', "Error deleting student.");
                        }
                    });
                });
            });

        } catch (err) {
            console.error("Error fetching students:", err);
        }
    }

    // Close modal
    closeClassViewBtn.addEventListener("click", () => {
        classViewOverlay.style.display = "none";
        classViewModal.style.display = "none";
    });

    // Delete class
    deleteClassBtn.addEventListener("click", async () => {
        showNotification('delete-class', classViewTitle.textContent, async () => {
            await fetch(`/api/delete-class/${currentClassCode}`, {
                method: "DELETE"
            });
            classViewOverlay.style.display = "none";
            classViewModal.style.display = "none";
            loadTeacherClasses();
        });
    });

    const searchInput = document.getElementById("student-search");
    if (searchInput) {
        searchInput.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                searchInput.classList.toggle("expanded");
            if (searchInput.classList.contains("expanded")) {
                searchInput.focus();
            } else {
                searchInput.blur();
            }
            }
        });
    }

    // ========================== 🧩 STUDENT VIEW OVERLAY LOGIC ==========================

    // Get student view elements
    const viewStudentOverlay = document.querySelector(".view-student");
    const viewStudentBorder = document.querySelector(".view-student-border");
    const closeViewStudentBtn = document.getElementById("view-student-cancel-btn");

    // Name & progress
    const studentNameTitle = document.getElementById("student-name-title");
    const studentProgressBar = document.getElementById("student-progress-bar");
    const completedActivitiesList = document.getElementById("completed-activities-list");

    // Progress summary table IDs
    const storyCompleted = document.getElementById("story-completed");
    const storyAverage = document.getElementById("story-average");
    const learningCompleted = document.getElementById("learning-completed");
    const learningAverage = document.getElementById("learning-average");

    // Chart element
    const progressChartCanvas = document.getElementById("student-progress-chart");
    let studentChartInstance = null;

    // Function to open student view
    async function openStudentView(studentId, studentName) {
        if (!studentId) return;

        // Show overlay
        viewStudentOverlay.style.display = "block";
        viewStudentBorder.style.display = "block";

        // Reset content
        studentNameTitle.textContent = studentName;
        studentProgressBar.style.width = "0%";
        studentProgressBar.textContent = "0%";
        completedActivitiesList.innerHTML = `<li>Loading progress...</li>`;

        // Reset summary table
        storyCompleted.textContent = "0";
        storyAverage.textContent = "0%";
        learningCompleted.textContent = "0";
        learningAverage.textContent = "0%";

        try {
            // Fetch student progress data
            const response = await fetch(`/api/get-student-progress/${studentId}`);
            const data = await response.json();

            if (data.success) {
                const { progress, storyStats, learningStats, activities } = data;

                // ✅ Update progress bar
                studentProgressBar.style.width = `${progress}%`;
                studentProgressBar.textContent = `${progress}%`;

                // ✅ Update table stats
                storyCompleted.textContent = storyStats.completed;
                storyAverage.textContent = `${storyStats.average}%`;

                learningCompleted.textContent = learningStats.completed;
                learningAverage.textContent = `${learningStats.average}%`;

                // ✅ Populate completed activities list
                completedActivitiesList.innerHTML = "";
                if (activities && activities.length > 0) {
                    activities.forEach(act => {
                        const li = document.createElement("li");
                        li.textContent = `${act.title} (${act.category}) - ${act.score}%`;
                        completedActivitiesList.appendChild(li);
                    });
                } else {
                    completedActivitiesList.innerHTML = "<li>No completed activities yet.</li>";
                }

                // ✅ Render chart visualization (bar chart)
                if (progressChartCanvas) {
                    if (studentChartInstance) {
                        studentChartInstance.destroy();
                    }

                    studentChartInstance = new Chart(progressChartCanvas, {
                        type: "bar",
                        data: {
                            labels: ["Story Comprehension", "Learning Activities"],
                            datasets: [{
                                label: "Average Score (%)",
                                data: [storyStats.average, learningStats.average],
                                borderWidth: 1,
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: { beginAtZero: true, max: 100 }
                            }
                        }
                    });
                }
            } else {
                completedActivitiesList.innerHTML = "<li>Unable to load progress data.</li>";
            }
        } catch (err) {
            console.error("Error fetching student progress:", err);
            completedActivitiesList.innerHTML = "<li>Error loading data.</li>";
        }
    }

    // Close student view
    if (closeViewStudentBtn) {
        closeViewStudentBtn.addEventListener("click", () => {
            viewStudentOverlay.style.display = "none";
            viewStudentBorder.style.display = "none";
        });
    }

    // ========================== 🧠 ADD CLICK EVENT TO EACH STUDENT ROW ==========================
    function attachStudentRowListeners() {
        document.querySelectorAll("#student-list tr").forEach(row => {
            const studentNameCell = row.querySelector("td:nth-child(2)");
            if (studentNameCell) {
                studentNameCell.style.cursor = "pointer";
                studentNameCell.addEventListener("click", () => {
                    const studentId = row.querySelector(".delete-student")?.dataset.id;
                    const studentName = studentNameCell.textContent.trim();
                    openStudentView(studentId, studentName);
                });
            }
        });
    }

    // Reattach listeners after rendering student list
    const originalOpenClassView = openClassView;
    openClassView = async function (...args) {
        await originalOpenClassView.apply(this, args);
        attachStudentRowListeners();
    };

    // =====================
    // NOTIFICATION SECTION
    // =====================

    //Notification
    // ✅ Notification system helper
    function showNotification(type, titleText, onConfirm) {
        // Hide any open notifications
        document.querySelectorAll('.notification').forEach(n => (n.style.display = 'none'));
        const overlay = document.querySelector('.notification-overlay');

        if (!overlay) {
            console.error('❌ Notification overlay not found in DOM.');
            return;
        }

        const notification = document.getElementById(`${type}-notification`);

        if (!notification) {
            console.error(`❌ Notification element #${type}-notification missing.`);
            overlay.style.display = 'none';
            return;
        }

        overlay.style.display = 'flex';
        notification.style.display = 'block';

        // Update dynamic title text if exists
        const titleSpan = notification.querySelector('.story-title, .class-title, .student-name');
        if (titleSpan) titleSpan.textContent = titleText || '';

        // Safely get buttons
        const yesBtn = notification.querySelector('button[id^="yes"]');
        const noBtn = notification.querySelector('button[id^="no"]');

        // Reset click handlers (prevent stacking)
        if (yesBtn) yesBtn.onclick = null;
        if (noBtn) noBtn.onclick = null;

        if (yesBtn) {
            yesBtn.onclick = () => {
            overlay.style.display = 'none';
            notification.style.display = 'none';
            if (onConfirm) onConfirm();
            };
        }

        if (noBtn) {
            noBtn.onclick = () => {
            overlay.style.display = 'none';
            notification.style.display = 'none';
            };
        }

        // Auto-close info or error messages after 2s
        if (!yesBtn && !onConfirm) {
            setTimeout(() => {
            overlay.style.display = 'none';
            notification.style.display = 'none';
            }, 2000);
        }
    }

    // === ENROLL STUDENT OVERLAY ===
    const enrollBtn = document.getElementById('enroll-student-btn');
    const enrollOverlayColor = document.querySelector('.enroll-overlay-color');
    const enrollOverlap = document.querySelector('.enroll-overlap');
    const enrollCancel = document.getElementById('enroll-cancel-btn');
    const enrollForm = document.getElementById('enroll-form');
    const enrollClassCode = document.getElementById('enroll-class-code');

    // 🧩 Variable to store the selected class code (set dynamically when viewing a class)
    let selectedClassCode = null;

    // Example: when teacher opens a specific class
    // Call this function after a class is selected from your class list
    function openClass(code) {
        selectedClassCode = code;
        console.log("✅ Selected class code:", selectedClassCode);
    }

    // Open overlay when clicking "Enroll Student"
    enrollBtn.addEventListener('click', () => {
        if (!selectedClassCode) {
            showNotification('error', "Please select a class first before enrolling a student.");
            return;
        }

        enrollClassCode.value = selectedClassCode;
        enrollOverlayColor.style.display = 'block';
        enrollOverlap.style.display = 'block';
    });

    // Close overlay
    enrollCancel.addEventListener('click', () => {
        enrollOverlayColor.style.display = 'none';
        enrollOverlap.style.display = 'none';
        enrollForm.reset();
    });

    // === MANUAL ENROLLMENT SUBMIT ===
    enrollForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('enroll-first-name').value.trim();
        const lastName = document.getElementById('enroll-last-name').value.trim();
        const classCode = enrollClassCode.value.trim();

        if (!firstName || !lastName || !classCode) {
            showNotification('error', "Please fill out all required fields.");
            return;
        }

        const fullname = `${lastName}, ${firstName}`;

        try {
            const response = await fetch("/api/student-register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullname, code: classCode })
            });

            const result = await response.json();

            if (result.success) {
                showNotification('success', `${result.student.fullname} successfully enrolled!`);

                // Keep or re-show the enrollment overlay
                enrollOverlayColor.style.display = 'none';
                enrollOverlap.style.display = 'none';

                // Reset the form fields for next entry
                enrollForm.reset();
            } else {
                showNotification('error', result.message || "Student enrollment failed.");
            }
        } catch (err) {
            console.error("❌ Enrollment Error:", err);
            showNotification('error', "Error connecting to server. Please try again.");
            // ❌ removed: loadEnrolledStudents();
        }
    });

    // === CSV IMPORT FUNCTION ===
    document.getElementById("add-csv").addEventListener("change", async function (event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith(".csv")) {
            showNotification('error', "Error: Please upload a valid CSV file.");
            event.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = async function (e) {
            const csvText = e.target.result.trim();
            const lines = csvText.split("\n");

            // Validate header
            const header = lines[0].trim().split(",").map(h => h.trim().toLowerCase());
            const expectedHeader = ["first name", "last name"];

            if (header.length !== 2 || header[0] !== expectedHeader[0] || header[1] !== expectedHeader[1]) {
                showNotification('error', "Invalid CSV format! File must only contain 'First Name' and 'Last Name' columns.");
                event.target.value = "";
                return;
            }

            const students = [];
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].trim().split(",");
                if (parts.length === 2) {
                    const firstName = parts[0].trim();
                    const lastName = parts[1].trim();
                    if (firstName && lastName) {
                        students.push({ firstName, lastName });
                    }
                }
            }

            if (students.length === 0) {
                showNotification('error', "No valid student records found in CSV.");
                return;
            }

            const classCode = document.getElementById('enroll-class-code').value.trim();
            let successCount = 0;

            for (const s of students) {
                const fullname = `${s.lastName}, ${s.firstName}`;
                try {
                    const response = await fetch("/api/student-register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fullname, code: classCode })
                    });
                    const result = await response.json();
                    if (result.success) successCount++;
                } catch (err) {
                    console.error(`❌ Failed to enroll ${s.firstName} ${s.lastName}:`, err);
                }
            }

            showNotification('success', `Successfully imported ${successCount}/${students.length} student(s)!`);

            // 🔹 Keep overlay open and refresh student list live
            enrollOverlayColor.style.display = 'none';
            enrollOverlap.style.display = 'none';

            event.target.value = "";
        };

        reader.onerror = function () {
            showNotification('error', "Error reading the CSV file. Please try again.");
        };  

        reader.readAsText(file);
    });


    // ============================
    // Video Overlay Show / Hide Controls
    // ============================
    const lessonOverlayBg = document.getElementById("lesson-overlay-background");
    const videoOverlay = document.getElementById("video-overlay");
    const createVideoBtn = document.getElementById("create-video-btn");
    const cancelVideoBtn = document.getElementById("cancel-video-btn");
    const overlayplayer = document.getElementById("video-player-overlay");
    const overlayVideo = document.getElementById("player-video");
    const overlayTitle = document.getElementById("player-video-title");
    const closeBtn = overlayplayer?.querySelector(".close-btn");

    createVideoBtn.addEventListener("click", () => {
        lessonOverlayBg.style.display = "block";
        videoOverlay.style.display = "block";
    });

    cancelVideoBtn.addEventListener("click", () => {
        lessonOverlayBg.style.display = "none";
        videoOverlay.style.display = "none";
        document.getElementById("video-name").value = '';
    });

    // ✅ Close overlay safely
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            overlayplayer.style.display = "none";
            overlayVideo.pause();
            overlayVideo.src = "";
            if (overlayTitle) overlayTitle.textContent = "";
        });
    }

    // ✅ Optional: click outside video to close
    if (overlayplayer) {
        overlayplayer.addEventListener("click", (e) => {
            if (e.target === overlayplayer) {
                overlayplayer.style.display = "none";
                overlayVideo.pause();
                overlayVideo.src = "";
                if (overlayTitle) overlayTitle.textContent = "";
            }
        });
    }

    // ============================
    // File Preview & Label Control
    // ============================
    const videoInput = document.getElementById("uploadVideo");
    const videoLabel = document.getElementById("video-upload-label");

    videoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        const statusDiv = document.getElementById("video-upload-status");
        if (file) {
            statusDiv.innerHTML = `<div class="file-item preview"><i class="fa fa-video"></i> ${file.name}</div>`;
            videoLabel.style.display = "none"; // hide label when file is selected
        } else {
            statusDiv.innerHTML = "";
            videoLabel.style.display = "block";
        }
    });

    // ============================
    // Upload Video (Local Server)
    // ============================
    document.getElementById("upload-video-btn").addEventListener("click", async () => {
        const file = document.getElementById("uploadVideo").files[0];
        const videoName = document.getElementById("video-name").value.trim();
        const teacher = JSON.parse(localStorage.getItem("teacher") || "{}");
        const statusDiv = document.getElementById("video-upload-status");

        if (!file) return showNotification('error', "Please select a video file.");
        if (!videoName) return showNotification('error', "Please enter a video name.");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("videoName", videoName);
        formData.append("teachID", teacher.id || 1);

        statusDiv.innerHTML = `<div class="file-item loading">⏳ Uploading...</div>`;

        try {
            const response = await fetch("/api/upload-video", {
                method: "POST",
                body: formData
            });

            const text = await response.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Invalid server response: " + text);
            }

            if (data.success) {
                statusDiv.innerHTML = `
                    <div class="file-item success">
                        ✅ <strong>${data.video.videoname}</strong> uploaded successfully!
                    </div>
                `;

                addToList("video", data.video.videofile, data.video.videoname);
                loadVideos(); // refresh video list
            } else {
                statusDiv.innerHTML = `<div class="file-item error">❌ ${data.message}</div>`;
            }
        } catch (err) {
            console.error("❌ Video Upload Error:", err);
            statusDiv.innerHTML = `<div class="file-item error">❌ Upload failed: ${err.message}</div>`;
        }
    });

    // ============================
    // Load Videos from Database and Folder
    // ============================
    async function loadVideos() {
        const container = document.querySelector(".res-video-list");
        if (!container) return;

        container.innerHTML = "<p>🎥 Loading videos...</p>";

        try {
            // ✅ Use the correct route
            const response = await fetch("/api/get-videos");
            const data = await response.json();

            // ✅ Validate and extract the array correctly
            const videos = data.videos || [];

            if (!data.success || !Array.isArray(videos)) {
                container.innerHTML = "<p style='color:red;'>Invalid server response.</p>";
                console.error("❌ Invalid response:", data);
                return;
            }

            if (videos.length === 0) {
                container.innerHTML = "<p>No videos uploaded yet.</p>";
                return;
            }

            // ✅ Build the list dynamically
            const list = document.createElement("ul");
            list.className = "res-list-grid";

            videos.forEach(video => {
                const li = document.createElement("li");
                li.className = "res-item";

                // ✅ Use 'videoname' from the database, not the upload filename
                const displayName = video.videoname;
                const videoUrl = video.videofile;

                li.innerHTML = `
                    <div class="res-card" title="${displayName}">
                        <i class="fa fa-video res-icon-file"></i>
                        <p class="res-name" style="cursor:pointer;">${displayName}</p>
                    </div>
                `;

                li.querySelector(".res-card").addEventListener("click", () => {
                    const overlayplayer = document.getElementById("video-player-overlay");
                    const overlayVideo = document.getElementById("player-video");
                    const overlayTitle = document.getElementById("player-video-title");

                    overlayVideo.src = videoUrl;
                    if (overlayTitle) overlayTitle.textContent = displayName;
                    overlayplayer.style.display = "flex";
                    overlayVideo.play();
                });

                list.appendChild(li);
            });

            container.innerHTML = "";
            container.appendChild(list);

        } catch (err) {
            console.error("❌ Error loading videos:", err);
            container.innerHTML = "<p style='color:red;'>Error loading videos.</p>";
        }
    }

    loadVideos();

});
