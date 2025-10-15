document.addEventListener('DOMContentLoaded', async () => {
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

            // ✅ make sure the backend actually returns { questions: "..." }
            return data.questions || "No questions generated.";
        } catch (error) {
            console.error("Error fetching questions:", error);
            return "Failed to generate questions. Please try again.";
        }
    }

    // Function to generate AI image using backend
    async function generateImageFromKeyword(keyword) {
        try {
            const response = await fetch("http://localhost:5000/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `illustrate a image about ${keyword}`,
                    size: "1-1",
                    refImage: "https://pub-static.aiease.ai/ai-storage/2025/09/02/dd9808737f694e25bb3f380508ad262f.jpeg"
                }),
            });

            const data = await response.json();
            console.log("AI Image Generated:", data);

            // ✅ extract the actual image URL
            if (data.generatedImage) {
                const parsed = JSON.parse(data.generatedImage);
                const url = parsed?.result?.data?.results?.[0]?.origin;
                return url || `https://source.unsplash.com/512x512/?${encodeURIComponent(keyword)}`;
            }

            return `https://source.unsplash.com/512x512/?${encodeURIComponent(keyword)}`;
        } catch (error) {
            console.error("Error generating image:", error);
            return `https://source.unsplash.com/512x512/?${encodeURIComponent(keyword)}`;
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
                const keyword = fullText.split(" ")[0] || "story";
                imageUrl = await generateImageFromKeyword(keyword);

                // Fill the modal with defaults
                document.getElementById("title").value = titleGuess;
                document.getElementById("context").value = fullText.trim();
                document.querySelector(".over-img img").src = imageUrl;

                const questions = await generateQuestionsFromContext(fullText.trim());
                document.getElementById("questions").value = Array.isArray(questions) ? questions.join("\n\n") : questions;

            };

            fileReader.readAsArrayBuffer(file);
        } else {
            alert("Please upload a valid PDF file.");
            fileInput.value = '';
        }
    });

    // Upload button handler (reads updated values)
    uploadBtn.addEventListener('click', async () => {
        const editedTitle = document.getElementById("title").value;
        const editedContext = document.getElementById("context").value;
        const editedQuestions = document.getElementById("questions").value;

        const teacher = JSON.parse(localStorage.getItem("teacher"));
        if (!teacher || !teacher.id) {
            showNotification('login', 'Please log in again.', null);
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/save-story", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teach_id: teacher.id,
                    storyname: editedTitle,
                    storycontent: editedContext,
                    storyquest: editedQuestions,
                    storyimage: imageUrl
                }),
            });

            const data = await response.json();
            if (data.success) {
                console.log("✅ Story saved to DB:", data.story);

                // Create new story card
                const newStory = document.createElement("div");
                newStory.classList.add("story", "show");
                newStory.innerHTML = `
                    <div class="story-image">
                        <img src="${imageUrl}" alt="Story Image" />
                    </div>
                    <p>${editedTitle}</p>
                    <button class="modify">Modify Now</button>
                `;
                document.querySelector(".act-card").appendChild(newStory);

                await loadStories();

                // Hide modal
                overlay.style.display = "none";
                overlapModal.style.display = "none";
            } else {
                showNotification('error', data.message);
            }
        } catch (err) {
            console.error("❌ Error uploading story:", err);
            showNotification('error', "Failed to save story.");
        }
    });

    // Load all stories for logged-in teacher on page load
    async function loadStories() {
        const teacher = JSON.parse(localStorage.getItem("teacher"));
        if (!teacher || !teacher.id) {
            console.warn("No teacher found in localStorage");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/get-stories/${teacher.id}`);
            const data = await response.json();

            if (data.success) {
                const container = document.querySelector(".act-card");

                // ✅ Remove only old story elements, NOT the upload div
                container.querySelectorAll(".story").forEach(storyEl => storyEl.remove());

                // ✅ Append the stories
                data.stories.forEach(story => {
                    const storyDiv = document.createElement("div");
                    storyDiv.classList.add("story", "show");
                    storyDiv.dataset.storyId = story.story_id;
                    storyDiv.innerHTML = `
                        <div class="story-image">
                            <img src="${story.storyimage}" alt="Story Image" />
                        </div>
                        <p>${story.storyname}</p>
                        <button class="modify">Modify Now</button>
                    `;
                    container.appendChild(storyDiv);
                });
            } else {
                console.error("Failed to fetch stories:", data.message);
            }
        } catch (err) {
            console.error("❌ Error loading stories:", err);
        }
    }

    cancelBtn.addEventListener('click', () => {
        overlay.style.display = "none";
        overlapModal.style.display = "none";
        fileInput.value = ''; // reset file input
    });

    // ==============================
    // 🔹 Handle Modify Story Button
    // ==============================
    async function openModifyStory(storyId) {
        const modifyOverlay = document.getElementById("modify-overlap");
        const overlay = document.querySelector(".overlay-color");

        try {
            const response = await fetch(`http://localhost:5000/get-story/${storyId}`);
            if (!response.ok) {
            const text = await response.text();
            console.error("get-story failed:", response.status, text);
            alert("Failed to load story details (see console).");
            return;
            }

            const data = await response.json();
            if (!data.success) {
            alert("Failed to load story details: " + (data.message || "Unknown"));
            return;
            }

            const story = data.story || {};

            // fill fields
            document.getElementById("modify-title").value = story.storyname || "";
            document.getElementById("modify-context").value = story.storycontent || "";
            document.getElementById("modify-questions").value = story.storyquest || "";
            document.getElementById("modify-img").src = story.storyimage || "https://placehold.co/250x180";

            // show overlay
            overlay.style.display = "block";
            modifyOverlay.style.display = "block";

            // store editing id and original snapshot for diffing later
            modifyOverlay.dataset.editingStoryId = story.story_id;
            modifyOverlay.dataset.originalStory = JSON.stringify({
            storyname: story.storyname || "",
            storycontent: story.storycontent || "",
            storyquest: story.storyquest || "",
            storyimage: story.storyimage || ""
            });
            console.log("openModifyStory: loaded story", story.story_id);
        } catch (err) {
            console.error("❌ Error fetching story details:", err);
            alert("Error loading story details. Check console.");
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
    document.getElementById("modify-cancel").addEventListener("click", () => {
        document.getElementById("modify-overlap").style.display = "none";
        document.querySelector(".overlay-color").style.display = "none";
    });

    // 🔹 Save Modified Story
    document.getElementById("modify-save").addEventListener("click", async () => {
        const modifyOverlay = document.getElementById("modify-overlap");
        const storyId = modifyOverlay?.dataset?.editingStoryId;

        if (!storyId) {
            alert("No story selected to modify.");
            return;
        }

        // current values
        const currentTitle = document.getElementById("modify-title").value.trim();
        const currentContext = document.getElementById("modify-context").value.trim();
        const currentQuestions = document.getElementById("modify-questions").value.trim();
        const currentImage = document.getElementById("modify-img").src || "";

        // original snapshot
        const original = modifyOverlay.dataset.originalStory ? JSON.parse(modifyOverlay.dataset.originalStory) : {};

        // build diff object: only include keys that actually changed
        const updatedStory = {};
        if (currentTitle !== (original.storyname || "")) updatedStory.storyname = currentTitle;
        if (currentContext !== (original.storycontent || "")) updatedStory.storycontent = currentContext;
        if (currentQuestions !== (original.storyquest || "")) updatedStory.storyquest = currentQuestions;
        if (currentImage !== (original.storyimage || "")) updatedStory.storyimage = currentImage;

        if (Object.keys(updatedStory).length === 0) {
            showNotification('info', 'No changes detected.');
            return;
        }

        try {
            console.log("PUT /update-story/" + storyId, updatedStory);

            const response = await fetch(`http://localhost:5000/update-story/${storyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedStory)
            });

            // if response is not ok try to read text (avoid .json() on HTML)
            if (!response.ok) {
            const errText = await response.text();
            console.error("Server returned non-OK:", response.status, errText);
            alert("Failed to update story. Server responded: " + response.status);
            return;
            }

            // parse JSON safely
            const dataText = await response.text();
            let data;
            try {
                data = JSON.parse(dataText);
            } catch (parseErr) {
                console.error("Failed parsing response JSON:", parseErr, "raw:", dataText);
                alert("Server returned unexpected response. Check server console.");
                return;
            }

            if (data.success) {
                console.log("Story updated:", data.story);
                showNotification('modify', currentTitle, async () => {
                    modifyOverlay.style.display = "none";
                    document.querySelector(".overlay-color").style.display = "none";
                    await loadStories();
                });
            } else {
                console.error("Update failed:", data);
                showNotification('error', "Update failed: " + (data.message || "unknown"));
            }
        } catch (err) {
            console.error("❌ Error updating story:", err);
            showNotification('error', "Error saving changes. See console for details.");
        }
    });

    
    // Create Class Section
    const createClassBtn = document.getElementById("create-class-btn");
    const classOverlay = document.querySelector(".class-overlay-color");
    const classOverlap = document.querySelector(".class-overlap");
    const cancelBtn1 = document.getElementById("class-overlap-cancel");
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
            alert("Please log in again. Teacher not found.");
            return;
        }
        const teacherId = teacherData.id;

        try {
            const response = await fetch("http://localhost:5000/create-class", {
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

                const li = document.createElement("li");
                li.classList.add("class-card");
                li.innerHTML = `
                    <h3>${data.class.name}</h3>
                    <p>
                        Class Code: 
                        <span class="class-code" data-code="${data.class.code}">****</span>
                        <button class="toggle-code" aria-label="Toggle Code Visibility">
                            <i class="fa fa-eye"></i>
                        </button>
                    </p>
                    <p>Students: <span class="student-count">${data.class.no_students}</span></p>
                `;

                classListUl.appendChild(li);
                classNameInput.value = "";
                classOverlay.style.display = "none";
                classOverlap.style.display = "none";

                const toggleBtn = li.querySelector(".toggle-code");
                const codeSpan = li.querySelector(".class-code");
                let isHidden = true;

                toggleBtn.addEventListener("click", (e) => {
                    e.stopPropagation(); // ✅ prevent triggering openClassView
                    if (isHidden) {
                        codeSpan.textContent = codeSpan.dataset.code;
                        toggleBtn.innerHTML = `<i class="fa fa-eye-slash"></i>`;
                    } else {
                        codeSpan.textContent = "****";
                        toggleBtn.innerHTML = `<i class="fa fa-eye"></i>`;
                    }
                    isHidden = !isHidden;
                });

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
            const res = await fetch(`http://localhost:5000/get-classes/${teacher.id}`);
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

    const socket = io("http://localhost:5000");

    socket.on("student-joined", (data) => {
        console.log("Student joined class:", data.code);
        const teacher = JSON.parse(localStorage.getItem("teacher"));
        if (teacher) {
            loadTeacherClasses(teacher.id); // ✅ pass teacherId
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
            const res = await fetch(`http://localhost:5000/get-students/${classCode}`);
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
                            const response = await fetch(`http://localhost:5000/delete-student/${studentId}`, {
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

    socket.on("student-removed", (data) => {
        if (data.code === currentClassCode) {
            openClassView(currentClassCode, classViewTitle.textContent); // reload modal
            loadTeacherClasses(); // reload sidebar counts
        }
    });

    // Close modal
    closeClassViewBtn.addEventListener("click", () => {
        classViewOverlay.style.display = "none";
        classViewModal.style.display = "none";
    });

    // Delete class
    deleteClassBtn.addEventListener("click", async () => {
        showNotification('delete-class', classViewTitle.textContent, async () => {
            await fetch(`http://localhost:5000/delete-class/${currentClassCode}`, {
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
    const enrollCancel = document.getElementById('enroll-overlap-cancel');
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
            alert("Please select a class first before enrolling a student.");
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

    // Form submission handler (connected to server)
    enrollForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('enroll-first-name').value.trim();
        const lastName = document.getElementById('enroll-last-name').value.trim();
        const classCode = enrollClassCode.value.trim();

        if (!firstName || !lastName || !classCode) {
            alert("Please fill out all required fields.");
            return;
        }

        // Combine to match your server normalization ("Surname, Firstname")
        const fullname = `${lastName}, ${firstName}`;

        try {
            const response = await fetch("http://localhost:5000/student-register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ fullname, code: classCode })
            });

            const result = await response.json();

            if (result.success) {
                alert(`✅ ${result.student.fullname} successfully enrolled in class ${result.student.code}!`);
                enrollOverlayColor.style.display = 'none';
                enrollOverlap.style.display = 'none';
                enrollForm.reset();
            } else {
                alert(`⚠️ ${result.message || "Student enrollment failed."}`);
            }

        } catch (err) {
            console.error("❌ Enrollment Error:", err);
            alert("Error connecting to server. Please try again.");
        }
    });
});
