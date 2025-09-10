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
    loginOverlay.style.display = 'flex';         // show overlay
    loginForms.classList.remove('teacher-active');
    loginForms.classList.add('student-active');  // switch to student login
    teacherBtn.classList.remove('active');
    studentBtn.classList.add('active');
});


// Show overlay with Teacher first
loginBtn.addEventListener('click', () => {
    loginOverlay.style.display = 'flex';
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
});

// Toggle to Student
studentBtn.addEventListener('click', () => {
    loginForms.classList.add('student-active');
    loginForms.classList.remove('teacher-active');
    studentBtn.classList.add('active');
    teacherBtn.classList.remove('active');
});

// Close overlay
closeLogin.addEventListener('click', () => {
    loginOverlay.style.display = 'none';
});
closeRegister.addEventListener('click', () => {
    loginOverlay.style.display = 'none';
});

const registerSubmit = document.getElementById('registerSubmit');
registerSubmit.addEventListener('click', async (e) => {
    e.preventDefault();

    const fullname = document.querySelector('.register-model input[placeholder="Full Name"]').value;
    const email = document.querySelector('.register-model input[placeholder="Email Address"]').value;
    const password = document.querySelector('.register-model input[placeholder="Password"]').value;
    const confirmPassword = document.querySelector('.register-model input[placeholder="Confirm Password"]').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullname, email, password }),
        });

        const data = await response.json();

        if (data.success) {
            alert("Registration successful ✅ Please log in.");
            registerModel.style.display = 'none';
            document.querySelector('.login-model').style.display = 'block';
        } else {
            alert(data.message || "Registration failed.");
        }
    } catch (error) {
        console.error(error);
        alert("Error connecting to server.");
    }
});

const loginSubmit = document.getElementById('loginSubmit');
loginSubmit.addEventListener('click', async (e) => {
    e.preventDefault();

    if (loginForms.classList.contains('teacher-active')) {
        const email = document.querySelector('#teacherOverlay input[placeholder="Email Address"]').value;
        const password = document.querySelector('#teacherOverlay input[placeholder="Password"]').value;

        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                alert("Login successful ✅");
                window.location.href = "../../Front-end/html/teacher-front.html";
            } else {
                alert(data.message || "Invalid email or password.");
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to server.");
        }
    } 
    else if (loginForms.classList.contains('student-active')) {
        window.location.href = "../../Front-end/html/student-front.html";
    }
});

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
