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
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
pool.connect().then(function () {
  return console.log("✅ Connected to Supabase Database");
})["catch"](function (err) {
  return console.error("❌ Database connection error:", err);
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
});
/**
 * Get students in a class (by class code)
 */

app.get("/get-students/:code", function _callee6(req, res) {
  var code, students;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          code = req.params.code;
          _context6.next = 4;
          return regeneratorRuntime.awrap(pool.query("SELECT * FROM students WHERE code = $1 ORDER BY id DESC", [code]));

        case 4:
          students = _context6.sent;
          res.json({
            success: true,
            students: students.rows
          });
          _context6.next = 12;
          break;

        case 8:
          _context6.prev = 8;
          _context6.t0 = _context6["catch"](0);
          console.error("❌ Fetch Students Error:", _context6.t0.message);
          res.status(500).json({
            success: false,
            message: "Failed to fetch students"
          });

        case 12:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
/**
 * Delete a class (by code)
 */

app["delete"]("/delete-class/:code", function _callee7(req, res) {
  var code, deleted;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          code = req.params.code;
          _context7.next = 4;
          return regeneratorRuntime.awrap(pool.query("DELETE FROM class WHERE code = $1 RETURNING *", [code]));

        case 4:
          deleted = _context7.sent;

          if (!(deleted.rows.length === 0)) {
            _context7.next = 7;
            break;
          }

          return _context7.abrupt("return", res.status(404).json({
            success: false,
            message: "Class not found"
          }));

        case 7:
          res.json({
            success: true,
            "class": deleted.rows[0]
          });
          _context7.next = 14;
          break;

        case 10:
          _context7.prev = 10;
          _context7.t0 = _context7["catch"](0);
          console.error("❌ Delete Class Error:", _context7.t0.message);
          res.status(500).json({
            success: false,
            message: "Failed to delete class"
          });

        case 14:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
/**
 * Delete a student (by ID)
 */

app["delete"]("/delete-student/:id", function _callee8(req, res) {
  var id, deleted;
  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          id = req.params.id;
          _context8.next = 4;
          return regeneratorRuntime.awrap(pool.query("DELETE FROM students WHERE id = $1 RETURNING *", [id]));

        case 4:
          deleted = _context8.sent;

          if (!(deleted.rows.length === 0)) {
            _context8.next = 7;
            break;
          }

          return _context8.abrupt("return", res.status(404).json({
            success: false,
            message: "Student not found"
          }));

        case 7:
          res.json({
            success: true,
            student: deleted.rows[0]
          });
          _context8.next = 14;
          break;

        case 10:
          _context8.prev = 10;
          _context8.t0 = _context8["catch"](0);
          console.error("❌ Delete Student Error:", _context8.t0.message);
          res.status(500).json({
            success: false,
            message: "Failed to delete student"
          });

        case 14:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[0, 10]]);
}); // Save uploaded story (keep or replace your existing)

app.post("/save-story", function _callee9(req, res) {
  var _req$body5, teach_id, storyname, storycontent, storyquest, storyimage, result;

  return regeneratorRuntime.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          _req$body5 = req.body, teach_id = _req$body5.teach_id, storyname = _req$body5.storyname, storycontent = _req$body5.storycontent, storyquest = _req$body5.storyquest, storyimage = _req$body5.storyimage;
          _context9.next = 4;
          return regeneratorRuntime.awrap(pool.query("INSERT INTO teach_story (teach_id, storyname, storycontent, storyquest, storyimage) \n       VALUES ($1, $2, $3, $4, $5) RETURNING *", [teach_id, storyname, storycontent, storyquest, storyimage]));

        case 4:
          result = _context9.sent;
          res.json({
            success: true,
            story: result.rows[0]
          });
          _context9.next = 12;
          break;

        case 8:
          _context9.prev = 8;
          _context9.t0 = _context9["catch"](0);
          console.error("❌ Error saving story:", _context9.t0);
          res.status(500).json({
            success: false,
            message: _context9.t0.message || "Failed to save story"
          });

        case 12:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 8]]);
}); // Get all stories for a specific teacher

