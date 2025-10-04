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
            alert("Please log in again. Teacher not found.");
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
                    <button class="button">Read Now</button>
                `;
                document.querySelector(".act-card").appendChild(newStory);

                await loadStories();

                // Hide modal
                overlay.style.display = "none";
                overlapModal.style.display = "none";
            } else {
                alert("Error: " + data.message);
            }
        } catch (err) {
            console.error("❌ Error uploading story:", err);
            alert("Failed to save story.");
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
                    storyDiv.innerHTML = `
                        <div class="story-image">
                            <img src="${story.storyimage}" alt="Story Image" />
                        </div>
                        <p>${story.storyname}</p>
                        <button class="button">Read Now</button>
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
            alert("Please enter a class name!");
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
                alert("Class Created ✅ with Code: " + data.class.code);

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
                alert("Error: " + data.message);
            }
        } catch (err) {
            console.error("Error creating class:", err);
            alert("Failed to create class. Please try again.");
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
                    if (confirm("Delete this student?")) {
                        await fetch(`http://localhost:5000/delete-student/${studentId}`, {
                            method: "DELETE"
                        });
                        openClassView(currentClassCode, className); // reload list
                    }
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
        if (confirm("Are you sure you want to delete this class?")) {
            await fetch(`http://localhost:5000/delete-class/${currentClassCode}`, {
                method: "DELETE"
            });
            classViewOverlay.style.display = "none";
            classViewModal.style.display = "none";
            loadTeacherClasses(); // reload classes
        }
    });

});
