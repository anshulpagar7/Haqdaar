/** Storage.
 *
 *  SQLite is the real store. But better-sqlite3 is a native module, and on a
 *  machine without build tools it can fail to load — which used to take the
 *  whole API process down at import time and leave the browser staring at a
 *  dead port. So the load is guarded: if it fails we run read-only from the
 *  JSON catalogue and keep saved applications in memory for the session.
 *  The demo always works; `/api/health` says which mode it is in. */
import { createRequire } from "node:module";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ROOT, dataFile } from "../paths";

export type StorageMode = "sqlite" | "memory";

let _db: any = null;
let _error: Error | null = null;

export const DB_FILE = process.env.DATABASE_FILE
  ? resolve(ROOT, process.env.DATABASE_FILE)
  : dataFile("haqdaar.db");

try {
  const require = createRequire(import.meta.url);
  const Database = require("better-sqlite3");
  mkdirSync(dirname(DB_FILE), { recursive: true });
  _db = new Database(DB_FILE);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
} catch (e: any) {
  _error = e instanceof Error ? e : new Error(String(e));
  _db = null;
}

/** The SQLite handle, or null when the native module could not load. */
export const db: any = _db;
/** Why storage is degraded, if it is. */
export const dbError = _error;
export const storage: StorageMode = _db ? "sqlite" : "memory";

/** Apply the schema. Idempotent — safe on every boot. No-op without SQLite. */
export function migrate() {
  if (!_db) return;
  const sql = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  _db.exec(sql);
}

/** Drop applications past their expiry. Called on boot and hourly. */
export function sweepExpired(): number {
  if (!_db) return 0;
  return _db.prepare("DELETE FROM application WHERE expires_at < datetime('now')").run().changes;
}

export function audit(action: string, target?: string, detail?: string) {
  if (!_db) return;
  _db.prepare("INSERT INTO audit (action, target, detail) VALUES (?, ?, ?)")
    .run(action, target ?? null, detail ?? null);
}
