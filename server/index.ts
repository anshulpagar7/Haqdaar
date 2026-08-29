import { loadEnv } from "./env";
loadEnv();                       // must run before anything reads process.env
import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT } from "./paths";
import { extract } from "./extract";
import { transcribe } from "./asr";
import { migrate, sweepExpired, db, dbError, storage, DB_FILE } from "./db/index";
import { seed } from "./db/seed";
import { catalogueCounts } from "./catalogue";
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

/* Boot: migrate, seed if empty, sweep expired saves.
 * Nothing here is allowed to stop the server from listening. A database that
 * will not open is a degraded mode, not a crash — the catalogue is still
 * readable from data/*.json, and /api/health reports what went wrong. */
let bootError: string | null = dbError
  ? `SQLite unavailable (${dbError.message.split("\n")[0]}) — try: npm rebuild better-sqlite3`
  : null;

try {
  if (db) {
    migrate();
    const count = (db.prepare("SELECT COUNT(*) c FROM scheme").get() as any).c as number;
    if (count === 0) seed(false);
    sweepExpired();
    setInterval(sweepExpired, 60 * 60 * 1000).unref();
  }
} catch (e: any) {
  bootError = `Database boot failed — ${e.message}`;
  console.error(`\n  ! ${bootError}`);
  console.error("    Serving the catalogue read-only from data/*.json. Try: npm run db:reset\n");
}

const mock = { extract: !process.env.GEMINI_API_KEY, asr: !process.env.GROQ_API_KEY };

app.get("/api/health", (_req, res) => {
  let schemes = 0;
  try { schemes = catalogueCounts().schemes; } catch { /* reported below */ }
  res.json({
    ok: true,
    mock,
    schemes,
    storage: bootError ? "json" : storage,
    db: DB_FILE,
    ...(bootError ? { warning: bootError } : {}),
  });
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

/* ── serving the app itself ──────────────────────────────────────
 * Two modes, decided by whether a production build exists:
 *
 *   dist/ present  → serve it from this port. One command, one URL,
 *                    which is what you want on a demo laptop or a VPS.
 *   dist/ absent   → we are in dev; Vite owns the UI on :5173. Anyone
 *                    who lands here gets sent there instead of the
 *                    bare "Cannot GET /" that Express would otherwise
 *                    return, which explains nothing.                */
const DIST = resolve(ROOT, "dist");
const WEB_PORT = Number(process.env.WEB_PORT || 5173);
const built = existsSync(join(DIST, "index.html"));

if (built) {
  app.use(express.static(DIST, { index: false, maxAge: "1h" }));
  app.get("*", (_req, res) => res.sendFile(join(DIST, "index.html")));
} else {
  const webUrl = `http://localhost:${WEB_PORT}`;
  app.get("*", (req, res) => {
    if (req.headers.accept?.includes("text/html")) return res.redirect(302, webUrl);
    res.status(404).json({
      error: `This is the HAQDAAR API. The app runs on ${webUrl}.`,
      hint: "Run `npm run dev` and open " + webUrl,
    });
  });
}

/* Bind 0.0.0.0 so the port answers on both 127.0.0.1 and ::1. Node's happy-eyeballs
 * resolver tries both for "localhost", and a v4-only bind is the usual cause of
 * AggregateError [ECONNREFUSED] behind a dev proxy on Windows. */
const server = app.listen(PORT, "0.0.0.0", () => {
  const n = (() => { try { return catalogueCounts().schemes; } catch { return 0; } })();
  /* The app URL first and on its own line: the API port serves no interface in
   * dev, and printing it at the top sent people to a bare Express 404. */
  console.log(`\n  ➜  OPEN THE APP AT   ${built
    ? `http://localhost:${PORT}`
    : `http://localhost:${WEB_PORT}`}\n`);
  console.log(`  api            http://127.0.0.1:${PORT}${built ? "" : "   (data only — no UI on this port)"}`);
  console.log(`  storage        ${bootError ? "data/*.json (read-only)" : `${storage} · ${DB_FILE}`} · ${n} schemes`);
  if (bootError) console.log(`  warning        ${bootError}`);
  console.log(`  extraction     ${mock.extract ? "MOCK (no GEMINI_API_KEY)" : "live · Gemini"}`);
  console.log(`  speech         ${mock.asr ? "MOCK (no GROQ_API_KEY)" : "live · Groq Whisper"}`);
  console.log(`  admin writes   ${process.env.ADMIN_KEY ? "enabled" : "disabled (set ADMIN_KEY)"}\n`);
});

server.on("error", (e: any) => {
  if (e.code === "EADDRINUSE") {
    console.error(`\n  ! Port ${PORT} is already in use — another copy of the API is running.`);
    console.error(`    Windows:  netstat -ano | findstr :${PORT}   then  taskkill /PID <pid> /F`);
    console.error(`    macOS/Linux:  lsof -ti:${PORT} | xargs kill\n`);
  } else {
    console.error(`\n  ! The API could not start: ${e.message}\n`);
  }
  process.exit(1);
});

/* A crash after boot should say so loudly rather than dying silently behind
 * concurrently's output multiplexing. */
process.on("uncaughtException", (e) => {
  console.error("\n  ! Uncaught error in the API process:", e);
});
process.on("unhandledRejection", (e) => {
  console.error("\n  ! Unhandled promise rejection in the API process:", e);
});
