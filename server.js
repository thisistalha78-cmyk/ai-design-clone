import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

/* =========================
   BASIC SETUP
========================= */
dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   AI WEBSITE GENERATOR
   (OpenRouter + DeepSeek R1T Chimera)
========================= */
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "tngtech/deepseek-r1t-chimera:free",
        messages: [
          {
            role: "system",
            content:
              "You are an expert web designer. Generate a complete, modern, responsive website using HTML and CSS only. Use embedded <style>. Output ONLY valid HTML. Do not explain."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "AI Website Builder"
        }
      }
    );

    res.json({
      html: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "AI generation failed"
    });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});

