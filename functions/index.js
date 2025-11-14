const functions = require("firebase-functions/v2"); // ✅ use v2 API
const { onRequest } = require("firebase-functions/v2/https");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const multer = require("multer");

// Firebase Admin SDK
const { initializeApp } = require('firebase-admin/app');
const admin = require("firebase-admin");
initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(bodyParser.json());

// 🔹 PostgreSQL Connection (Supabase)
const { DATABASE_URL, RAPIDAPI_KEY } = process.env;

const dbUrl = DATABASE_URL;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

// ===================================================
// 🔹 DATABASE SECTION (PostgreSQL)
// ===================================================

/**
 * Teacher Registration
 */
app.post("/api/register", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // ✅ Validate Fullname (only letters and spaces)
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(fullname)) {
      return res.status(400).json({
        success: false,
        field: "fullname",
        message: "Name should only contain letters.",
      });
    }

    // ✅ Validate Email format (must end with @gmail.com)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        field: "email",
        message: "Please enter a valid Gmail address (e.g. example@gmail.com).",
      });
    }

    // ✅ Validate Password strength
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        field: "password",
        message: "Password must be at least 6 characters long.",
      });
    }

    // ✅ Check if email already exists
    const existing = await pool.query("SELECT * FROM teachers WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        field: "email",
        message: "This email has already been used, please use another.",
      });
    }

    // ✅ Hash password and insert into DB
    const hashedPassword = await bcrypt.hash(password, 10);
    const newTeacher = await pool.query(
      "INSERT INTO teachers (fullname, email, password) VALUES ($1, $2, $3) RETURNING *",
      [fullname, email, hashedPassword]
    );

    res.json({ success: true, teacher: newTeacher.rows[0] });
  } catch (err) {
    console.error("❌ Teacher Registration Error:", err);
    res.status(500).json({ success: false, message: "Registration failed." });
  }
});

/**
 * Teacher Login
 */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validate Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, field: "email", message: "Invalid email format." });
    }

    const teacherQuery = await pool.query("SELECT * FROM teachers WHERE email = $1", [email]);
    if (teacherQuery.rows.length === 0) {
      return res.status(400).json({ success: false, field: "email", message: "Email not found." });
    }

    const teacher = teacherQuery.rows[0];
    const validPassword = await bcrypt.compare(password, teacher.password);
    
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        field: "password",
        message: "Incorrect password.",
      });
    }

    res.json({
      success: true,
      teacher: {
        id: teacher.id,
        fullname: teacher.fullname,
        email: teacher.email,
      },
    });
  } catch (err) {
    console.error("❌ Teacher Login Error:", err);
    res.status(500).json({ success: false, message: "Login failed." });
  }
});

/**
 * Create a Class (Teacher)
 */
app.post("/api/create-class", async (req, res) => {
  try {
    const { name, code, teacher_id } = req.body;

    // Check if code already exists
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
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create class" });
  }
});

/**
 * STUDENT LOGIN (Existing Students Only)
 */
app.post("/api/student-login", async (req, res) => {
  try {
    const { fullname, code } = req.body;

    // Check if class exists
    const classExists = await pool.query("SELECT * FROM class WHERE code = $1", [code]);
    if (classExists.rows.length === 0) {
      return res.status(400).json({ success: false, field: "code", message: "Invalid class code" });
    }

    // Normalize input
    const [surname, firstname] = fullname
      .replace(/\s+/g, " ")
      .trim()
      .replace(/(^\w|\s\w)/g, m => m.toUpperCase())
      .split(/,|\s/)
      .map(n => n.trim())
      .filter(Boolean);

    const normalizedFullName = `${surname}, ${firstname}`;

    // 🔍 Try to find student
    let student = await pool.query(
      `SELECT * FROM students WHERE LOWER(fullname) = LOWER($1) AND code = $2`,
      [normalizedFullName, code]
    );

    // Also check reversed order
    if (student.rows.length === 0) {
      const reversedName = `${firstname}, ${surname}`;
      student = await pool.query(
        `SELECT * FROM students WHERE LOWER(fullname) = LOWER($1) AND code = $2`,
        [reversedName, code]
      );
    }

    // ❌ No student found
    if (student.rows.length === 0) {
      return res.status(400).json({ success: false, field: "fullname", message: "Student not found. Please register first." });
    }

    // ✅ Login success
    const s = student.rows[0];
    res.json({
      success: true,
      student: {
        id: s.id,
        fullname: s.fullname,
        code: s.code
      }
    });
  } catch (err) {
    console.error("❌ Student Login Error:", err.message);
    res.status(500).json({ success: false, message: "Student login failed" });
  }
});

