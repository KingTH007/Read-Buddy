const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 5000;

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
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, teacher.rows[0].password);

    if (!validPassword) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    res.json({ success: true, teacher: teacher.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

//RUN THE SERVER WITH: node Back-end/js/db-server.js