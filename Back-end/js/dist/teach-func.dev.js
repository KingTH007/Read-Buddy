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
            return _context.abrupt("return", data.questions);

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
  }

  fileInput.addEventListener('change', function _callee2(e) {
    var file, fileReader;
    return regeneratorRuntime.async(function _callee2$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            file = e.target.files[0];

            if (file && file.type === "application/pdf") {
              overlay.style.display = "block";
              overlapModal.style.display = "block";
              fileReader = new FileReader();

              fileReader.onload = function _callee() {
                var typedarray, pdf, fullText, i, page, textContent, pageText, titleGuess, keyword, questions;
                return regeneratorRuntime.async(function _callee$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        typedarray = new Uint8Array(this.result); // Load PDF

                        _context2.next = 3;
                        return regeneratorRuntime.awrap(pdfjsLib.getDocument(typedarray).promise);

                      case 3:
                        pdf = _context2.sent;
                        fullText = ""; // Extract text from all pages

                        i = 1;

                      case 6:
                        if (!(i <= pdf.numPages)) {
                          _context2.next = 18;
                          break;
                        }

                        _context2.next = 9;
                        return regeneratorRuntime.awrap(pdf.getPage(i));

                      case 9:
                        page = _context2.sent;
                        _context2.next = 12;
                        return regeneratorRuntime.awrap(page.getTextContent());

                      case 12:
                        textContent = _context2.sent;
                        pageText = textContent.items.map(function (item) {
                          return item.str;
                        }).join(" ");
                        fullText += pageText + "\n";

                      case 15:
                        i++;
                        _context2.next = 6;
                        break;

                      case 18:
                        // Generate title (first sentence or first 8 words)
                        titleGuess = fullText.split(/[.!?]/)[0];
                        titleGuess = titleGuess.split(" ").slice(0, 8).join(" "); // Generate placeholder image based on first keyword

                        keyword = titleGuess.split(" ")[0] || "story";
                        imageUrl = "https://source.unsplash.com/512x512/?".concat(encodeURIComponent(keyword)); // Fill the modal with defaults

                        document.getElementById("title").value = titleGuess;
                        document.getElementById("context").value = fullText.trim(); // document.querySelector(".over-img img").src = imageUrl;

                        _context2.next = 26;
                        return regeneratorRuntime.awrap(generateQuestionsFromContext(fullText.trim()));

                      case 26:
                        questions = _context2.sent;
                        document.getElementById("questions").value = questions;

                      case 28:
                      case "end":
                        return _context2.stop();
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
            return _context3.stop();
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
  });
});