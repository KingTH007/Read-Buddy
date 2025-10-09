// Netlify Function wrapper for Read-Buddy server
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const fetch = require("node-fetch");

// * Database connection with environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// * CORS configuration for production
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// * Helper function to handle CORS
const handleCORS = (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }
  return null;
};

// * Helper function to create response
const createResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: { ...corsHeaders, ...headers },
  body: JSON.stringify(body),
});

// * Main handler function
exports.handler = async (event, context) => {
  // * Handle CORS preflight
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const { httpMethod, path, body, queryStringParameters } = event;
    console.log("Netlify Function called:", { httpMethod, path, body });
    
    const pathSegments = path.replace("/api/", "").split("/");
    const endpoint = pathSegments[0];
    const id = pathSegments[1];
    
    console.log("Parsed path segments:", { endpoint, id, pathSegments });

    // * Parse request body
    let requestBody = {};
    if (body) {
      try {
        requestBody = JSON.parse(body);
      } catch (e) {
        return createResponse(400, { success: false, message: "Invalid JSON" });
      }
    }

    // * Route handling
    switch (httpMethod) {
      case "POST":
        switch (endpoint) {
          case "register":
            return await handleTeacherRegistration(requestBody);
          case "login":
            return await handleTeacherLogin(requestBody);
          case "student-login":
            return await handleStudentLogin(requestBody);
          case "save-story":
            return await handleSaveStory(requestBody);
          case "save-result":
            return await handleSaveResult(requestBody);
          case "api":
            if (id === "generate-questions") {
              return await handleGenerateQuestions(requestBody);
            } else if (id === "format-story") {
              return await handleFormatStory(requestBody);
            } else if (id === "generate-image") {
              return await handleGenerateImage(requestBody);
            }
            break;
        }
        break;

      case "GET":
        switch (endpoint) {
          case "get-classes":
            return await handleGetClasses(id);
          case "get-students":
            return await handleGetStudents(id);
          case "get-stories":
            if (id) {
              return await handleGetStories(id);
            } else {
              return await handleGetAllStories();
            }
          case "get-student-stories":
            return await handleGetStudentStories(id);
          case "get-story":
            return await handleGetStory(id);
        }
        break;

      case "PUT":
        if (endpoint === "update-story") {
          return await handleUpdateStory(id, requestBody);
        }
        break;

      case "DELETE":
        if (endpoint === "delete-class") {
          return await handleDeleteClass(id);
        } else if (endpoint === "delete-student") {
          return await handleDeleteStudent(id);
        }
        break;
    }

    return createResponse(404, { success: false, message: "Endpoint not found" });
  } catch (error) {
    console.error("❌ Server Error:", error);
    return createResponse(500, { success: false, message: "Internal server error" });
  }
};

// * Handler functions (copied from your server.js with minimal modifications)

