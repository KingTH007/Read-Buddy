"use strict";

// Back-end/js/server.js
require("dotenv").config();

var express = require("express");

var cors = require("cors");

var fetch = require("node-fetch");

var path = require("path");

var bodyParser = require("body-parser");

var bcrypt = require("bcrypt");

var _require = require("pg"),
    Pool = _require.Pool;

var http = require("http");

var _require2 = require("socket.io"),
    Server = _require2.Server;

var app = express();
var PORT = 5000;
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express["static"](path.join(__dirname, "../../Front-end"))); // HTTP + Socket server

var server = http.createServer(app);
var io = new Server(server, {
  cors: {
    origin: "*"
  }
}); // ===================================================
// 🔹 DATABASE SECTION (PostgreSQL)
// ===================================================

var pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "readbuddyDB",
  password: "errorsyntax0!",
  port: 5432
});
/**
 * Teacher Registration
 */

app.post("/register", function _callee(req, res) {
  var _req$body, fullname, email, password, existing, hashedPassword, newTeacher;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, fullname = _req$body.fullname, email = _req$body.email, password = _req$body.password;
          _context.next = 4;
          return regeneratorRuntime.awrap(pool.query("SELECT * FROM teachers WHERE email = $1", [email]));

        case 4:
          existing = _context.sent;

          if (!(existing.rows.length > 0)) {
            _context.next = 7;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            success: false,
            field: "email",
            message: "This email has been used, please use another."
          }));

        case 7:
          _context.next = 9;
          return regeneratorRuntime.awrap(bcrypt.hash(password, 10));

        case 9:
          hashedPassword = _context.sent;
          _context.next = 12;
          return regeneratorRuntime.awrap(pool.query("INSERT INTO teachers (fullname, email, password) VALUES ($1, $2, $3) RETURNING *", [fullname, email, hashedPassword]));

        case 12:
          newTeacher = _context.sent;
          res.json({
            success: true,
            teacher: newTeacher.rows[0]
          });
          _context.next = 20;
          break;

        case 16:
          _context.prev = 16;
          _context.t0 = _context["catch"](0);
          console.error("❌ Teacher Registration Error:", _context.t0);
          res.status(500).json({
            success: false,
            message: "Registration failed"
          });

        case 20:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 16]]);
});
/**
 * Teacher Login
 */

app.post("/login", function _callee2(req, res) {
  var _req$body2, email, password, teacher, validPassword;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _req$body2 = req.body, email = _req$body2.email, password = _req$body2.password;
          _context2.next = 4;
          return regeneratorRuntime.awrap(pool.query("SELECT * FROM teachers WHERE email = $1", [email]));

        case 4:
          teacher = _context2.sent;

          if (!(teacher.rows.length === 0)) {
            _context2.next = 7;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            success: false,
            field: "email",
            message: "Email not found"
          }));

        case 7:
          _context2.next = 9;
          return regeneratorRuntime.awrap(bcrypt.compare(password, teacher.rows[0].password));

        case 9:
          validPassword = _context2.sent;

          if (validPassword) {
            _context2.next = 12;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            success: false,
            field: "password",
            message: "Incorrect password"
          }));

        case 12:
          res.json({
            success: true,
            teacher: teacher.rows[0]
          });
          _context2.next = 19;
          break;

        case 15:
          _context2.prev = 15;
          _context2.t0 = _context2["catch"](0);
          console.error("❌ Teacher Login Error:", _context2.t0);
          res.status(500).json({
            success: false,
            message: "Login failed"
          });

        case 19:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 15]]);
});
/**
 * Create a Class
 */

app.post("/create-class", function _callee3(req, res) {
  var _req$body3, name, code, teacher_id, existing, newClass;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _req$body3 = req.body, name = _req$body3.name, code = _req$body3.code, teacher_id = _req$body3.teacher_id;
          _context3.next = 4;
          return regeneratorRuntime.awrap(pool.query("SELECT * FROM class WHERE code = $1", [code]));

        case 4:
          existing = _context3.sent;

          if (!(existing.rows.length > 0)) {
            _context3.next = 7;
            break;
          }

          return _context3.abrupt("return", res.status(400).json({
            success: false,
            message: "Class code already exists."
          }));

        case 7:
          _context3.next = 9;
          return regeneratorRuntime.awrap(pool.query("INSERT INTO class (code, name, teacher_id) VALUES ($1, $2, $3) RETURNING *", [code, name, teacher_id]));

        case 9:
          newClass = _context3.sent;
          res.json({
            success: true,
            "class": newClass.rows[0]
          });
          _context3.next = 17;
          break;

        case 13:
          _context3.prev = 13;
          _context3.t0 = _context3["catch"](0);
          console.error("❌ Create Class Error:", _context3.t0);
          res.status(500).json({
            success: false,
            message: "Failed to create class"
          });

        case 17:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 13]]);
});
/**
 * Student Login (auto-register if new)
 */