app.get("/get-stories/:teacherId", function _callee10(req, res) {
  var teacherId, result;
  return regeneratorRuntime.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          teacherId = req.params.teacherId;
          _context10.prev = 1;
          _context10.next = 4;
          return regeneratorRuntime.awrap(pool.query("SELECT * FROM teach_story WHERE teach_id = $1 ORDER BY story_id DESC", [teacherId]));

        case 4:
          result = _context10.sent;
          res.json({
            success: true,
            stories: result.rows
          });
          _context10.next = 12;
          break;

        case 8:
          _context10.prev = 8;
          _context10.t0 = _context10["catch"](1);
          console.error("❌ Error fetching stories:", _context10.t0);
          res.status(500).json({
            success: false,
            message: "Failed to fetch stories"
          });

        case 12:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[1, 8]]);
}); // Get stories for a student

app.get("/get-student-stories/:studentId", function _callee11(req, res) {
  var studentId, result;
  return regeneratorRuntime.async(function _callee11$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          studentId = req.params.studentId;
          _context11.prev = 1;
          _context11.next = 4;
          return regeneratorRuntime.awrap(pool.query("SELECT ts.story_id, ts.storyname, ts.storycontent, ts.storyquest, ts.storyimage\n             FROM students s\n             JOIN class c ON s.code = c.code\n             JOIN teachers t ON c.teacher_id = t.id\n             JOIN teach_story ts ON ts.teach_id = t.id\n             WHERE s.id = $1", [studentId]));

        case 4:
          result = _context11.sent;
          res.json({
            success: true,
            stories: result.rows
          });
          _context11.next = 12;
          break;

        case 8:
          _context11.prev = 8;
          _context11.t0 = _context11["catch"](1);
          console.error("❌ Error fetching student stories:", _context11.t0);
          res.json({
            success: false,
            message: "Database error"
          });

        case 12:
        case "end":
          return _context11.stop();
      }
    }
  }, null, null, [[1, 8]]);
}); // Get single story by ID

app.get("/get-story/:id", function _callee12(req, res) {
  var id, result;
  return regeneratorRuntime.async(function _callee12$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          id = req.params.id;
          _context12.prev = 1;
          _context12.next = 4;
          return regeneratorRuntime.awrap(pool.query("SELECT * FROM teach_story WHERE story_id = $1", [id]));

        case 4:
          result = _context12.sent;

          if (!(result.rows.length === 0)) {
            _context12.next = 7;
            break;
          }

          return _context12.abrupt("return", res.status(404).json({
            success: false,
            message: "Story not found"
          }));

        case 7:
          res.json({
            success: true,
            story: result.rows[0]
          });
          _context12.next = 14;
          break;

        case 10:
          _context12.prev = 10;
          _context12.t0 = _context12["catch"](1);
          console.error("❌ Error fetching story:", _context12.t0);
          res.status(500).json({
            success: false,
            message: "Database error"
          });

        case 14:
        case "end":
          return _context12.stop();
      }
    }
  }, null, null, [[1, 10]]);
}); // Get all story titles only

app.get("/get-stories", function _callee13(req, res) {
  var result;
  return regeneratorRuntime.async(function _callee13$(_context13) {
    while (1) {
      switch (_context13.prev = _context13.next) {
        case 0:
          _context13.prev = 0;
          _context13.next = 3;
          return regeneratorRuntime.awrap(pool.query("SELECT story_id AS id, storyname FROM teach_story ORDER BY story_id DESC"));

        case 3:
          result = _context13.sent;
          res.json({
            success: true,
            stories: result.rows
          });
          _context13.next = 11;
          break;

        case 7:
          _context13.prev = 7;
          _context13.t0 = _context13["catch"](0);
          console.error("❌ Error fetching stories:", _context13.t0.message);
          res.status(500).json({
            success: false,
            message: "Failed to fetch stories"
          });

        case 11:
        case "end":
          return _context13.stop();
      }
    }
  }, null, null, [[0, 7]]);
}); // ===================================================
// 🔹 AI SECTION (RapidAPI GPT + Ghibli Image)
// ===================================================

/**
 * Generate AI Questions
 */

