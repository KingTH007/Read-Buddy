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

// Helper: show error message beside input
function showError(input, message) {
    input.classList.add("error");
    const errorSpan = input.nextElementSibling;
    if (errorSpan) errorSpan.textContent = message;
}

// Helper: clear error
function clearError(input) {
    input.classList.remove("error");
    const errorSpan = input.nextElementSibling;
    if (errorSpan) errorSpan.textContent = "";
}

const registerSubmit = document.getElementById('registerSubmit');
registerSubmit.addEventListener('click', async (e) => {
    e.preventDefault();

    const fullname = document.getElementById("regName");
    const email = document.getElementById("regEmail");
    const password = document.getElementById("regPassword");
    const confirmPassword = document.getElementById("regConfirm");

    // Clear previous errors
    [fullname, email, password, confirmPassword].forEach(clearError);

    if (password.value !== confirmPassword.value) {
        showError(confirmPassword, "Passwords do not match!");
        return;
    }

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullname: fullname.value, email: email.value, password: password.value }),
        });

        const data = await response.json();

        if (data.success) {
            alert("Registration successful ✅ Please log in.");
            registerModel.style.display = 'none';
            document.querySelector('.login-model').style.display = 'block';
        } else {
            if (data.field === "email") {
                showError(email, "This email has been used, please use another.");
            } else if (data.field === "password") {
                showError(password, "Password is too weak.");
            } else {
                alert(data.message || "Registration failed.");
            }
        }
    } catch (error) {
        console.error(error);
        alert("Error connecting to server.");
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
                window.location.href = "../../Front-end/html/teacher-front.html";
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
        // Student login
        const surnameInput = document.getElementById("studentSurname");
        const firstnameInput = document.getElementById("studentFirstname");
        const code = document.getElementById("classCode");

        [surnameInput, firstnameInput, code].forEach(clearError);

        const surname = surnameInput.value.trim();
        const firstname = firstnameInput.value.trim();

        if (!surname || !firstname || !code.value.trim()) {
            alert("Please enter your surname, first name, and class code.");
            return;
        }

        // 🔠 Capitalize first letters (for display)
        const formattedFullName = `${capitalize(surname)}, ${capitalize(firstname)}`;

        try {
            const res = await fetch("/api/student-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullname: formattedFullName,
                    code: code.value.trim(),
                }),
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem("student", JSON.stringify(data.student));
                window.location.href = "../../Front-end/html/student-front.html";
            } else {
                if (data.field === "code") {
                    showError(code, "Invalid class code.");
                } else {
                    alert(data.message || "Login failed.");
                }
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to server.");
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
