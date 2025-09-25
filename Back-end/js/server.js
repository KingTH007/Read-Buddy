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
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log("✅ Connected to Supabase Database"))
  .catch(err => console.error("❌ Database connection error:", err));
  
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

/**
 * Get students in a class (by class code)
 */
app.get("/get-students/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const students = await pool.query(
      "SELECT * FROM students WHERE code = $1 ORDER BY id DESC",
      [code]
    );

    res.json({ success: true, students: students.rows });
  } catch (err) {
    console.error("❌ Fetch Students Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
});

/**
 * Delete a class (by code)
 */
app.delete("/delete-class/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const deleted = await pool.query("DELETE FROM class WHERE code = $1 RETURNING *", [code]);

    if (deleted.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    res.json({ success: true, class: deleted.rows[0] });
  } catch (err) {
    console.error("❌ Delete Class Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete class" });
  }
});

/**
 * Delete a student (by ID)
 */
app.delete("/delete-student/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await pool.query("DELETE FROM students WHERE id = $1 RETURNING *", [id]);

    if (deleted.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, student: deleted.rows[0] });
  } catch (err) {
    console.error("❌ Delete Student Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete student" });
  }
});

// Save uploaded story (keep or replace your existing)
app.post("/save-story", async (req, res) => {
  try {
      const { teach_id, storyname, storycontent, storyquest, storyimage } = req.body;

    const result = await pool.query(
      `INSERT INTO teach_story (teach_id, storyname, storycontent, storyquest, storyimage) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [teach_id, storyname, storycontent, storyquest, storyimage]
    );

    res.json({ success: true, story: result.rows[0] });
  } catch (err) {
    console.error("❌ Error saving story:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to save story" });
  }
});

// Get all stories for a specific teacher
app.get("/get-stories/:teacherId", async (req, res) => {
  const { teacherId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM teach_story WHERE teach_id = $1 ORDER BY story_id DESC",
      [teacherId]
    );

    res.json({ success: true, stories: result.rows });
  } catch (err) {
    console.error("❌ Error fetching stories:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stories" });
  }
});

// Get stories for a student
app.get("/get-student-stories/:studentId", async (req, res) => {
    const { studentId } = req.params;
    try {
        const result = await pool.query(
            `SELECT ts.story_id, ts.storyname, ts.storycontent, ts.storyquest, ts.storyimage
             FROM students s
             JOIN class c ON s.code = c.code
             JOIN teachers t ON c.teacher_id = t.id
             JOIN teach_story ts ON ts.teach_id = t.id
             WHERE s.id = $1`,
            [studentId]
        );

        res.json({ success: true, stories: result.rows });
    } catch (err) {
        console.error("❌ Error fetching student stories:", err);
        res.json({ success: false, message: "Database error" });
    }
});

// Get single story by ID
app.get("/get-story/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM teach_story WHERE story_id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }
    res.json({ success: true, story: result.rows[0] });
  } catch (err) {
    console.error("❌ Error fetching story:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Get all story titles only
app.get("/get-stories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT story_id AS id, storyname FROM teach_story ORDER BY story_id DESC"
    );
    res.json({ success: true, stories: result.rows });
  } catch (err) {
    console.error("❌ Error fetching stories:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch stories" });
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
app.post("/api/generate-image", async (req, res) => {
    const { prompt, size = "1-1", refImage = "" } = req.body;

    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    try {
        const url = 'https://ghibli-image-generator-api-open-ai-4o-image-generation-free.p.rapidapi.com/generateghibliimage.php';
        const options = {
            method: 'POST',
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY || '1098f4e1fbmsha80729b29b72a9ep12b064jsn104e5f142388',
                'x-rapidapi-host': 'ghibli-image-generator-api-open-ai-4o-image-generation-free.p.rapidapi.com',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                size,
                refImage,
                refWeight: 1
            })
        };

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Image API Response Error:", errorText);
            return res.status(500).json({ error: "Failed to generate image", details: errorText });
        }

        const result = await response.text(); // API returns text
        console.log("✅ AI Image Response:", result);

        res.json({ generatedImage: result });
    } catch (error) {
        console.error("❌ AI Image Error:", error);
        res.status(500).json({ error: "Failed to generate image", details: error.message });
    }
});

// ===================================================
// START SERVER
// ===================================================
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

//  node Back-end/js/server.js