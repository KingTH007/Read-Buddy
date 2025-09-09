"use strict";

// Back-end/js/upload-ai.js
var express = require("express");

var cors = require("cors");

var fetch = require("node-fetch");

var path = require("path");

var app = express();
var PORT = 5000; // Middleware

app.use(cors());
app.use(express.json()); // Serve frontend files

app.use(express["static"](path.join(__dirname, "../../Front-end"))); // API route for generating questions

app.post("/api/generate-questions", function _callee(req, res) {
  var context, url, options, response, data;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          context = req.body.context;

          if (context) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: "No context provided"
          }));

        case 3:
          _context.prev = 3;
          url = "https://chatgpt-42.p.rapidapi.com/gpt4o";
          options = {
            method: "POST",
            headers: {
              "x-rapidapi-key": process.env.RAPIDAPI_KEY,
              "x-rapidapi-host": "chatgpt-42.p.rapidapi.com",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              messages: [{
                role: "user",
                content: "Based on the following story, create 20 multiple-choice comprehension questions. \n                        Each question must have 1 correct answer and 3 wrong answers. \n                        Format them as:\n\n                        Q1: [question]\n                        A) option1\n                        B) option2\n                        C) option3\n                        D) option4\n                        Answer: [letter]\n\n                        STORY:\n                        ".concat(context)
              }],
              web_access: false
            })
          };
          _context.next = 8;
          return regeneratorRuntime.awrap(fetch(url, options));

        case 8:
          response = _context.sent;
          _context.next = 11;
          return regeneratorRuntime.awrap(response.json());

        case 11:
          data = _context.sent;
          res.json({
            questions: data.result || ["No questions generated"]
          });
          _context.next = 19;
          break;

        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](3);
          console.error("❌ RapidAPI Error:", _context.t0);
          res.status(500).json({
            error: "Failed to generate questions"
          });

        case 19:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[3, 15]]);
}); // Start server

app.listen(PORT, function () {
  console.log("\u2705 Server running at http://localhost:".concat(PORT));
});