/**
 * STUDENT REGISTER (New Students Only)
 */
app.post("/api/student-register", async (req, res) => {
  try {
    const { fullname, code } = req.body;

    // Check if class exists
    const classExists = await pool.query("SELECT * FROM class WHERE code = $1", [code]);
    if (classExists.rows.length === 0) {
      return res.status(400).json({ success: false, field: "code", message: "Invalid class code" });
    }

    // Normalize input
    const [surname, firstname] = fullname
      .replace(/\s+/g, " ")
      .trim()
      .replace(/(^\w|\s\w)/g, m => m.toUpperCase())
      .split(/,|\s/)
      .map(n => n.trim())
      .filter(Boolean);

    const normalizedFullName = `${surname}, ${firstname}`;

    // 🔍 Check if already registered
    const existingStudent = await pool.query(
      `SELECT * FROM students WHERE LOWER(fullname) = LOWER($1) AND code = $2`,
      [normalizedFullName, code]
    );

    if (existingStudent.rows.length > 0) {
      return res.status(400).json({ success: false, field: "fullname", message: "Student already registered in this class" });
    }

    // ✅ Insert new student
    const student = await pool.query(
      "INSERT INTO students (fullname, code) VALUES ($1, $2) RETURNING *",
      [normalizedFullName, code]
    );

    // Update student count
    await pool.query("UPDATE class SET no_students = no_students + 1 WHERE code = $1", [code]);

    const s = student.rows[0];
    res.json({
      success: true,
      student: {
        id: s.id,
        fullname: s.fullname,
        code: s.code
      }
    });
  } catch (err) {
    console.error("❌ Student Register Error:", err.message);
    res.status(500).json({ success: false, message: "Student registration failed" });
  }
});

/**
 * Get all classes for a teacher
 */
