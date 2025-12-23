import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   AI WEBSITE GENERATOR
========================= */
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({
      html: "<h1>Please enter a prompt</h1>"
    });
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
              "You are an expert web designer. Generate a complete modern SaaS landing page using ONLY HTML and CSS. Use <style> inside HTML. Return ONLY valid HTML. No explanation."
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
          Authorization: "Bearer " + process.env.OPENROUTER_API_KEY,
          "HTTP-Referer": "https://example.com",
          "X-Title": "AI Website Builder"
        }
      }
    );

    const html =
      response?.data?.choices?.[0]?.message?.content;

    res.json({
      html: html || "<h1>AI returned no content</h1>"
    });
  } catch (error) {
    console.error("AI ERROR:", error.message);

    res.json({
      html:
        "<h1>Error generating website</h1><p>Check API key or rate limit.</p>"
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

