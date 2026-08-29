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

/** One call for the client bootstrap — the same payload the Express route serves.
 *  The serverless build has no SQLite, so data/*.json is the catalogue. */
export default function handler(_req: any, res: any) {
  try {
    const schemes = load<any[]>("schemes.json");
    const howTo = load<any>("how-to-apply.json");
    const attributes = load("attributes.json");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json({
      schemes: schemes.map((s) => ({
        ...s,
        how_to: howTo[s.id] ?? howTo._default ?? null,
        verified: !!s.verified,
      })),
      attributes,
    });
  } catch (e: any) {
    res.status(500).json({ error: `Could not load the catalogue — ${e.message}` });
  }
}
