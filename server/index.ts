import "dotenv/config";
import express from "express";
import cors from "cors";
import { extract } from "./extract";
import { transcribe } from "./asr";
import { migrate, sweepExpired, db } from "./db/index";
import { seed } from "./db/seed";
import { schemesRouter } from "./routes/schemes";
import { applicationsRouter } from "./routes/applications";
import { adminRouter } from "./routes/admin";
import { statsRouter } from "./routes/stats";

const app = express();
const PORT = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: "25mb" }));

/* one-line request log */
app.use((req, res, next) => {
  const t = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api"))
      console.log(`  ${res.statusCode} ${req.method} ${req.path} ${Date.now() - t}ms`);
  });
  next();
});

/* naive in-memory rate limit — enough to stop a runaway client */
const hits = new Map<string, { n: number; t: number }>();
app.use("/api", (req, res, next) => {
  const ip = req.ip ?? "local";
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now - e.t > 60_000) hits.set(ip, { n: 1, t: now });
  else if (++e.n > 240) return res.status(429).json({ error: "Slow down." });
  next();
});

/* boot: migrate, seed if empty, sweep expired saves */
migrate();
const count = (db.prepare("SELECT COUNT(*) c FROM scheme").get() as any).c as number;
if (count === 0) seed(false);
sweepExpired();
setInterval(sweepExpired, 60 * 60 * 1000).unref();

const mock = { extract: !process.env.GEMINI_API_KEY, asr: !process.env.GROQ_API_KEY };

app.get("/api/health", (_req, res) => {
  const c = db.prepare("SELECT COUNT(*) c FROM scheme WHERE active = 1").get() as any;
  res.json({ ok: true, mock, schemes: c.c, db: process.env.DATABASE_FILE || "data/haqdaar.db" });
});

app.use("/api", schemesRouter);
app.use("/api", applicationsRouter);
app.use("/api", statsRouter);
app.use("/api/admin", adminRouter);

app.post("/api/extract", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body ?? {};
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });
    res.json(await extract(imageBase64, mimeType));
  } catch (e: any) { res.status(502).json({ error: e.message }); }
});

app.post("/api/asr", async (req, res) => {
  try {
    const { audioBase64, mimeType, language } = req.body ?? {};
    if (!audioBase64) return res.status(400).json({ error: "audioBase64 required" });
    res.json(await transcribe(Buffer.from(audioBase64, "base64"), mimeType, language));
  } catch (e: any) { res.status(502).json({ error: e.message }); }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "No such endpoint" }));

app.listen(PORT, () => {
  const c = db.prepare("SELECT COUNT(*) c FROM scheme WHERE active = 1").get() as any;
  console.log(`\n  haqdaar api    http://localhost:${PORT}`);
  console.log(`  database       ${process.env.DATABASE_FILE || "data/haqdaar.db"} · ${c.c} schemes`);
  console.log(`  extraction     ${mock.extract ? "MOCK (no GEMINI_API_KEY)" : "live · Gemini"}`);
  console.log(`  speech         ${mock.asr ? "MOCK (no GROQ_API_KEY)" : "live · Groq Whisper"}`);
  console.log(`  admin writes   ${process.env.ADMIN_KEY ? "enabled" : "disabled (set ADMIN_KEY)"}\n`);
});
