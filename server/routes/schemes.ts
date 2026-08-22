import { Router } from "express";
import { readFileSync } from "node:fs";
import { db } from "../db/index";

export const schemesRouter = Router();

const rowToScheme = (r: any) => ({
  id: r.id,
  name: { en: r.name_en, hi: r.name_hi, mr: r.name_mr },
  authority: r.authority,
  level: r.level,
  ...(r.state ? { state: r.state } : {}),
  benefit: JSON.parse(r.benefit_json),
  criteria: JSON.parse(r.criteria_json),
  documents_required: JSON.parse(r.documents_json),
  apply: JSON.parse(r.apply_json),
  how_to: r.how_to_json ? JSON.parse(r.how_to_json) : null,
  deadline: r.deadline ?? undefined,
  clause_text: r.clause_text,
  source_url: r.source_url ?? undefined,
  last_verified: r.last_verified ?? undefined,
  verified: !!r.verified,
});

const allSchemes = () =>
  db.prepare("SELECT * FROM scheme WHERE active = 1 ORDER BY level DESC, id").all().map(rowToScheme);

const allAttributes = () =>
  Object.fromEntries(
    db.prepare("SELECT key, def_json FROM attribute").all()
      .map((r: any) => [r.key, JSON.parse(r.def_json)])
  );

schemesRouter.get("/schemes", (_req, res) => res.json(allSchemes()));

schemesRouter.get("/schemes/:id", (req, res) => {
  const r = db.prepare("SELECT * FROM scheme WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "No such scheme" });
  res.json(rowToScheme(r));
});

schemesRouter.get("/attributes", (_req, res) => res.json(allAttributes()));

/** One call for the client bootstrap. */
schemesRouter.get("/data", (_req, res) =>
  res.json({ schemes: allSchemes(), attributes: allAttributes() }));

/** Synthetic personas used for testing and for the demo. Clearly labelled as
 *  specimens — no real citizen's document is ever used. */
schemesRouter.get("/personas", (_req, res) => {
  res.json(JSON.parse(readFileSync("data/personas.json", "utf8")));
});
