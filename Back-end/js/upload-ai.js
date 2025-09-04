import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ API route to generate questions
app.post("/api/generate-questions", async (req, res) => {
  try {
    const { context } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates comprehension questions.",
        },
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
      temperature: 0.7,
    });

    res.json({
      questions: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