async function handleTeacherRegistration({ fullname, email, password }) {
  try {
    const existing = await pool.query("SELECT * FROM teachers WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return createResponse(400, {
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

    return createResponse(200, { success: true, teacher: newTeacher.rows[0] });
  } catch (err) {
    console.error("❌ Teacher Registration Error:", err);
    return createResponse(500, { success: false, message: "Registration failed" });
  }
}

async function handleTeacherLogin({ email, password }) {
  try {
    const teacherQuery = await pool.query("SELECT * FROM teachers WHERE email = $1", [email]);
    if (teacherQuery.rows.length === 0) {
      return createResponse(400, { success: false, field: "email", message: "Email not found" });
    }

    const teacher = teacherQuery.rows[0];
    const validPassword = await bcrypt.compare(password, teacher.password);
    if (!validPassword) {
      return createResponse(400, {
        success: false,
        field: "password",
        message: "Incorrect password",
      });
    }

    return createResponse(200, {
      success: true,
      teacher: {
        id: teacher.id,
        fullname: teacher.fullname,
        email: teacher.email,
      },
    });
  } catch (err) {
    console.error("❌ Teacher Login Error:", err);
    return createResponse(500, { success: false, message: "Login failed" });
  }
}

async function handleStudentLogin({ fullname, code }) {
  try {
    const classExists = await pool.query("SELECT * FROM class WHERE code = $1", [code]);
    if (classExists.rows.length === 0) {
      return createResponse(400, { success: false, field: "code", message: "Invalid class code" });
    }

    const [surname, firstname] = fullname
      .replace(/\s+/g, " ")
      .trim()
      .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
      .split(/,|\s/)
      .map((n) => n.trim())
      .filter(Boolean);

    const normalizedFullName = `${surname}, ${firstname}`;

    let student = await pool.query(
      `SELECT * FROM students WHERE LOWER(fullname) = LOWER($1) AND code = $2`,
      [normalizedFullName, code]
    );

    if (student.rows.length === 0) {
      const reversedName = `${firstname}, ${surname}`;
      student = await pool.query(
        `SELECT * FROM students WHERE LOWER(fullname) = LOWER($1) AND code = $2`,
        [reversedName, code]
      );
    }

    if (student.rows.length === 0) {
      student = await pool.query(
        "INSERT INTO students (fullname, code) VALUES ($1, $2) RETURNING *",
        [normalizedFullName, code]
      );
      await pool.query("UPDATE class SET no_students = no_students + 1 WHERE code = $1", [code]);
    }

    const s = student.rows[0];
    return createResponse(200, {
      success: true,
      student: {
        id: s.id,
        fullname: s.fullname,
        code: s.code,
      },
    });
  } catch (err) {
    console.error("❌ Student Login Error:", err.message);
    return createResponse(500, { success: false, message: "Student login failed" });
  }
}

async function handleGetClasses(teacher_id) {
  try {
    const classes = await pool.query(
      "SELECT * FROM class WHERE teacher_id = $1 ORDER BY code DESC",
      [teacher_id]
    );
    return createResponse(200, { success: true, classes: classes.rows });
  } catch (err) {
    console.error("❌ Fetch Classes Error:", err.message);
    return createResponse(500, { success: false, message: "Failed to fetch classes" });
  }
}

async function handleGetStudents(code) {
  try {
    const students = await pool.query(
      "SELECT * FROM students WHERE code = $1 ORDER BY id DESC",
      [code]
    );
    return createResponse(200, { success: true, students: students.rows });
  } catch (err) {
    console.error("❌ Fetch Students Error:", err.message);
    return createResponse(500, { success: false, message: "Failed to fetch students" });
  }
}

async function handleSaveStory({ teach_id, storyname, storycontent, storyquest, storyimage }) {
  try {
    const result = await pool.query(
      `INSERT INTO teach_story (teach_id, storyname, storycontent, storyquest, storyimage) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [teach_id, storyname, storycontent, storyquest, storyimage]
    );
    return createResponse(200, { success: true, story: result.rows[0] });
  } catch (err) {
    console.error("❌ Error saving story:", err);
    return createResponse(500, { success: false, message: err.message || "Failed to save story" });
  }
}

async function handleGetStories(teacherId) {
  try {
    const result = await pool.query(
      "SELECT * FROM teach_story WHERE teach_id = $1 ORDER BY story_id DESC",
      [teacherId]
    );
    return createResponse(200, { success: true, stories: result.rows });
  } catch (err) {
    console.error("❌ Error fetching stories:", err);
    return createResponse(500, { success: false, message: "Failed to fetch stories" });
  }
}

async function handleGetAllStories() {
  try {
    const result = await pool.query(
      "SELECT story_id AS id, storyname FROM teach_story ORDER BY story_id DESC"
    );
    return createResponse(200, { success: true, stories: result.rows });
  } catch (err) {
    console.error("❌ Error fetching stories:", err.message);
    return createResponse(500, { success: false, message: "Failed to fetch stories" });
  }
}

async function handleGetStudentStories(studentId) {
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
    return createResponse(200, { success: true, stories: result.rows });
  } catch (err) {
    console.error("❌ Error fetching student stories:", err);
    return createResponse(200, { success: false, message: "Database error" });
  }
}

async function handleGetStory(id) {
  try {
    const result = await pool.query("SELECT * FROM teach_story WHERE story_id = $1", [id]);
    if (result.rows.length === 0) {
      return createResponse(404, { success: false, message: "Story not found" });
    }
    return createResponse(200, { success: true, story: result.rows[0] });
  } catch (err) {
    console.error("❌ Error fetching story:", err);
    return createResponse(500, { success: false, message: "Database error" });
  }
}

async function handleUpdateStory(id, body) {
  try {
    if (!body || Object.keys(body).length === 0) {
      return createResponse(400, { success: false, message: "No fields provided to update" });
    }

    const current = await pool.query("SELECT * FROM teach_story WHERE story_id = $1", [id]);
    if (current.rows.length === 0) {
      return createResponse(404, { success: false, message: "Story not found" });
    }

    const story = current.rows[0];
    const storyname = body.storyname ?? story.storyname;
    const storycontent = body.storycontent ?? story.storycontent;
    const storyquest = body.storyquest ?? story.storyquest;
    const storyimage = body.storyimage ?? story.storyimage;

    const result = await pool.query(
      `UPDATE teach_story
       SET storyname = $1, storycontent = $2, storyquest = $3, storyimage = $4
       WHERE story_id = $5
       RETURNING *`,
      [storyname, storycontent, storyquest, storyimage, id]
    );

    return createResponse(200, { success: true, story: result.rows[0] });
  } catch (err) {
    console.error("❌ Error updating story:", err);
    return createResponse(500, { success: false, message: "Failed to update story", error: err.message });
  }
}

async function handleDeleteClass(code) {
  try {
    const deleted = await pool.query("DELETE FROM class WHERE code = $1 RETURNING *", [code]);
    if (deleted.rows.length === 0) {
      return createResponse(404, { success: false, message: "Class not found" });
    }
    return createResponse(200, { success: true, class: deleted.rows[0] });
  } catch (err) {
    console.error("❌ Delete Class Error:", err.message);
    return createResponse(500, { success: false, message: "Failed to delete class" });
  }
}

async function handleDeleteStudent(id) {
  try {
    const deleted = await pool.query("DELETE FROM students WHERE id = $1 RETURNING *", [id]);
    if (deleted.rows.length === 0) {
      return createResponse(404, { success: false, message: "Student not found" });
    }
    return createResponse(200, { success: true, student: deleted.rows[0] });
  } catch (err) {
    console.error("❌ Delete Student Error:", err.message);
    return createResponse(500, { success: false, message: "Failed to delete student" });
  }
}

async function handleSaveResult({ student_id, story_id, read_speed, read_score, final_grade }) {
  if (!student_id || !story_id) {
    return createResponse(400, { success: false, message: "Missing data" });
  }

  try {
    const query = `
      INSERT INTO s_storyresult (student_id, story_id, read_speed, read_score, final_grade)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const values = [student_id, story_id, read_speed, read_score, final_grade];
    const result = await pool.query(query, values);
    return createResponse(200, { success: true, result: result.rows[0] });
  } catch (err) {
    console.error("❌ DB Insert Error:", err);
    return createResponse(500, { success: false, message: "Database error" });
  }
}

// * AI API handlers
async function handleGenerateQuestions({ context }) {
  if (!context) return createResponse(400, { error: "No context provided" });

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
    return createResponse(200, { questions: data.result || ["No questions generated"] });
  } catch (error) {
    console.error("❌ AI Question Error:", error);
    return createResponse(500, { error: "Failed to generate questions" });
  }
}

async function handleFormatStory({ content }) {
  if (!content) {
    return createResponse(400, { success: false, message: "No content provided" });
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
                      Do not summarize, do not rewrite — only fix layout.\n\n${content}`,
          },
        ],
        web_access: false,
      }),
    };

    const response = await fetch(url, options);
    const data = await response.json();

    let formatted = null;
    if (data.result) {
      formatted = data.result;
    } else if (data.choices && data.choices[0]?.message?.content) {
      formatted = data.choices[0].message.content;
    }

    if (!formatted) {
      console.error("⚠️ API response:", data);
      return createResponse(500, { success: false, message: "AI returned no formatted text" });
    }

    return createResponse(200, { success: true, formatted });
  } catch (err) {
    console.error("❌ AI Format Story Error:", err);
    return createResponse(500, { success: false, message: "Failed to format story" });
  }
}

async function handleGenerateImage({ prompt, size = "1-1", refImage = "" }) {
  if (!prompt) return createResponse(400, { error: "No prompt provided" });

  try {
    const url = "https://ghibli-image-generator-api-open-ai-4o-image-generation-free.p.rapidapi.com/generateghibliimage.php";
    const options = {
      method: "POST",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY || "1098f4e1fbmsha80729b29b72a9ep12b064jsn104e5f142388",
        "x-rapidapi-host": "ghibli-image-generator-api-open-ai-4o-image-generation-free.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        size,
        refImage,
        refWeight: 1,
      }),
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Image API Response Error:", errorText);
      return createResponse(500, { error: "Failed to generate image", details: errorText });
    }

    const result = await response.text();
    console.log("✅ AI Image Response:", result);
    return createResponse(200, { generatedImage: result });
  } catch (error) {
    console.error("❌ AI Image Error:", error);
    return createResponse(500, { error: "Failed to generate image", details: error.message });
  }
}
