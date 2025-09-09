// Back-end/js/upload-ai.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../../Front-end")));

// API route for generating questions
app.post("/api/generate-questions", async (req, res) => {
  const { context } = req.body;

  if (!context) {
    return res.status(400).json({ error: "No context provided" });
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
    console.error("❌ RapidAPI Error:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
