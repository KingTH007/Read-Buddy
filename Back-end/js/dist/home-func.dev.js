"use strict";

var loginOverlay = document.querySelector('.login-overlay');
var loginForms = document.getElementById('loginForms');
var teacherBtn = document.getElementById('teacherToogle');
var studentBtn = document.getElementById('studentToogle');
var loginBtn = document.querySelector('.login-btn');
var closeBtn = document.getElementById('closeBtn');
var teacherForm = document.getElementById('teacherForm'); // Show overlay with Teacher first

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

closeBtn.addEventListener('click', function () {
  loginOverlay.style.display = 'none';
});