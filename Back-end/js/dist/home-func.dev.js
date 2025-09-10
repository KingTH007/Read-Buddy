"use strict";

var loginOverlay = document.querySelector('.login-overlay');
var loginForms = document.getElementById('loginForms');
var teacherBtn = document.getElementById('teacherToogle');
var studentBtn = document.getElementById('studentToogle');
var loginBtn = document.querySelector('.login-btn');
var closeLogin = document.getElementById('closeLogin');
var teacherForm = document.getElementById('teacherForm');
var loginModel = document.querySelector('.login-model');
var registerModel = document.querySelector('.register-model');
var signupLink = document.querySelector('#teacherOverlay .signup-text span');
var backToLogin = document.getElementById('backToLogin');
var closeRegister = document.getElementById('closeRegister');
var studentLogin = document.querySelector('.student-btn'); // Show Register when clicking "Sign up here!"

signupLink.addEventListener('click', function () {
  loginModel.style.display = 'none';
  registerModel.style.display = 'block';
}); // Back to Login

backToLogin.addEventListener('click', function () {
  registerModel.style.display = 'none';
  loginModel.style.display = 'block';
});
studentLogin.addEventListener('click', function () {
  loginOverlay.style.display = 'flex'; // show overlay

  loginForms.classList.remove('teacher-active');
  loginForms.classList.add('student-active'); // switch to student login

  teacherBtn.classList.remove('active');
  studentBtn.classList.add('active');
}); // Show overlay with Teacher first

loginBtn.addEventListener('click', function () {
  loginOverlay.style.display = 'flex';
  loginForms.classList.add('teacher-active');
  loginForms.classList.remove('student-active');
  teacherBtn.classList.add('active');
  studentBtn.classList.remove('active');
}); // Toggle to Teacher

teacherBtn.addEventListener('click', function () {
  loginForms.classList.add('teacher-active');
  loginForms.classList.remove('student-active');
  teacherBtn.classList.add('active');
  studentBtn.classList.remove('active');
}); // Toggle to Student

studentBtn.addEventListener('click', function () {
  loginForms.classList.add('student-active');
  loginForms.classList.remove('teacher-active');
  studentBtn.classList.add('active');
  teacherBtn.classList.remove('active');
}); // Close overlay

closeLogin.addEventListener('click', function () {
  loginOverlay.style.display = 'none';
});
closeRegister.addEventListener('click', function () {
  loginOverlay.style.display = 'none';
});
var registerSubmit = document.getElementById('registerSubmit');
registerSubmit.addEventListener('click', function _callee(e) {
  var fullname, email, password, confirmPassword, response, data;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          e.preventDefault();
          fullname = document.querySelector('.register-model input[placeholder="Full Name"]').value;
          email = document.querySelector('.register-model input[placeholder="Email Address"]').value;
          password = document.querySelector('.register-model input[placeholder="Password"]').value;
          confirmPassword = document.querySelector('.register-model input[placeholder="Confirm Password"]').value;

          if (!(password !== confirmPassword)) {
            _context.next = 8;
            break;
          }

          alert("Passwords do not match!");
          return _context.abrupt("return");

        case 8:
          _context.prev = 8;
          _context.next = 11;
          return regeneratorRuntime.awrap(fetch("http://localhost:5000/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              fullname: fullname,
              email: email,
              password: password
            })
          }));

        case 11:
          response = _context.sent;
          _context.next = 14;
          return regeneratorRuntime.awrap(response.json());

        case 14:
          data = _context.sent;

          if (data.success) {
            alert("Registration successful ✅ Please log in.");
            registerModel.style.display = 'none';
            document.querySelector('.login-model').style.display = 'block';
          } else {
            alert(data.message || "Registration failed.");
          }

          _context.next = 22;
          break;

        case 18:
          _context.prev = 18;
          _context.t0 = _context["catch"](8);
          console.error(_context.t0);
          alert("Error connecting to server.");

        case 22:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[8, 18]]);
});
var loginSubmit = document.getElementById('loginSubmit');
loginSubmit.addEventListener('click', function _callee2(e) {
  var email, password, response, data;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          e.preventDefault();

          if (!loginForms.classList.contains('teacher-active')) {
            _context2.next = 20;
            break;
          }

          email = document.querySelector('#teacherOverlay input[placeholder="Email Address"]').value;
          password = document.querySelector('#teacherOverlay input[placeholder="Password"]').value;
          _context2.prev = 4;
          _context2.next = 7;
          return regeneratorRuntime.awrap(fetch("http://localhost:5000/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: email,
              password: password
            })
          }));

        case 7:
          response = _context2.sent;
          _context2.next = 10;
          return regeneratorRuntime.awrap(response.json());

        case 10:
          data = _context2.sent;

          if (data.success) {
            alert("Login successful ✅");
            window.location.href = "../../Front-end/html/teacher-front.html";
          } else {
            alert(data.message || "Invalid email or password.");
          }

          _context2.next = 18;
          break;

        case 14:
          _context2.prev = 14;
          _context2.t0 = _context2["catch"](4);
          console.error(_context2.t0);
          alert("Error connecting to server.");

        case 18:
          _context2.next = 21;
          break;

        case 20:
          if (loginForms.classList.contains('student-active')) {
            window.location.href = "../../Front-end/html/student-front.html";
          }

        case 21:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[4, 14]]);
}); // SCROLL REVEAL

var sections = document.querySelectorAll('.second-section');
var observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    } else {
      entry.target.classList.remove('visible');
    }
  });
}, {
  threshold: 0.5
});
sections.forEach(function (section) {
  observer.observe(section);
});