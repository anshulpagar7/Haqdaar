/** npm run doctor — check everything the app needs before you blame the app.
 *
 *  Prints one line per check and, where a check fails, the exact command that
 *  fixes it on this platform. Written because "AggregateError [ECONNREFUSED]"
 *  in a proxy log tells you nothing about which of six things went wrong. */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createConnection } from "node:net";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 8787);
const win = process.platform === "win32";

let failures = 0;
const ok = (msg: string) => console.log(`  \x1b[32mok\x1b[0m    ${msg}`);
const warn = (msg: string, fix?: string) => {
  console.log(`  \x1b[33mwarn\x1b[0m  ${msg}`);
  if (fix) console.log(`        → ${fix}`);
};
const bad = (msg: string, fix?: string) => {
  failures++;
  console.log(`  \x1b[31mFAIL\x1b[0m  ${msg}`);
  if (fix) console.log(`        → ${fix}`);
};

console.log("\n  haqdaar doctor\n");

/* 1 — Node */
const major = Number(process.versions.node.split(".")[0]);
if (major >= 18) ok(`Node ${process.versions.node}`);
else bad(`Node ${process.versions.node} is too old`, "Install Node 20 LTS from nodejs.org");

/* 2 — cwd */
if (existsSync(resolve(ROOT, "package.json"))) ok(`project root ${ROOT}`);
else bad("package.json not found", "Run npm commands from the haqdaar folder");

/* 3 — data files */
for (const f of ["schemes.json", "attributes.json", "how-to-apply.json", "personas.json"]) {
  const p = resolve(ROOT, "data", f);
  if (!existsSync(p)) { bad(`data/${f} is missing`, "Re-download or re-clone the project"); continue; }
  try {
    const j = JSON.parse(readFileSync(p, "utf8"));
    ok(`data/${f} — ${Array.isArray(j) ? j.length : Object.keys(j).length} entries`);
  } catch (e: any) { bad(`data/${f} is not valid JSON — ${e.message}`); }
}

/* 4 — node_modules */
if (existsSync(resolve(ROOT, "node_modules", "vite"))) ok("dependencies installed");
else bad("node_modules is missing or incomplete", "npm install");

/* 5 — the native module, the usual Windows casualty */
try {
  const require = createRequire(import.meta.url);
  const Database = require("better-sqlite3");
  const probe = new Database(":memory:");
  probe.exec("CREATE TABLE t (a)");
  probe.close();
  ok("better-sqlite3 loads (SQLite storage available)");
} catch (e: any) {
  warn(
    `better-sqlite3 will not load — ${String(e.message).split("\n")[0]}`,
    win
      ? "npm rebuild better-sqlite3   (or install Visual Studio Build Tools). " +
        "The app still runs read-only from data/*.json without it."
      : "npm rebuild better-sqlite3 — the app still runs read-only from data/*.json without it."
  );
}

/* 6 — is anything already on the API port */
const portState = await new Promise<"free" | "busy">((res) => {
  const s = createConnection({ port: PORT, host: "127.0.0.1" });
  const done = (v: "free" | "busy") => { s.destroy(); res(v); };
  s.on("connect", () => done("busy"));
  s.on("error", () => done("free"));
  setTimeout(() => done("free"), 1200);
});

if (portState === "busy") {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/api/health`);
    const j: any = await r.json();
    ok(`API answering on :${PORT} — ${j.schemes} schemes, storage ${j.storage}`);
    if (j.warning) warn(j.warning);
  } catch {
    bad(
      `something is on :${PORT} but it is not the haqdaar API`,
      win
        ? `netstat -ano | findstr :${PORT}   then  taskkill /PID <pid> /F`
        : `lsof -ti:${PORT} | xargs kill`
    );
  }
} else {
  warn(
    `nothing is listening on :${PORT} — the API is not running`,
    "npm run dev   (starts web + api)   or   npm run dev:api   (api alone, shows its errors)"
  );
}

console.log(
  failures
    ? `\n  ${failures} blocking problem(s). Fix the FAILs above, then run npm run doctor again.\n`
    : "\n  No blocking problems. Start with: npm run dev\n"
);
process.exit(failures ? 1 : 0);
