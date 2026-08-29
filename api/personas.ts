/* Self-contained on purpose: no JSON imports (Node ESM rejects them without
   `with { type: "json" }`, which is what made this route 500 on Vercel) and no
   cross-file import (extensionless specifiers break in unbundled ESM). Twenty
   duplicated lines beat a 500 in front of a judge. */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const here = (() => {
  try { return dirname(fileURLToPath(import.meta.url)); } catch { return process.cwd(); }
})();
const ROOTS = [
  resolve(here, "../data"), resolve(here, "../../data"),
  resolve(process.cwd(), "data"), "/var/task/data",
];
const load = <T,>(name: string): T => {
  for (const root of ROOTS) {
    const p = join(root, name);
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8")) as T;
  }
  throw new Error(`data/${name} not found (looked in ${ROOTS.join(", ")})`);
};

/** Synthetic specimens for the demo. No real citizen's document is ever used. */
export default function handler(_req: any, res: any) {
  try {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(load("personas.json"));
  } catch (e: any) {
    res.status(500).json({ error: `Could not load the specimens — ${e.message}` });
  }
}
