import { Router } from "express";
import { allSchemes, schemeById, allAttributes, allPersonas } from "../catalogue";

export const schemesRouter = Router();

schemesRouter.get("/schemes", (_req, res) => res.json(allSchemes()));

schemesRouter.get("/schemes/:id", (req, res) => {
  const s = schemeById(req.params.id);
  if (!s) return res.status(404).json({ error: "No such scheme" });
  res.json(s);
});

schemesRouter.get("/attributes", (_req, res) => res.json(allAttributes()));

/** One call for the client bootstrap. */
schemesRouter.get("/data", (_req, res) =>
  res.json({ schemes: allSchemes(), attributes: allAttributes() }));

/** Synthetic personas used for testing and for the demo. Clearly labelled as
 *  specimens — no real citizen's document is ever used. */
schemesRouter.get("/personas", (_req, res) => res.json(allPersonas()));
