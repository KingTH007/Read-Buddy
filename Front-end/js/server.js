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

const fs = require('fs');
const multer = require('multer');

// Ensure uploads directories exist
const uploadsRoot = path.join(__dirname, '../../uploads');
const lessonsDir = path.join(uploadsRoot, 'lessons');
const videosDir  = path.join(uploadsRoot, 'videos');

[uploadsRoot, lessonsDir, videosDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Serve uploads statically so files are reachable at:
// http://localhost:5000/uploads/lessons/<file>
app.use('/uploads/videos', express.static(path.join(__dirname, '../../uploads/videos')));

// Multer disk storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // choose folder by route usage (we'll use different middleware instances below)
    cb(null, req.uploadDir || lessonsDir);
  },
  filename: (req, file, cb) => {
    // safe filename with timestamp
    const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}_${safeName}`);
  }
});
// limits optional (example: max 200 MB for videos)
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 } // adjust as needed
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
app.post("/login", async (req, res) => {
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
app.post("/create-class", async (req, res) => {
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
app.post("/student-login", async (req, res) => {
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
app.post("/student-register", async (req, res) => {
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

    // Notify via socket
    io.emit("student-joined", { code });

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
app.put("/update-story/:id", async (req, res) => {
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
app.delete("/delete-story/:story_id", async (req, res) => {
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

app.get("/get-story/:id", async (req, res) => {
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
app.post("/save-result", (req, res) => {
  const { student_id, story_id, read_speed, read_score, final_grade } = req.body;

  if (!student_id || !story_id) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  const query = `
    INSERT INTO s_storyresult (student_id, story_id, read_speed, read_score, final_grade)
    VALUES ($1, $2, $3, $4, $5) RETURNING *;
  `;
  const values = [student_id, story_id, read_speed, read_score, final_grade];

  pool.query(query, values)
    .then(result => {
      res.json({ success: true, result: result.rows[0] });
    })
    .catch(err => {
      console.error("❌ DB Insert Error:", err);
      res.status(500).json({ success: false, message: "Database error" });
    });
});

// ✅ Upload Video File
app.post("/upload-video", (req, res, next) => {
  req.uploadDir = videosDir;
  next();
}, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { videoName, teachID} = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: "No video uploaded." });
    }
    if (!videoName) {
      return res.status(400).json({ success: false, message: "Missing video name." });
    }

    // ✅ Correct file URL
    const publicUrl = `${req.protocol}://${req.get("host")}/uploads/videos/${file.filename}`;

    // ✅ Match your actual column names in Supabase
    const query = `
      INSERT INTO video_upload (teachid, videofile, videoname)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [teachID || null, publicUrl, videoName];

    const result = await pool.query(query, values);

    res.json({ success: true, video: result.rows[0] });

  } catch (err) {
    console.error("❌ Video upload error:", err.message);
    res.status(500).json({
      success: false,
      message: "Video upload failed.",
      error: err.message
    });
  }
});

// Fetch videos for a specific student based on their class code
app.get("/get-student-videos", async (req, res) => {
  const { code } = req.query;

  try {
    const teacherResult = await pool.query(
      "SELECT teacher_id FROM class WHERE code = $1",
      [code]
    );

    if (teacherResult.rows.length === 0) {
      return res.json({ success: false, message: "Class not found" });
    }

    const teacherId = teacherResult.rows[0].teacher_id;

    const videoResult = await pool.query(
      "SELECT videoid, videoname, videofile FROM video_upload WHERE teachid = $1 ORDER BY videoid DESC",
      [teacherId]
    );

    res.json({ success: true, videos: videoResult.rows });
  } catch (err) {
    console.error("❌ Error fetching student videos:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Get all uploaded videos
 */
app.get("/get-videos", async (req, res) => {
  try {
    // Fetch all videos from your database table 'video_upload'
    const result = await pool.query("SELECT * FROM video_upload ORDER BY videoid DESC");

    // If there are no videos, return an empty array
    if (result.rows.length === 0) {
      return res.json({ success: true, videos: [] });
    }

    // Map and prepare the data for frontend
    const videos = result.rows.map(video => ({
      videoid: video.videoid,       // unique ID from DB
      videoname: video.videoname,   // name set by teacher
      videofile: video.videofile    // video file URL or path
    }));

    // Send success response
    res.json({ success: true, videos });
  } catch (err) {
    console.error("❌ Error fetching videos:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch videos" });
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

  try {
    for (const mode of modes) {
      const prompt = `Based on the following story, create 20 multiple-choice comprehension questions for ${mode} difficulty. 
Each question must have 1 correct answer and 3 wrong answers.
Format them as:

Q1: [question]
A) option1
B) option2
C) option3
D) option4
Answer: [letter]

STORY:
${context}`;

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

      const response = await fetch("https://chatgpt-42.p.rapidapi.com/gpt4o", options);
      const data = await response.json();
      const textResult = data.result || "";

      // Split text into array of questions
      const questions = textResult
        .split(/\n(?=Q\d+:)/)
        .map(q => q.trim())
        .filter(q => q.length > 0);

      result[mode] = questions;
    }

    res.json(result);

  } catch (error) {
    console.error("❌ AI Question Error:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// AI endpoint to format story text
app.post("/api/format-story", async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, message: "No content provided" });
  }

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
            content: `Reformat the following story for readability. 
                      Keep words the same. Add proper line breaks and paragraph spacing.
                      Do not summarize, do not rewrite — only fix layout.\n\n${content}`
          }
        ],
        web_access: false,
      }),
    };

    const response = await fetch(url, options);
    const data = await response.json();

    // ✅ Handle both possible response formats
    let formatted = null;
    if (data.result) {
      formatted = data.result;
    } else if (data.choices && data.choices[0]?.message?.content) {
      formatted = data.choices[0].message.content;
    }

    if (!formatted) {
      console.error("⚠️ API response:", data);
      return res.status(500).json({ success: false, message: "AI returned no formatted text" });
    }

    res.json({ success: true, formatted });
  } catch (err) {
    console.error("❌ AI Format Story Error:", err);
    res.status(500).json({ success: false, message: "Failed to format story" });
  }
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
    const apiUrl = "https://chatgpt-42.p.rapidapi.com/texttoimage3";
    const options = {
      method: "POST",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
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
      const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");

      const imagesDir = path.join(__dirname, "../../uploads/images");
      if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

      const filename = `img_${Date.now()}.png`;
      const filepath = path.join(imagesDir, filename);
      fs.writeFileSync(filepath, buffer);

      const publicUrl = `${req.protocol}://${req.get("host")}/uploads/images/${encodeURIComponent(filename)}`;
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
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

//  node Back-end/js/server.js