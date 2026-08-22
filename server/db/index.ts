import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const FILE = process.env.DATABASE_FILE || "data/haqdaar.db";

mkdirSync(dirname(resolve(FILE)), { recursive: true });

export const db = new Database(FILE);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/** Apply the schema. Idempotent — safe on every boot. */
export function migrate() {
  const sql = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  db.exec(sql);
}

/** Drop applications past their expiry. Called on boot and hourly. */
export function sweepExpired(): number {
  const r = db.prepare("DELETE FROM application WHERE expires_at < datetime('now')").run();
  return r.changes;
}

export function audit(action: string, target?: string, detail?: string) {
  db.prepare("INSERT INTO audit (action, target, detail) VALUES (?, ?, ?)")
    .run(action, target ?? null, detail ?? null);
}
