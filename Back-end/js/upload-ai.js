// Back-end/js/upload-ai.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../Front-end")));

// API route for generating questions
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
    console.error("❌ RapidAPI Error:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// API route for generating image
// API route for generating images using Ghibli API
app.post("/api/generate-image", async (req, res) => {
  const { image_url } = req.body;

  if (!image_url) {
    return res.status(400).json({ error: "No image_url provided" });
  }

  try {
    const url = "https://ghibli-studio-ai.p.rapidapi.com/bot.php";
    const options = {
      method: "POST",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY, // ✅ use your .env key
        "x-rapidapi-host": "ghibli-studio-ai.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: image_url, // ✅ must stringify
      }),
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ RapidAPI Response Error:", errorText);
      return res.status(500).json({ error: "Failed to generate image", details: errorText });
    }

    const result = await response.text(); // Ghibli API sends text, not JSON
    console.log("✅ AI Image Response:", result);

    res.json({ generatedImage: result });
  } catch (error) {
    console.error("❌ Ghibli API Error:", error);
    res.status(500).json({ error: "Failed to generate image", details: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
