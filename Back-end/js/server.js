// Back-end/js/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../../Front-end")));

// HTTP + Socket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// ===================================================
// 🔹 DATABASE SECTION (PostgreSQL)
// ===================================================
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "readbuddyDB",
  password: "errorsyntax0!",
  port: 5432,
});

/**
 * Teacher Registration
 */
app.post("/register", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    const existing = await pool.query("SELECT * FROM teachers WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        field: "email",
        message: "This email has been used, please use another.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = await pool.query(
      "INSERT INTO teachers (fullname, email, password) VALUES ($1, $2, $3) RETURNING *",
      [fullname, email, hashedPassword]
    );

    res.json({ success: true, teacher: newTeacher.rows[0] });
  } catch (err) {
    console.error("❌ Teacher Registration Error:", err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

/**
 * Teacher Login
 */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await pool.query("SELECT * FROM teachers WHERE email = $1", [email]);

    if (teacher.rows.length === 0) {
      return res.status(400).json({ success: false, field: "email", message: "Email not found" });
    }

    const validPassword = await bcrypt.compare(password, teacher.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        field: "password",
        message: "Incorrect password",
      });
    }

    res.json({ success: true, teacher: teacher.rows[0] });
  } catch (err) {
    console.error("❌ Teacher Login Error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

/**
 * Create a Class
 */
app.post("/create-class", async (req, res) => {
  try {
    const { name, code, teacher_id } = req.body;

    const existing = await pool.query("SELECT * FROM class WHERE code = $1", [code]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Class code already exists." });
    }

    const newClass = await pool.query(
      "INSERT INTO class (code, name, teacher_id) VALUES ($1, $2, $3) RETURNING *",
      [code, name, teacher_id]
    );

    res.json({ success: true, class: newClass.rows[0] });
  } catch (err) {
    console.error("❌ Create Class Error:", err);
    res.status(500).json({ success: false, message: "Failed to create class" });
  }
});

/**
 * Student Login (auto-register if new)
 */
app.post("/student-login", async (req, res) => {
  try {
    const { fullname, code } = req.body;

    const classExists = await pool.query("SELECT * FROM class WHERE code = $1", [code]);
    if (classExists.rows.length === 0) {
      return res.status(400).json({ success: false, field: "code", message: "Invalid class code" });
    }

    let student = await pool.query(
      "SELECT * FROM students WHERE fullname = $1 AND code = $2",
      [fullname, code]
    );

    if (student.rows.length === 0) {
      student = await pool.query(
        "INSERT INTO students (fullname, code) VALUES ($1, $2) RETURNING *",
        [fullname, code]
      );

      await pool.query("UPDATE class SET no_students = no_students + 1 WHERE code = $1", [code]);

      io.emit("student-joined", { code });
    }

    res.json({ success: true, student: student.rows[0] });
  } catch (err) {
    console.error("❌ Student Login Error:", err.message);
    res.status(500).json({ success: false, message: "Student login failed" });
  }
});

/**
 * Get all classes for a teacher
 */
app.get("/get-classes/:teacher_id", async (req, res) => {
  try {
    const { teacher_id } = req.params;
    const classes = await pool.query(
      "SELECT * FROM class WHERE teacher_id = $1 ORDER BY code DESC",
      [teacher_id]
    );

    res.json({ success: true, classes: classes.rows });
  } catch (err) {
    console.error("❌ Fetch Classes Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch classes" });
  }
});

// ===================================================
// 🔹 AI SECTION (RapidAPI GPT + Ghibli Image)
// ===================================================

/**
 * Generate AI Questions
 */
app.post("/api/generate-questions", async (req, res) => {
  const { context } = req.body;
  if (!context) return res.status(400).json({ error: "No context provided" });

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
            content: `Based on the following story, create 20 multiple-choice comprehension questions. 
                      Each question must have 1 correct answer and 3 wrong answers.
                      Format them as:

                      Q1: [question]
                      A) option1
                      B) option2
                      C) option3
                      D) option4
                      Answer: [letter]

                      STORY:
                      ${context}`,
          },
        ],
        web_access: false,
      }),
    };

    const response = await fetch(url, options);
    const data = await response.json();
    res.json({ questions: data.result || ["No questions generated"] });
  } catch (error) {
    console.error("❌ AI Question Error:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
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
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

//  node Back-end/js/server.js