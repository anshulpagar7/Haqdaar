/** Load .env from the project root, not from wherever the process happened to
 *  start — and say something useful when the file is there but wrong.
 *
 *  The two failures this exists for, both silent before:
 *    1. Notepad on Windows saves ".env" as ".env.txt" without telling you.
 *    2. The server is started from a sub-folder, so cwd-relative loading misses.
 */
import { existsSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { ROOT } from "./paths";

const ENV = resolve(ROOT, ".env");

export function loadEnv() {
  if (existsSync(ENV)) {
    config({ path: ENV });
    return;
  }

  /* The Notepad trap. Loud, because a silent MOCK banner three steps later is
     a much worse way to find out. */
  for (const wrong of [".env.txt", ".env.env", "env", ".env.local.txt"]) {
    const p = resolve(ROOT, wrong);
    if (!existsSync(p)) continue;
    console.warn(`\n  ! Found "${wrong}" but no ".env" — Windows editors add .txt silently.`);
    try {
      renameSync(p, ENV);
      console.warn(`    Renamed it to ".env" for you.\n`);
      config({ path: ENV });
    } catch {
      console.warn(`    Rename it to ".env" (in PowerShell:  Rename-Item ${wrong} .env)\n`);
    }
    return;
  }

  config({ path: ENV });   // harmless no-op; keys may come from the shell
}