app.post("/student-login", function _callee4(req, res) {
  var _req$body4, fullname, code, classExists, student;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _req$body4 = req.body, fullname = _req$body4.fullname, code = _req$body4.code;
          _context4.next = 4;
          return regeneratorRuntime.awrap(pool.query("SELECT * FROM class WHERE code = $1", [code]));

        case 4:
          classExists = _context4.sent;

          if (!(classExists.rows.length === 0)) {
            _context4.next = 7;
            break;
          }

          return _context4.abrupt("return", res.status(400).json({
            success: false,
            field: "code",
            message: "Invalid class code"
          }));

        case 7:
          _context4.next = 9;
          return regeneratorRuntime.awrap(pool.query("SELECT * FROM students WHERE fullname = $1 AND code = $2", [fullname, code]));

        case 9:
          student = _context4.sent;

          if (!(student.rows.length === 0)) {
            _context4.next = 17;
            break;
          }

          _context4.next = 13;
          return regeneratorRuntime.awrap(pool.query("INSERT INTO students (fullname, code) VALUES ($1, $2) RETURNING *", [fullname, code]));

        case 13:
          student = _context4.sent;
          _context4.next = 16;
          return regeneratorRuntime.awrap(pool.query("UPDATE class SET no_students = no_students + 1 WHERE code = $1", [code]));

        case 16:
          io.emit("student-joined", {
            code: code
          });

        case 17:
          res.json({
            success: true,
            student: student.rows[0]
          });
          _context4.next = 24;
          break;

        case 20:
          _context4.prev = 20;
          _context4.t0 = _context4["catch"](0);
          console.error("❌ Student Login Error:", _context4.t0.message);
          res.status(500).json({
            success: false,
            message: "Student login failed"
          });

        case 24:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 20]]);
});
/**
 * Get all classes for a teacher
 */

app.get("/get-classes/:teacher_id", function _callee5(req, res) {
  var teacher_id, classes;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          teacher_id = req.params.teacher_id;
          _context5.next = 4;
          return regeneratorRuntime.awrap(pool.query("SELECT * FROM class WHERE teacher_id = $1 ORDER BY code DESC", [teacher_id]));

        case 4:
          classes = _context5.sent;
          res.json({
            success: true,
            classes: classes.rows
          });
          _context5.next = 12;
          break;

        case 8:
          _context5.prev = 8;
          _context5.t0 = _context5["catch"](0);
          console.error("❌ Fetch Classes Error:", _context5.t0.message);
          res.status(500).json({
            success: false,
            message: "Failed to fetch classes"
          });

        case 12:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 8]]);
}); // ===================================================
// 🔹 AI SECTION (RapidAPI GPT + Ghibli Image)
// ===================================================

/**
 * Generate AI Questions
 */

app.post("/api/generate-questions", function _callee6(req, res) {
  var context, url, options, response, data;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          context = req.body.context;

          if (context) {
            _context6.next = 3;
            break;
          }

          return _context6.abrupt("return", res.status(400).json({
            error: "No context provided"
          }));

        case 3:
          _context6.prev = 3;
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
                content: "Based on the following story, create 20 multiple-choice comprehension questions. \n                      Each question must have 1 correct answer and 3 wrong answers.\n                      Format them as:\n\n                      Q1: [question]\n                      A) option1\n                      B) option2\n                      C) option3\n                      D) option4\n                      Answer: [letter]\n\n                      STORY:\n                      ".concat(context)
              }],
              web_access: false
            })
          };
          _context6.next = 8;
          return regeneratorRuntime.awrap(fetch(url, options));

        case 8:
          response = _context6.sent;
          _context6.next = 11;
          return regeneratorRuntime.awrap(response.json());

        case 11:
          data = _context6.sent;
          res.json({
            questions: data.result || ["No questions generated"]
          });
          _context6.next = 19;
          break;

        case 15:
          _context6.prev = 15;
          _context6.t0 = _context6["catch"](3);
          console.error("❌ AI Question Error:", _context6.t0);
          res.status(500).json({
            error: "Failed to generate questions"
          });

        case 19:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[3, 15]]);
});
/**
 * Generate AI Image
 */

/*app.post("/api/generate-image", async (req, res) => {
  const { image_url } = req.body;
  if (!image_url) return res.status(400).json({ error: "No image_url provided" });

  try {
    const url = "https://ghibli-studio-ai.p.rapidapi.com/bot.php";
    const options = {
      method: "POST",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "ghibli-studio-ai.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_url }),
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Ghibli API Response Error:", errorText);
      return res.status(500).json({ error: "Failed to generate image", details: errorText });
    }

    const result = await response.text(); // API returns text, not JSON
    console.log("✅ AI Image Response:", result);

    res.json({ generatedImage: result });
  } catch (error) {
    console.error("❌ AI Image Error:", error);
    res.status(500).json({ error: "Failed to generate image", details: error.message });
  }
});*/
// ===================================================
// START SERVER
// ===================================================

server.listen(PORT, function () {
  console.log("\u2705 Server running at http://localhost:".concat(PORT));
});