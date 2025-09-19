"use strict";

document.addEventListener('DOMContentLoaded', function _callee7() {
  var fileInput, overlay, overlapModal, cancelBtn, uploadBtn, imageUrl, generateQuestionsFromContext, generateImageFromKeyword, createClassBtn, classOverlay, classOverlap, cancelBtn1, codeInput, createBtn, classListUl, classNameInput, generateClassCode, loadTeacherClasses, socket, classViewOverlay, classViewModal, studentList, closeClassViewBtn, deleteClassBtn, classViewTitle, currentClassCode, openClassView;
  return regeneratorRuntime.async(function _callee7$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          openClassView = function _ref5(classCode, className) {
            var res, data;
            return regeneratorRuntime.async(function openClassView$(_context9) {
              while (1) {
                switch (_context9.prev = _context9.next) {
                  case 0:
                    if (classCode) {
                      _context9.next = 3;
                      break;
                    }

                    console.error("openClassView called without classCode!");
                    return _context9.abrupt("return");

                  case 3:
                    currentClassCode = classCode;
                    classViewTitle.textContent = className;
                    studentList.innerHTML = "";
                    _context9.prev = 6;
                    _context9.next = 9;
                    return regeneratorRuntime.awrap(fetch("http://localhost:5000/get-students/".concat(classCode)));

                  case 9:
                    res = _context9.sent;
                    _context9.next = 12;
                    return regeneratorRuntime.awrap(res.json());

                  case 12:
                    data = _context9.sent;

                    if (data.students) {
                      _context9.next = 16;
                      break;
                    }

                    console.warn("No students found for class", classCode, data);
                    return _context9.abrupt("return");

                  case 16:
                    data.students.forEach(function (student, index) {
                      var tr = document.createElement("tr");
                      tr.innerHTML = "\n                    <td>".concat(index + 1, "</td>\n                    <td>").concat(student.fullname, "</td>\n                    <td>\n                        <div class=\"progress-bar\">\n                            <div class=\"progress-bar-inner\" style=\"width: ").concat(student.progress || 0, "%;\"></div>\n                        </div>\n                        ").concat(student.progress || 0, "%\n                    </td>\n                    <td>\n                        <button class=\"delete-student\" data-id=\"").concat(student.id, "\">\uD83D\uDDD1</button>\n                    </td>\n                ");
                      studentList.appendChild(tr);
                    }); // Open modal

                    classViewOverlay.style.display = "block";
                    classViewModal.style.display = "block"; // Attach delete student handlers

                    document.querySelectorAll(".delete-student").forEach(function (btn) {
                      btn.addEventListener("click", function _callee5(e) {
                        var studentId;
                        return regeneratorRuntime.async(function _callee5$(_context8) {
                          while (1) {
                            switch (_context8.prev = _context8.next) {
                              case 0:
                                studentId = e.target.dataset.id;

                                if (!confirm("Delete this student?")) {
                                  _context8.next = 5;
                                  break;
                                }

                                _context8.next = 4;
                                return regeneratorRuntime.awrap(fetch("http://localhost:5000/delete-student/".concat(studentId), {
                                  method: "DELETE"
                                }));

                              case 4:
                                openClassView(currentClassCode, className); // reload list

                              case 5:
                              case "end":
                                return _context8.stop();
                            }
                          }
                        });
                      });
                    });
                    _context9.next = 25;
                    break;

                  case 22:
                    _context9.prev = 22;
                    _context9.t0 = _context9["catch"](6);
                    console.error("Error fetching students:", _context9.t0);

                  case 25:
                  case "end":
                    return _context9.stop();
                }
              }
            }, null, null, [[6, 22]]);
          };

          loadTeacherClasses = function _ref4() {
            var teacher, res, data, classes, container;
            return regeneratorRuntime.async(function loadTeacherClasses$(_context6) {
              while (1) {
                switch (_context6.prev = _context6.next) {
                  case 0:
                    teacher = JSON.parse(localStorage.getItem("teacher"));

                    if (!(!teacher || !teacher.id)) {
                      _context6.next = 4;
                      break;
                    }

                    console.error("No teacher found in localStorage");
                    return _context6.abrupt("return");

                  case 4:
                    _context6.prev = 4;
                    _context6.next = 7;
                    return regeneratorRuntime.awrap(fetch("http://localhost:5000/get-classes/".concat(teacher.id)));

                  case 7:
                    res = _context6.sent;
                    _context6.next = 10;
                    return regeneratorRuntime.awrap(res.json());

                  case 10:
                    data = _context6.sent;
                    console.log("API response:", data);
                    classes = Array.isArray(data) ? data : data.classes || []; // ✅ fix here: use class-list-ul

                    container = document.getElementById("class-list-ul");
                    container.innerHTML = "";
                    classes.forEach(function (cls) {
                      var li = document.createElement("li");
                      li.classList.add("class-card"); // ✅ store classCode and className in dataset

                      li.dataset.classCode = cls.code;
                      li.dataset.className = cls.name;
                      li.innerHTML = "\n                    <h3>".concat(cls.name, "</h3>\n                    <p>\n                        Class Code: \n                        <span class=\"class-code\" data-code=\"").concat(cls.code, "\">****</span>\n                        <button class=\"toggle-code\" aria-label=\"Toggle Code Visibility\">\n                            <i class=\"fa fa-eye\"></i>\n                        </button>\n                    </p>\n                    <p>Students: <span class=\"student-count\">").concat(cls.no_students, "</span></p>\n                ");
                      container.appendChild(li); // toggle show/hide class code

                      var toggleBtn = li.querySelector(".toggle-code");
                      var codeSpan = li.querySelector(".class-code");
                      var isHidden = true;
                      toggleBtn.addEventListener("click", function (e) {
                        e.stopPropagation(); // ✅ prevent triggering class view when clicking eye button

                        if (isHidden) {
                          codeSpan.textContent = codeSpan.dataset.code;
                          toggleBtn.innerHTML = "<i class=\"fa fa-eye-slash\"></i>";
                        } else {
                          codeSpan.textContent = "****";
                          toggleBtn.innerHTML = "<i class=\"fa fa-eye\"></i>";
                        }

                        isHidden = !isHidden;
                      }); // ✅ add click event for opening class view

                      li.addEventListener("click", function () {
                        var classCode = parseInt(li.dataset.classCode, 10);

                        if (!classCode) {
                          console.error("Class code missing!", li.dataset);
                          return;
                        }

                        openClassView(classCode, li.dataset.className);
                      });
                    });
                    _context6.next = 21;
                    break;

                  case 18:
                    _context6.prev = 18;
                    _context6.t0 = _context6["catch"](4);
                    console.error("Error loading classes:", _context6.t0);

                  case 21:
                  case "end":
                    return _context6.stop();
                }
              }
            }, null, null, [[4, 18]]);
          };

          generateClassCode = function _ref3() {
            return Math.floor(1000 + Math.random() * 9000);
          };

          generateImageFromKeyword = function _ref2(keyword) {
            var response, data;
            return regeneratorRuntime.async(function generateImageFromKeyword$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    _context2.prev = 0;
                    _context2.next = 3;
                    return regeneratorRuntime.awrap(fetch("http://localhost:5000/api/generate-image", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({
                        image_url: "https://source.unsplash.com/512x512/?cat" // example

                      })
                    }));

                  case 3:
                    response = _context2.sent;
                    _context2.next = 6;
                    return regeneratorRuntime.awrap(response.json());

                  case 6:
                    data = _context2.sent;
                    console.log("AI Image Generated:", data.generatedImage);
                    _context2.next = 14;
                    break;

                  case 10:
                    _context2.prev = 10;
                    _context2.t0 = _context2["catch"](0);
                    console.error("Error generating image:", _context2.t0);
                    return _context2.abrupt("return", "https://source.unsplash.com/512x512/?".concat(encodeURIComponent(keyword)));

                  case 14:
                  case "end":
                    return _context2.stop();
                }
              }
            }, null, null, [[0, 10]]);
          };

          generateQuestionsFromContext = function _ref(context) {
            var response, data;
            return regeneratorRuntime.async(function generateQuestionsFromContext$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.prev = 0;
                    _context.next = 3;
                    return regeneratorRuntime.awrap(fetch("http://localhost:5000/api/generate-questions", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({
                        context: context
                      })
                    }));

                  case 3:
                    response = _context.sent;
                    _context.next = 6;
                    return regeneratorRuntime.awrap(response.json());

                  case 6:
                    data = _context.sent;
                    return _context.abrupt("return", data.questions || "No questions generated.");

                  case 10:
                    _context.prev = 10;
                    _context.t0 = _context["catch"](0);
                    console.error("Error fetching questions:", _context.t0);
                    return _context.abrupt("return", "Failed to generate questions. Please try again.");

                  case 14:
                  case "end":
                    return _context.stop();
                }
              }
            }, null, null, [[0, 10]]);
          };

          fileInput = document.getElementById('file');
          overlay = document.querySelector('.overlay-color');
          overlapModal = document.querySelector('.overlap');
          cancelBtn = document.getElementById('overlap-cancel');
          uploadBtn = document.getElementById('overlap-upload');
          imageUrl = ""; // Function to generate questions using OpenAI

          fileInput.addEventListener('change', function _callee2(e) {
            var file, fileReader;
            return regeneratorRuntime.async(function _callee2$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    file = e.target.files[0];

                    if (file && file.type === "application/pdf") {
                      overlay.style.display = "block";
                      overlapModal.style.display = "block";
                      fileReader = new FileReader();

                      fileReader.onload = function _callee() {
                        var typedarray, pdf, fullText, i, page, textContent, pageText, titleGuess, keyword, questions;
                        return regeneratorRuntime.async(function _callee$(_context3) {
                          while (1) {
                            switch (_context3.prev = _context3.next) {
                              case 0:
                                typedarray = new Uint8Array(this.result); // Load PDF

                                _context3.next = 3;
                                return regeneratorRuntime.awrap(pdfjsLib.getDocument(typedarray).promise);

                              case 3:
                                pdf = _context3.sent;
                                fullText = ""; // Extract text from all pages

                                i = 1;

                              case 6:
                                if (!(i <= pdf.numPages)) {
                                  _context3.next = 18;
                                  break;
                                }

                                _context3.next = 9;
                                return regeneratorRuntime.awrap(pdf.getPage(i));

                              case 9:
                                page = _context3.sent;
                                _context3.next = 12;
                                return regeneratorRuntime.awrap(page.getTextContent());

                              case 12:
                                textContent = _context3.sent;
                                pageText = textContent.items.map(function (item) {
                                  return item.str;
                                }).join(" ");
                                fullText += pageText + "\n";

                              case 15:
                                i++;
                                _context3.next = 6;
                                break;

                              case 18:
                                // Generate title (first sentence or first 8 words)
                                titleGuess = fullText.split(/[.!?]/)[0];
                                titleGuess = titleGuess.split(" ").slice(0, 8).join(" "); // Generate placeholder image based on first keyword

                                keyword = titleGuess.split(" ")[0] || "story";
                                _context3.next = 23;
                                return regeneratorRuntime.awrap(generateImageFromKeyword(keyword));

                              case 23:
                                imageUrl = _context3.sent;
                                // Fill the modal with defaults
                                document.getElementById("title").value = titleGuess;
                                document.getElementById("context").value = fullText.trim();
                                document.querySelector(".over-img img").src = imageUrl;
                                _context3.next = 29;
                                return regeneratorRuntime.awrap(generateQuestionsFromContext(fullText.trim()));

                              case 29:
                                questions = _context3.sent;
                                document.getElementById("questions").value = questions;

                              case 31:
                              case "end":
                                return _context3.stop();
                            }
                          }
                        }, null, this);
                      };

                      fileReader.readAsArrayBuffer(file);
                    } else {
                      alert("Please upload a valid PDF file.");
                      fileInput.value = '';
                    }

                  case 2:
                  case "end":
                    return _context4.stop();
                }
              }
            });
          }); // Upload button handler (reads updated values)

          uploadBtn.addEventListener('click', function () {
            var editedTitle = document.getElementById("title").value;
            var editedContext = document.getElementById("context").value; // Create new story card

            var newStory = document.createElement("div");
            newStory.classList.add("story", "show");
            newStory.innerHTML = "\n            <div class=\"story-image\">\n                <img src=\"".concat(imageUrl, "\" alt=\"Story Image\" />\n            </div>\n            <p>").concat(editedTitle, "</p>\n            <button class=\"button\">Read Now</button>\n        "); // Append to the activity card container

            document.querySelector(".act-card").appendChild(newStory); // Optionally log the full context in console

            console.log("Uploaded Story:", {
              title: editedTitle,
              context: editedContext
            }); // Hide modal

            overlay.style.display = "none";
            overlapModal.style.display = "none";
          });
          cancelBtn.addEventListener('click', function () {
            overlay.style.display = "none";
            overlapModal.style.display = "none";
            fileInput.value = ''; // reset file input
          }); // Create Class Section

          createClassBtn = document.getElementById("create-class-btn");
          classOverlay = document.querySelector(".class-overlay-color");
          classOverlap = document.querySelector(".class-overlap");
          cancelBtn1 = document.getElementById("class-overlap-cancel");
          codeInput = document.getElementById("class-code");
          createBtn = document.getElementById("class-overlap-create");
          classListUl = document.getElementById("class-list-ul");
          classNameInput = document.getElementById("class-name"); // Generate random 4-digit class code

          // Open modal
          createClassBtn.addEventListener("click", function () {
            codeInput.value = generateClassCode(); // Auto-generate code

            classOverlay.style.display = "block";
            classOverlap.style.display = "block";
          }); // Close modal

          cancelBtn1.addEventListener("click", function () {
            classOverlay.style.display = "none";
            classOverlap.style.display = "none";
          });
          classOverlay.addEventListener("click", function () {
            classOverlay.style.display = "none";
            classOverlap.style.display = "none";
          }); // Create new class on click

          createBtn.addEventListener("click", function _callee3() {
            var className, classCode, teacherData, teacherId, response, data, li, toggleBtn, codeSpan, isHidden;
            return regeneratorRuntime.async(function _callee3$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    className = classNameInput.value.trim();
                    classCode = codeInput.value;

                    if (!(className === "")) {
                      _context5.next = 5;
                      break;
                    }

                    alert("Please enter a class name!");
                    return _context5.abrupt("return");

                  case 5:
                    teacherData = JSON.parse(localStorage.getItem("teacher"));

                    if (teacherData) {
                      _context5.next = 9;
                      break;
                    }

                    alert("Please log in again. Teacher not found.");
                    return _context5.abrupt("return");

                  case 9:
                    teacherId = teacherData.id;
                    _context5.prev = 10;
                    _context5.next = 13;
                    return regeneratorRuntime.awrap(fetch("http://localhost:5000/create-class", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({
                        name: className,
                        code: classCode,
                        teacher_id: teacherId
                      })
                    }));

                  case 13:
                    response = _context5.sent;
                    _context5.next = 16;
                    return regeneratorRuntime.awrap(response.json());

                  case 16:
                    data = _context5.sent;

                    if (data.success) {
                      alert("Class Created ✅ with Code: " + data["class"].code);
                      li = document.createElement("li");
                      li.classList.add("class-card");
                      li.innerHTML = "\n                    <h3>".concat(data["class"].name, "</h3>\n                    <p>\n                        Class Code: \n                        <span class=\"class-code\" data-code=\"").concat(data["class"].code, "\">****</span>\n                        <button class=\"toggle-code\" aria-label=\"Toggle Code Visibility\">\n                            <i class=\"fa fa-eye\"></i>\n                        </button>\n                    </p>\n                    <p>Students: <span class=\"student-count\">").concat(data["class"].no_students, "</span></p>\n                ");
                      classListUl.appendChild(li);
                      classNameInput.value = "";
                      classOverlay.style.display = "none";
                      classOverlap.style.display = "none";
                      toggleBtn = li.querySelector(".toggle-code");
                      codeSpan = li.querySelector(".class-code");
                      isHidden = true;
                      toggleBtn.addEventListener("click", function (e) {
                        e.stopPropagation(); // ✅ prevent triggering openClassView

                        if (isHidden) {
                          codeSpan.textContent = codeSpan.dataset.code;
                          toggleBtn.innerHTML = "<i class=\"fa fa-eye-slash\"></i>";
                        } else {
                          codeSpan.textContent = "****";
                          toggleBtn.innerHTML = "<i class=\"fa fa-eye\"></i>";
                        }

                        isHidden = !isHidden;
                      });
                    } else {
                      alert("Error: " + data.message);
                    }

                    _context5.next = 24;
                    break;

                  case 20:
                    _context5.prev = 20;
                    _context5.t0 = _context5["catch"](10);
                    console.error("Error creating class:", _context5.t0);
                    alert("Failed to create class. Please try again.");

                  case 24:
                  case "end":
                    return _context5.stop();
                }
              }
            }, null, null, [[10, 20]]);
          }); // Function to load teacher’s classes

          // Load teacher classes on page load
          window.addEventListener("DOMContentLoaded", function _callee4() {
            var teacher;
            return regeneratorRuntime.async(function _callee4$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    teacher = JSON.parse(localStorage.getItem("teacher"));

                    if (!teacher) {
                      _context7.next = 6;
                      break;
                    }

                    _context7.next = 4;
                    return regeneratorRuntime.awrap(loadTeacherClasses(teacher.id));

                  case 4:
                    _context7.next = 7;
                    break;

                  case 6:
                    console.log("No teacher found in localStorage.");

                  case 7:
                  case "end":
                    return _context7.stop();
                }
              }
            });
          });
          socket = io("http://localhost:5000");
          socket.on("student-joined", function (data) {
            console.log("Student joined class:", data.code);
            var teacher = JSON.parse(localStorage.getItem("teacher"));

            if (teacher) {
              loadTeacherClasses(teacher.id); // ✅ pass teacherId
            }
          });
          document.getElementById("logout-btn").addEventListener("click", function () {
            localStorage.removeItem("teacher");
            window.location.reload();
            window.location.href = "../../Front-end/html/home-page.html"; // Clear UI
          }); // Class View Overlay Elements

          classViewOverlay = document.querySelector(".class-view-overlay");
          classViewModal = document.querySelector(".class-view-modal");
          studentList = document.getElementById("student-list");
          closeClassViewBtn = document.getElementById("close-class-view");
          deleteClassBtn = document.getElementById("delete-class-btn");
          classViewTitle = document.getElementById("class-view-title");
          currentClassCode = null; // Function to open class view

          // Close modal
          closeClassViewBtn.addEventListener("click", function () {
            classViewOverlay.style.display = "none";
            classViewModal.style.display = "none";
          }); // Delete class

          deleteClassBtn.addEventListener("click", function _callee6() {
            return regeneratorRuntime.async(function _callee6$(_context10) {
              while (1) {
                switch (_context10.prev = _context10.next) {
                  case 0:
                    if (!confirm("Are you sure you want to delete this class?")) {
                      _context10.next = 6;
                      break;
                    }

                    _context10.next = 3;
                    return regeneratorRuntime.awrap(fetch("http://localhost:5000/delete-class/".concat(currentClassCode), {
                      method: "DELETE"
                    }));

                  case 3:
                    classViewOverlay.style.display = "none";
                    classViewModal.style.display = "none";
                    loadTeacherClasses(); // reload classes

                  case 6:
                  case "end":
                    return _context10.stop();
                }
              }
            });
          });

        case 39:
        case "end":
          return _context11.stop();
      }
    }
  });
});