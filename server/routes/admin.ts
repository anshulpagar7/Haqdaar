import { Router } from "express";
import { z } from "zod";
import { audit, db } from "../db/index";

export const adminRouter = Router();

/** Shared-secret gate. Set ADMIN_KEY in .env; without it admin writes are refused. */
adminRouter.use((req, res, next) => {
  const key = process.env.ADMIN_KEY;
  if (!key) return res.status(503).json({ error: "ADMIN_KEY is not configured on this server." });
  if (req.header("x-admin-key") !== key) return res.status(401).json({ error: "Unauthorised" });
  if (!db)
    return res.status(503).json({
      error: "Storage is read-only: SQLite is unavailable, so the catalogue cannot be edited.",
    });
  next();
});

const SchemeIn = z.object({
  id: z.string().min(3),
  name: z.object({ en: z.string(), hi: z.string(), mr: z.string() }),
  authority: z.string(),
  level: z.enum(["central", "state"]),
  state: z.string().optional(),
  benefit: z.record(z.string(), z.any()),
  criteria: z.array(z.object({ attr: z.string(), op: z.string(), value: z.any().optional() })),
  documents_required: z.array(z.string()),
  apply: z.record(z.string(), z.any()),
  how_to: z.record(z.string(), z.any()).optional(),
  deadline: z.string().optional(),
  clause_text: z.string().min(10),
  source_url: z.string().optional(),
  verified: z.boolean().optional(),
});

/** Add or replace a scheme without a redeploy — the claim the pitch makes. */
adminRouter.post("/schemes", (req, res) => {
  const p = SchemeIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid scheme", detail: p.error.issues });
  const s = p.data;
  db.prepare(`
    INSERT INTO scheme (id,name_en,name_hi,name_mr,authority,level,state,benefit_json,
      criteria_json,documents_json,apply_json,how_to_json,deadline,clause_text,source_url,
      last_verified,verified,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,date('now'),?,datetime('now'))
    ON CONFLICT(id) DO UPDATE SET name_en=excluded.name_en,name_hi=excluded.name_hi,
      name_mr=excluded.name_mr,authority=excluded.authority,level=excluded.level,
      state=excluded.state,benefit_json=excluded.benefit_json,criteria_json=excluded.criteria_json,
      documents_json=excluded.documents_json,apply_json=excluded.apply_json,
      how_to_json=excluded.how_to_json,deadline=excluded.deadline,clause_text=excluded.clause_text,
      source_url=excluded.source_url,last_verified=date('now'),verified=excluded.verified,
      updated_at=datetime('now')
  `).run(s.id, s.name.en, s.name.hi, s.name.mr, s.authority, s.level, s.state ?? null,
    JSON.stringify(s.benefit), JSON.stringify(s.criteria), JSON.stringify(s.documents_required),
    JSON.stringify(s.apply), JSON.stringify(s.how_to ?? null), s.deadline ?? null,
    s.clause_text, s.source_url ?? null, s.verified ? 1 : 0);
  audit("scheme.upsert", s.id);
  res.status(201).json({ ok: true, id: s.id });
});

/** Mark clause_text as checked against the official notification. */
adminRouter.post("/schemes/:id/verify", (req, res) => {
  const r = db.prepare(
    "UPDATE scheme SET verified = 1, last_verified = date('now'), updated_at = datetime('now') WHERE id = ?"
  ).run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: "No such scheme" });
  audit("scheme.verify", req.params.id);
  res.json({ ok: true });
});

adminRouter.delete("/schemes/:id", (req, res) => {
  const r = db.prepare("UPDATE scheme SET active = 0, updated_at = datetime('now') WHERE id = ?")
    .run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: "No such scheme" });
  audit("scheme.retire", req.params.id);
  res.json({ ok: true });
});

adminRouter.get("/audit", (_req, res) =>
  res.json(db.prepare("SELECT * FROM audit ORDER BY id DESC LIMIT 100").all()));
