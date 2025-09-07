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
registerSubmit.addEventListener('click', function (e) {
  e.preventDefault();
  alert("Registration Submitted ✅ (replace with your logic)");
  registerModel.style.display = 'none';
  document.querySelector('.login-model').style.display = 'block';
});
var loginSubmit = document.getElementById('loginSubmit');
loginSubmit.addEventListener('click', function (e) {
  e.preventDefault();

  if (loginForms.classList.contains('teacher-active')) {
    // change it soon when database is ready
    window.location.href = "../../Front-end/html/teacher-front.html";
  } else if (loginForms.classList.contains('student-active')) {
    // change it soon when database is ready
    window.location.href = "../../Front-end/html/student-front.html";
  }
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