app.post("/api/generate-questions", function _callee14(req, res) {
  var context, url, options, response, data;
  return regeneratorRuntime.async(function _callee14$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          context = req.body.context;

          if (context) {
            _context14.next = 3;
            break;
          }

          return _context14.abrupt("return", res.status(400).json({
            error: "No context provided"
          }));

        case 3:
          _context14.prev = 3;
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
          _context14.next = 8;
          return regeneratorRuntime.awrap(fetch(url, options));

        case 8:
          response = _context14.sent;
          _context14.next = 11;
          return regeneratorRuntime.awrap(response.json());

        case 11:
          data = _context14.sent;
          res.json({
            questions: data.result || ["No questions generated"]
          });
          _context14.next = 19;
          break;

        case 15:
          _context14.prev = 15;
          _context14.t0 = _context14["catch"](3);
          console.error("❌ AI Question Error:", _context14.t0);
          res.status(500).json({
            error: "Failed to generate questions"
          });

        case 19:
        case "end":
          return _context14.stop();
      }
    }
  }, null, null, [[3, 15]]);
});
/*
// AI endpoint to format story text
app.post("/api/format-story", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, message: "No content provided" });

  try {
    const url = "https://chatgpt-42.p.rapidapi.com/gpt4o";
    const options = {
      method: "POST",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "chatgpt-42.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: `Format the following story text with proper paragraph breaks, spacing, and readability. 
                      Keep it simple, do not rewrite or summarize, only reformat:\n\n${context}`
          },
        ],
        web_access: false,
      }),
    };

    const response = await fetch(url, options);
    const data = await response.json();

    res.json({ success: true, formatted: data.result });
  } catch (err) {
    console.error("❌ AI Format Story Error:", err);
    res.status(500).json({ success: false, message: "Failed to format story" });
  }
}); */

/**
 * Generate AI Image
 */

app.post("/api/generate-image", function _callee15(req, res) {
  var _req$body6, prompt, _req$body6$size, size, _req$body6$refImage, refImage, url, options, response, errorText, result;

  return regeneratorRuntime.async(function _callee15$(_context15) {
    while (1) {
      switch (_context15.prev = _context15.next) {
        case 0:
          _req$body6 = req.body, prompt = _req$body6.prompt, _req$body6$size = _req$body6.size, size = _req$body6$size === void 0 ? "1-1" : _req$body6$size, _req$body6$refImage = _req$body6.refImage, refImage = _req$body6$refImage === void 0 ? "" : _req$body6$refImage;

          if (prompt) {
            _context15.next = 3;
            break;
          }

          return _context15.abrupt("return", res.status(400).json({
            error: "No prompt provided"
          }));

        case 3:
          _context15.prev = 3;
          url = 'https://ghibli-image-generator-api-open-ai-4o-image-generation-free.p.rapidapi.com/generateghibliimage.php';
          options = {
            method: 'POST',
            headers: {
              'x-rapidapi-key': process.env.RAPIDAPI_KEY || '1098f4e1fbmsha80729b29b72a9ep12b064jsn104e5f142388',
              'x-rapidapi-host': 'ghibli-image-generator-api-open-ai-4o-image-generation-free.p.rapidapi.com',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: prompt,
              size: size,
              refImage: refImage,
              refWeight: 1
            })
          };
          _context15.next = 8;
          return regeneratorRuntime.awrap(fetch(url, options));

        case 8:
          response = _context15.sent;

          if (response.ok) {
            _context15.next = 15;
            break;
          }

          _context15.next = 12;
          return regeneratorRuntime.awrap(response.text());

        case 12:
          errorText = _context15.sent;
          console.error("❌ Image API Response Error:", errorText);
          return _context15.abrupt("return", res.status(500).json({
            error: "Failed to generate image",
            details: errorText
          }));

        case 15:
          _context15.next = 17;
          return regeneratorRuntime.awrap(response.text());

        case 17:
          result = _context15.sent;
          // API returns text
          console.log("✅ AI Image Response:", result);
          res.json({
            generatedImage: result
          });
          _context15.next = 26;
          break;

        case 22:
          _context15.prev = 22;
          _context15.t0 = _context15["catch"](3);
          console.error("❌ AI Image Error:", _context15.t0);
          res.status(500).json({
            error: "Failed to generate image",
            details: _context15.t0.message
          });

        case 26:
        case "end":
          return _context15.stop();
      }
    }
  }, null, null, [[3, 22]]);
}); // ===================================================
// START SERVER
// ===================================================

server.listen(PORT, function () {
  console.log("\u2705 Server running at http://localhost:".concat(PORT));
}); //  node Back-end/js/server.js