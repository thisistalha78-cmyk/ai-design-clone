import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

/* =========================
   BASIC SETUP
========================= */
dotenv.config();
const app = express();

/* Fix __dirname for ES Modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Middleware */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   FETCH WEBSITE HTML
========================= */
async function fetchWebsiteHTML(url) {
  const response = await axios.get(url, {
    headers: { "User-Agent": "DesignPatternBot" },
    timeout: 15000
  });
  return response.data;
}

/* =========================
   EXTRACT DESIGN SIGNALS
========================= */
function extractDesignSignals(html) {
  const $ = cheerio.load(html);

  return {
    layout: {
      sections: $("section").length,
      navbars: $("nav").length,
      footers: $("footer").length,
      usesFlex: html.includes("flex"),
      usesGrid: html.includes("grid")
    },
    colors: $("style").text().match(/#[0-9a-fA-F]{3,6}/g) || [],
    typography: $("style").text().match(/font-family:[^;]+/gi) || []
  };
}

/* =========================
   CALL DEEPSEEK API
========================= */
async function callDeepSeek(designData) {
  const response = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are a professional UI/UX designer. Explain analyzed design patterns and generate a NEW original HTML website with embedded CSS. Do not copy content, images, or branding."
        },
        {
          role: "user",
          content: JSON.stringify(designData, null, 2)
        }
      ],
      temperature: 0.6
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.DEEPSEEK_API_KEY
      }
    }
  );

  return response.data.choices[0].message.content;
}

/* =========================
   API ROUTE
========================= */
app.post("/analyze", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const html = await fetchWebsiteHTML(url);
    const designData = extractDesignSignals(html);
    const result = await callDeepSeek(designData);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: "Failed to analyze website" });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
