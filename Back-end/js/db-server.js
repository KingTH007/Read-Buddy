const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 5000;

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "readbuddyDB",   
  password: "errorsyntax0!",
  port: 5432,
});

app.use(cors());
app.use(bodyParser.json());

/**
 * Teacher Registration
 */
app.post("/register", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // Check if email already exists
    const existing = await pool.query("SELECT * FROM teachers WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        field: "email", 
        message: "This email has been used, please use another." 
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = await pool.query(
      "INSERT INTO teachers (fullname, email, password) VALUES ($1, $2, $3) RETURNING *",
      [fullname, email, hashedPassword]
    );

    res.json({ success: true, teacher: newTeacher.rows[0] });
  } catch (err) {
    console.error(err);
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
      return res.status(400).json({ 
        success: false, 
        field: "email", 
        message: "Email not found" 
      });
    }

    const validPassword = await bcrypt.compare(password, teacher.rows[0].password);

    if (!validPassword) {
      return res.status(400).json({ 
        success: false, 
        field: "password", 
        message: "Incorrect password" 
      });
    }

    res.json({ success: true, teacher: teacher.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed" });
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
 * Student "Login" (auto-register if new)
 */
app.post("/student-login", async (req, res) => {
  try {
    const { fullname, code } = req.body;

    // Check if class exists
    const classExists = await pool.query("SELECT * FROM class WHERE code = $1", [code]);
    if (classExists.rows.length === 0) {
      return res.status(400).json({ success: false, field: "code", message: "Invalid class code" });
    }

    // Check if student already exists in this class
    let student = await pool.query(
      "SELECT * FROM students WHERE fullname = $1 AND code = $2",
      [fullname, code]
    );

    if (student.rows.length === 0) {
      // If not exists → insert student
      student = await pool.query(
        "INSERT INTO students (fullname, code) VALUES ($1, $2) RETURNING *",
        [fullname, code]
      );

      // Update class student count
      await pool.query("UPDATE class SET no_students = no_students + 1 WHERE code = $1", [code]);

      io.emit("student-joined", { code });
    }

    res.json({ success: true, student: student.rows[0] });

  } catch (err) {
    console.error("❌ Student login error:", err.message);
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
    console.error("❌ Error fetching classes:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch classes" });
  }
});


server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

//RUN THE SERVER WITH: node Back-end/js/db-server.js