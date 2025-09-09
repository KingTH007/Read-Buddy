"use strict";

document.addEventListener('DOMContentLoaded', function () {
  var fileInput = document.getElementById('file');
  var overlay = document.querySelector('.overlay-color');
  var overlapModal = document.querySelector('.overlap');
  var cancelBtn = document.getElementById('overlap-cancel');
  var uploadBtn = document.getElementById('overlap-upload');
  var imageUrl = ""; // Function to generate questions using OpenAI

  function generateQuestionsFromContext(context) {
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
  } // Function to generate AI image using backend


  function generateImageFromKeyword(keyword) {
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
  }

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
  }); //create class
  // Elements

  var createClassBtn = document.getElementById("create-class-btn");
  var classOverlay = document.querySelector(".class-overlay-color");
  var classOverlap = document.querySelector(".class-overlap");
  var cancelBtn1 = document.getElementById("class-overlap-cancel");
  var codeInput = document.getElementById("class-code");
  var createBtn = document.getElementById("class-overlap-create");
  var classListUl = document.getElementById("class-list-ul");
  var classNameInput = document.getElementById("class-name"); // Function: Generate random class code

  function generateClassCode() {
    return Math.floor(1000 + Math.random() * 9000); // ensures it’s always 4 digits (1000–9999)
  }

  document.addEventListener("DOMContentLoaded", function () {
    var codeField = document.getElementById("class-code");
    codeField.value = generateClassCode();
  }); // Example: regenerate code every time "CREATE NEW CLASS" section appears

  document.getElementById("class-overlap-create").addEventListener("click", function () {
    alert("Class Created ✅ with Code: " + document.getElementById("class-code").value);
  }); // Open modal

  createClassBtn.addEventListener("click", function () {
    codeInput.value = generateClassCode(); // Auto-generate code

    classOverlay.style.display = "block";
    classOverlap.style.display = "block";
  }); // Close modal (cancel button or background click)

  cancelBtn1.addEventListener("click", function () {
    classOverlay.style.display = "none";
    classOverlap.style.display = "none";
  });
  classOverlay.addEventListener("click", function () {
    classOverlay.style.display = "none";
    classOverlap.style.display = "none";
  }); // Create new class on click

  createBtn.addEventListener("click", function () {
    var className = classNameInput.value.trim();
    var classCode = codeInput.value;

    if (className === "") {
      alert("Please enter a class name!");
      return;
    } // Create list item


    var li = document.createElement("li");
    li.classList.add("class-card");
    li.innerHTML = "\n            <h3>".concat(className, "</h3>\n            <p>\n                Class Code: \n                <span class=\"class-code\" data-code=\"").concat(classCode, "\">****</span>\n                <button class=\"toggle-code\" aria-label=\"Toggle Code Visibility\">\n                    <i class=\"fa fa-eye\"></i>\n                </button>\n            </p>\n            <p>Students: <span class=\"student-count\">0</span></p>\n        "); // Append to class list

    classListUl.appendChild(li); // Reset form & close modal

    classNameInput.value = "";
    classOverlay.style.display = "none";
    classOverlap.style.display = "none"; // Add toggle functionality for code

    var toggleBtn = li.querySelector(".toggle-code");
    var codeSpan = li.querySelector(".class-code");
    var isHidden = true;
    toggleBtn.addEventListener("click", function () {
      if (isHidden) {
        codeSpan.textContent = codeSpan.dataset.code; // show real code

        toggleBtn.innerHTML = "<i class=\"fa fa-eye-slash\"></i>"; // eye-slash icon
      } else {
        codeSpan.textContent = "****"; // hide as asterisks

        toggleBtn.innerHTML = "<i class=\"fa fa-eye\"></i>"; // eye icon
      }

      isHidden = !isHidden;
    });
  });
});