app.get("/api/get-classes/:teacher_id", async (req, res) => {
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
app.get("/api/get-students/:code", async (req, res) => {
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
app.delete("/api/delete-class/:code", async (req, res) => {
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
app.delete("/api/delete-student/:id", async (req, res) => {
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
app.post("/api/save-story", async (req, res) => {
  try {
    const {
      teach_id,
      storyname,
      storycontent,
      storyquest_easy,
      storyquest_med,
      storyquest_hard,
      storyimage
    } = req.body;

    const result = await pool.query(
      `INSERT INTO teach_story 
       (teach_id, storyname, storycontent, storyquest_easy, storyquest_med, storyquest_hard, storyimage) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [teach_id, storyname, storycontent, storyquest_easy, storyquest_med, storyquest_hard, storyimage]
    );

    res.json({ success: true, story: result.rows[0] });
  } catch (err) {
    console.error("❌ Error saving story:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to save story" });
  }
});

/**
 * Update existing story
 */
app.put("/api/update-story/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    // Fetch current story
    const current = await pool.query("SELECT * FROM teach_story WHERE story_id = $1", [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const story = current.rows[0];

    const storyname = req.body.storyname ?? story.storyname;
    const storycontent = req.body.storycontent ?? story.storycontent;
    const storyquest_easy = req.body.storyquest_easy ?? story.storyquest_easy;
    const storyquest_med = req.body.storyquest_med ?? story.storyquest_med;
    const storyquest_hard = req.body.storyquest_hard ?? story.storyquest_hard;
    const storyimage = req.body.storyimage ?? story.storyimage;

    const result = await pool.query(
      `UPDATE teach_story
       SET storyname = $1,
           storycontent = $2,
           storyquest_easy = $3,
           storyquest_med = $4,
           storyquest_hard = $5,
           storyimage = $6
       WHERE story_id = $7
       RETURNING *`,
      [storyname, storycontent, storyquest_easy, storyquest_med, storyquest_hard, storyimage, id]
    );

    res.json({ success: true, story: result.rows[0] });
  } catch (err) {
    console.error("❌ Error updating story:", err);
    res.status(500).json({ success: false, message: "Failed to update story", error: err.message });
  }
});

// Get all stories for a specific teacher
app.get("/api/get-stories/:teacherId", async (req, res) => {
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
app.get("/api/get-student-stories/:studentId", async (req, res) => {
  const { studentId } = req.params;
  try {
    const result = await pool.query(
      `SELECT ts.story_id, ts.storyname, ts.storycontent, ts.storyquest_easy, ts.storyquest_med, ts.storyquest_hard, ts.storyimage
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

/**
 * Delete a story (by story_id)
 */
app.delete("/api/delete-story/:story_id", async (req, res) => {
  try {
    const { story_id } = req.params;

    const deleted = await pool.query(
      "DELETE FROM teach_story WHERE story_id = $1 RETURNING *",
      [story_id]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Story not found.",
      });
    }

    res.json({
      success: true,
      message: "Story deleted successfully.",
      story: deleted.rows[0],
    });
  } catch (err) {
    console.error("❌ Error deleting story:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete story.",
    });
  }
});

// Get single story by ID
app.get("/api/get-story/:id", async (req, res) => {
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
app.get("/api/get-stories", async (req, res) => {
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

app.get("/api/get-story/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query("SELECT * FROM stories WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Story not found" });
    }

    res.json({
      id: rows[0].id,
      title: rows[0].title,
      content: rows[0].content // still TEXT
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Save Student Result
 */
app.post("/api/save-result", async (req, res) => {
  try {
    const { student_id, story_id, read_speed, read_score, final_grade } = req.body;

    if (!student_id || !story_id) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const query = `
      INSERT INTO s_storyresult (student_id, story_id, read_speed, read_score, final_grade)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [student_id, story_id, read_speed, read_score, final_grade];

    const result = await pool.query(query, values);
    res.json({ success: true, result: result.rows[0] });
  } catch (err) {
    console.error("❌ DB Insert Error:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

app.post("/api/save-learning-activity", async (req, res) => {
  try {
    const { studId, learnName, f_result, modes } = req.body;

    if (!studId || !learnName || !modes) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const query = `
      INSERT INTO learn_act (studid, learnname, f_result, modes)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [studId, learnName, f_result || 0, modes];

    const result = await pool.query(query, values);
    res.json({ success: true, activity: result.rows[0] });

  } catch (err) {
    console.error("❌ Error saving learning activity:", err.message);
    res.status(500).json({ success: false, message: "Database error." });
  }
});

app.post("/api/fetch-video", async (req, res) => {
  try {
    const { link, teacher_id, title } = req.body;

    if (!link) {
      return res.json({ success: false, message: "No link provided" });
    }

    // If title is empty, use fallback
    const videoTitle = title && title.trim() !== "" ? title : "Untitled Video";

    // Insert video into Supabase Postgres
    const result = await pool.query(
      `INSERT INTO video_upload (teachid, videofile, videoname) 
       VALUES ($1, $2, $3) 
       RETURNING videoid, videoname`,
      [teacher_id, link, videoTitle]  // ✔ Save the REAL youtube title
    );

    return res.json({
      success: true,
      videoname: result.rows[0].videoname,
      videoid: result.rows[0].videoid
    });

  } catch (err) {
    console.error("❌ Upload Video Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error uploading video"
    });
  }
});

// GET – Return uploaded videos
app.get("/api/get-videos", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT videoid, teachid, videofile, videoname 
       FROM video_upload 
       ORDER BY videoid DESC`
    );

    return res.json({
      success: true,
      videos: result.rows
    });

  } catch (err) {
    console.error("❌ Get Videos Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching videos"
    });
  }
});

app.get("/api/get-student-videos", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.json({
        success: false,
        message: "No class code provided."
      });
    }

    // 1️⃣ Get the class using the class code
    const classResult = await pool.query(
      `SELECT teacher_id FROM class WHERE code = $1`,
      [code]
    );

    if (classResult.rows.length === 0) {
      return res.json({
        success: false,
        message: "Class not found."
      });
    }

    const teacherId = classResult.rows[0].teacher_id;

    // 2️⃣ Retrieve teacher videos
    const videosResult = await pool.query(
      `SELECT videoid, videofile, videoname
       FROM video_upload
       WHERE teachid = $1
       ORDER BY videoid DESC`,
      [teacherId]
    );

    return res.json({
      success: true,
      videos: videosResult.rows
    });

  } catch (err) {
    console.error("❌ Error fetching student videos:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving videos."
    });
  }
});

app.get("/api/get-student-progress/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;

    // === FETCH STORY RESULTS ===
    const storyQuery = await pool.query(
      `SELECT s_storyresult.*, ts.storyname
       FROM s_storyresult
       JOIN teach_story ts ON s_storyresult.story_id = ts.story_id
       WHERE s_storyresult.student_id = $1`,
      [studentId]
    );

    // === FETCH LEARNING ACTIVITIES ===
    const learnQuery = await pool.query(
      `SELECT learn_act.*
       FROM learn_act
       WHERE studid = $1`,
      [studentId]
    );

    const stories = storyQuery.rows;
    const learnings = learnQuery.rows;

    // === STORY STATS ===
    const storyCompleted = stories.length;
    const storyAvg =
      storyCompleted > 0
        ? stories.reduce((sum, s) => sum + Number(s.final_grade || 0), 0) /
          storyCompleted
        : 0;

    // === LEARNING STATS ===
    const learnCompleted = learnings.length;
    const learnAvg =
      learnCompleted > 0
        ? learnings.reduce((sum, l) => sum + Number(l.f_result || 0), 0) /
          learnCompleted
        : 0;

    // === OVERALL PROGRESS — FIXED ===
    // Correct formula:
    // Take total scores divided by number of total completed
    const totalScoreSum =
      stories.reduce((sum, s) => sum + Number(s.final_grade || 0), 0) +
      learnings.reduce((sum, l) => sum + Number(l.f_result || 0), 0);

    const totalCompleted = storyCompleted + learnCompleted;

    const overallProgress =
      totalCompleted > 0 ? Math.round(totalScoreSum / totalCompleted) : 0;

    // === ACTIVITIES LIST ===
    const activities = [
      ...stories.map(s => ({
        category: "Story",
        title: s.storyname,
        score: Number(s.final_grade || 0)
      })),
      ...learnings.map(l => ({
        category: "Learning",
        title: l.learnname,
        score: Number(l.f_result || 0)
      }))
    ];

    res.json({
      success: true,
      progress: overallProgress,
      storyStats: {
        completed: storyCompleted,
        average: Math.round(storyAvg)
      },
      learningStats: {
        completed: learnCompleted,
        average: Math.round(learnAvg)
      },
      activities
    });
  } catch (err) {
    console.error("❌ Error fetching student progress:", err.message);
    res.status(500).json({ success: false, message: "Failed to get student progress" });
  }
});


// ===================================================
// 🔹 AI SECTION (RapidAPI GPT + Image)
// ===================================================

/**
 * Generate AI Questions
 */
app.post("/api/generate-questions-all-modes", async (req, res) => {
  const { context } = req.body;
  if (!context)
    return res.status(400).json({ error: "Missing required parameters" });

  const modes = ["Easy", "Medium", "Hard"];
  const result = {};

  const RAPIDAPI_URL = "https://chatgpt-42.p.rapidapi.com/gpt4o";
  const MAX_RETRIES = 3;

  // Helper: fetch with timeout
  const fetchWithTimeout = (url, options, timeout = 30000) =>
    Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("⏰ Timeout after 30s")), timeout)
      ),
    ]);

  for (const mode of modes) {
    let success = false;
    let attempt = 0;
    let questions = [];

    while (!success && attempt < MAX_RETRIES) {
      attempt++;
      console.log(`🚀 Attempt ${attempt} for ${mode}`);

      const prompt = `
You are an expert educational content creator.

Generate exactly 10 multiple-choice comprehension questions for the story below.
Each question must have:
- One correct answer and three wrong answers
- Choices labeled A), B), C), D)
- An answer line formatted as "Answer: [letter]"
- No explanations, introductions, or extra commentary
- Output must start directly with "Q1:" and continue sequentially to "Q10:"

Difficulty Level: ${mode}

Story:
${context}

⚠️ Output Format (strictly follow this):
Q1: [question]
A) [option]
B) [option]
C) [option]
D) [option]
Answer: [letter]

Q2: ...
... (continue until Q10)
      `;

      const options = {
        method: "POST",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "chatgpt-42.p.rapidapi.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          web_access: false,
        }),
      };

      try {
        const response = await fetchWithTimeout(RAPIDAPI_URL, options);
        const data = await response.json();

        // Handle RapidAPI busy or error messages
        if (data.error || data.status === false) {
          console.warn(`⚠️ RapidAPI error for ${mode}:`, data);
          if (data.error?.includes("busy")) {
            console.log("⏳ Waiting 5 seconds before retry...");
            await new Promise((r) => setTimeout(r, 5000));
            continue; // retry
          } else {
            break;
          }
        }

        const textResult = data.result || data.response || "";
        questions = textResult
          .split(/\n(?=Q\d+:)/)
          .map((q) => q.trim())
          .filter((q) => q.length > 0);

        if (questions.length >= 10) {
          success = true;
        } else {
          console.warn(`⚠️ Only ${questions.length} questions generated for ${mode}`);
          await new Promise((r) => setTimeout(r, 3000)); // short delay before retry
        }
      } catch (err) {
        console.error(`❌ Error on attempt ${attempt} for ${mode}:`, err);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    // Fallback message if still no success
    if (!success) {
      console.error(`❌ Failed to generate ${mode} questions after ${MAX_RETRIES} attempts`);
      result[mode] = ["⚠️ Could not generate questions due to API issues."];
    } else {
      result[mode] = questions;
    }
  }

  res.json(result);
});

/**
 * Generate AI Image
 */
app.post("/api/generate-image", async (req, res) => {
  const { prompt, size = "512x512" } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  try {
    const bucket = admin.storage().bucket();
    const apiUrl = "https://chatgpt-42.p.rapidapi.com/texttoimage3";
    const options = {
      method: "POST",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "chatgpt-42.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: prompt,
        width: 512,
        height: 512,
        steps: 1,
      }),
    };

    const response = await fetch(apiUrl, options);
    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Image API Error:", errText);
      return res.status(502).json({ error: "Image provider error", details: errText });
    }

    let raw = await response.json();

    // ✅ Case 1: Direct URL
    if (raw.generated_image && typeof raw.generated_image === "string") {
      return res.json({ url: raw.generated_image });
    }

    // ✅ Case 2: Base64 or encoded
    let base64Data = raw.image || raw.data || raw.base64 || null;
    if (base64Data && typeof base64Data === "string") {
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Image, 'base64');
        
        const filename = `generated_images/img_${Date.now()}.png`;
        const file = bucket.file(filename);

        await file.save(imageBuffer, {
            metadata: {
                contentType: 'image/png',
            },
            public: true, // Make the file publicly accessible
        });

        const publicUrl = file.publicUrl();
        return res.json({ url: publicUrl });
    }

    console.warn("⚠️ Unexpected format from API:", raw);
    return res.json({ raw });

  } catch (err) {
    console.error("❌ /api/generate-image error:", err);
    res.status(500).json({ error: "Server error generating image", details: err.message });
  }
});

// ===================================================
// START SERVER
// ===================================================
exports.api = onRequest({ 
    region: "asia-southeast1", 
    invoker: 'public'
}, app);