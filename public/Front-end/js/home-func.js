const loginOverlay = document.querySelector('.login-overlay');
const loginForms = document.getElementById('loginForms');
const teacherBtn = document.getElementById('teacherToogle');
const studentBtn = document.getElementById('studentToogle');
const loginBtn = document.querySelector('.login-btn');
const closeLogin = document.getElementById('closeLogin');
const teacherForm = document.getElementById('teacherForm');
const loginModel = document.querySelector('.login-model');
const registerModel = document.querySelector('.register-model');
const signupLink = document.querySelector('#teacherOverlay .signup-text span');
const backToLogin = document.getElementById('backToLogin');
const closeRegister = document.getElementById('closeRegister');
const studentLogin = document.querySelector('.student-btn');

// Show Register when clicking "Sign up here!"
signupLink.addEventListener('click', () => {
    loginModel.style.display = 'none';
    registerModel.style.display = 'block';
});

// Back to Login
backToLogin.addEventListener('click', () => {
    registerModel.style.display = 'none';
    loginModel.style.display = 'block';
});

studentLogin.addEventListener('click', () => {
    loginOverlay.style.display = 'flex';        
    
    loginModel.style.display = 'block';
    registerModel.style.display = 'none';

    loginForms.classList.remove('teacher-active');
    loginForms.classList.add('student-active');  // switch to student login
    teacherBtn.classList.remove('active');
    studentBtn.classList.add('active');
});


// Show overlay with Teacher first
loginBtn.addEventListener('click', () => {
    loginOverlay.style.display = 'flex';

    loginModel.style.display = 'block';
    registerModel.style.display = 'none';

    loginForms.classList.add('teacher-active');
    loginForms.classList.remove('student-active');
    teacherBtn.classList.add('active');
    studentBtn.classList.remove('active');
});

// Toggle to Teacher
teacherBtn.addEventListener('click', () => {
    loginForms.classList.add('teacher-active');
    loginForms.classList.remove('student-active');
    teacherBtn.classList.add('active');
    studentBtn.classList.remove('active');

    loginModel.style.display = 'block';
    registerModel.style.display = 'none';
});

// Toggle to Student
studentBtn.addEventListener('click', () => {
    loginForms.classList.add('student-active');
    loginForms.classList.remove('teacher-active');
    studentBtn.classList.add('active');
    teacherBtn.classList.remove('active');

    loginModel.style.display = 'block';
    registerModel.style.display = 'none';
});

// Close overlay
closeLogin.addEventListener('click', () => {
    loginOverlay.style.display = 'none';
});
closeRegister.addEventListener('click', () => {
    loginOverlay.style.display = 'none';
    loginModel.style.display = 'block';
});

// Helper functions
function showError(input, message) {
    input.classList.add("error");
    let errorMsg = input.nextElementSibling;
    if (!errorMsg || !errorMsg.classList.contains("error-message")) {
        errorMsg = document.createElement("span");
        errorMsg.classList.add("error-message");
        input.insertAdjacentElement("afterend", errorMsg);
    }
    errorMsg.textContent = message;
}

function clearError(input) {
    input.classList.remove("error");
    const next = input.nextElementSibling;
    if (next && next.classList.contains("error-message")) {
        next.remove();
    }
}

const registerSubmit = document.getElementById('registerSubmit');
registerSubmit.addEventListener('click', async (e) => {
    e.preventDefault();

    const fullname = document.getElementById("regName");
    const email = document.getElementById("regEmail");
    const password = document.getElementById("regPassword");
    const confirmPassword = document.getElementById("regConfirm");

    [fullname, email, password, confirmPassword].forEach(clearError);

    // ✅ Check matching passwords
    if (password.value !== confirmPassword.value) {
        showError(confirmPassword, "Passwords do not match!");
        return;
    }

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullname: fullname.value.trim(),
                email: email.value.trim(),
                password: password.value.trim(),
            }),
        });

        const data = await response.json();

        if (data.success) {
            alert("✅ Registration successful! Please log in.");
            document.querySelector('.register-model').style.display = 'none';
            document.querySelector('.login-model').style.display = 'block';
        } else {
            // ✅ Show specific error messages
            if (data.field === "fullname") showError(fullname, data.message);
            else if (data.field === "email") showError(email, data.message);
            else if (data.field === "password") showError(password, data.message);
            else alert(data.message || "Registration failed.");
        }
    } catch (error) {
        console.error(error);
        alert("Error connecting to the server.");
    }
});

const loginSubmit = document.getElementById('loginSubmit');
loginSubmit.addEventListener('click', async (e) => {
    e.preventDefault();

    // Check if we're on teacher or student mode
    if (loginForms.classList.contains("teacher-active")) {
        // Teacher login
        const email = document.getElementById("loginEmail");
        const password = document.getElementById("loginPassword");

        [email, password].forEach(clearError);

        try {
            const newLocal = "/api/login";
            const response = await fetch(newLocal, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.value, password: password.value }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("teacher", JSON.stringify(data.teacher));
                window.location.href = "/teacher-front.html";
            } else {
                if (data.field === "email") {
                    showError(email, "Email not found.");
                } else if (data.field === "password") {
                    showError(password, "Incorrect password.");
                } else {
                    alert(data.message || "Invalid credentials.");
                }
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to server.");
        }
    } else if (loginForms.classList.contains("student-active")) {
        // === Student login ===
        const surnameInput = document.getElementById("studentSurname");
        const firstnameInput = document.getElementById("studentFirstname");
        const code = document.getElementById("classCode");

        [surnameInput, firstnameInput, code].forEach(clearError);

        const surname = surnameInput.value.trim();
        const firstname = firstnameInput.value.trim();
        const classCode = code.value.trim();

        // 🔍 Validation
        if (!surname) {
            showError(surnameInput, "Please enter your surname.");
            return;
        }
        if (!firstname) {
            showError(firstnameInput, "Please enter your first name.");
            return;
        }
        if (!classCode) {
            showError(code, "Please enter your class code.");
            return;
        }

        // 🔠 Capitalize properly
        const formattedFullName = `${capitalize(surname)}, ${capitalize(firstname)}`;

        try {
            const res = await fetch("/api/student-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullname: formattedFullName,
                    code: classCode,
                }),
            });

            const data = await res.json();

            if (data.success) {
                // ✅ Save and redirect
                localStorage.setItem("student", JSON.stringify(data.student));
                window.location.href = "/student-front.html";
            } else {
                // ❌ Show inline errors
                if (data.field === "code") {
                    showError(code, "Invalid class code. Please try again.");
                } else if (data.field === "fullname") {
                    showError(firstnameInput, "Name not recognized in this class.");
                    showError(surnameInput, "Name not recognized in this class.");
                } else {
                    // Catch-all fallback
                    showError(code, data.message || "Login failed. Please try again.");
                }
            }
        } catch (err) {
            console.error("❌ Connection error:", err);
            showError(code, "Unable to connect to the server. Try again later.");
        }
    }

    // Helper function to capitalize first letter
    function capitalize(str) {
        return str
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }
});

async function loginTeacher(email, password) {
    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        
        if (data.success) {
            // ✅ Save teacher info to localStorage
            localStorage.setItem("teacher", JSON.stringify(data.teacher));

            // Reload the page or call class loading
            window.location.reload();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("Login failed. Try again.");
    }
}

// SCROLL REVEAL
const sections = document.querySelectorAll('.second-section');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    } else {
      entry.target.classList.remove('visible');
    }
  });
}, { threshold: 0.5 });

sections.forEach(section => {
  observer.observe(section);
});
