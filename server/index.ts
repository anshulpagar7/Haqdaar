import "dotenv/config";
import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";
import { extract } from "./extract";
import { transcribe } from "./asr";

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

const PORT = Number(process.env.PORT || 8787);
const mockMode = { extract: !process.env.GEMINI_API_KEY, asr: !process.env.GROQ_API_KEY };

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mock: mockMode, model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
});

/** Scheme + attribute data, served so the client never bundles a stale copy. */
app.get("/api/data", (_req, res) => {
  res.json({
    schemes: JSON.parse(readFileSync("data/schemes.json", "utf8")),
    attributes: JSON.parse(readFileSync("data/attributes.json", "utf8")),
  });
});

app.post("/api/extract", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body ?? {};
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });
    res.json(await extract(imageBase64, mimeType));
  } catch (e: any) {
    console.error("[extract]", e.message);
    res.status(502).json({ error: e.message });
  }
});

app.post("/api/asr", async (req, res) => {
  try {
    const { audioBase64, mimeType, language } = req.body ?? {};
    if (!audioBase64) return res.status(400).json({ error: "audioBase64 required" });
    res.json(await transcribe(Buffer.from(audioBase64, "base64"), mimeType, language));
  } catch (e: any) {
    console.error("[asr]", e.message);
    res.status(502).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  haqdaar api   http://localhost:${PORT}`);
  console.log(`  extraction    ${mockMode.extract ? "MOCK (no GEMINI_API_KEY)" : "live · Gemini"}`);
  console.log(`  speech        ${mockMode.asr ? "MOCK (no GROQ_API_KEY)" : "live · Groq Whisper"}\n`);
});
