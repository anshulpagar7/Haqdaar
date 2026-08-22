import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index";

export const applicationsRouter = Router();

const Body = z.object({
  lang: z.enum(["en", "hi", "mr"]).default("en"),
  profile: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  docsHeld: z.array(z.string()).default([]),
  eligibleIds: z.array(z.string()),
  totalValue: z.number().int().nonnegative().default(0),
  questionsAsked: z.number().int().nonnegative().default(0),
});

/** Reference codes people can read aloud over a phone: no 0/O, no 1/I. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const makeRef = () =>
  "HQ-" + Array.from({ length: 6 }, () =>
    ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

/** Identity numbers never reach us, but strip anything that looks like one anyway. */
const SENSITIVE = /aadhaar|account|uid|card_no|mobile|phone/i;
const scrub = (p: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(p).filter(([k]) => !SENSITIVE.test(k)));

applicationsRouter.post("/applications", (req, res) => {
  const parsed = Body.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid application", detail: parsed.error.issues });

  const { lang, profile, docsHeld, eligibleIds, totalValue, questionsAsked } = parsed.data;
  const reference = makeRef();

  db.prepare(`
    INSERT INTO application (reference, expires_at, lang, profile_json, docs_json, eligible_json, total_value)
    VALUES (?, datetime('now','+30 days'), ?, ?, ?, ?, ?)
  `).run(reference, lang, JSON.stringify(scrub(profile)),
         JSON.stringify(docsHeld), JSON.stringify(eligibleIds), totalValue);

  db.prepare("INSERT INTO event (kind, questions, matched, total_value) VALUES ('application', ?, ?, ?)")
    .run(questionsAsked, eligibleIds.length, totalValue);
  const ev = db.prepare("INSERT INTO event (kind, scheme_id) VALUES ('match', ?)");
  for (const id of eligibleIds) ev.run(id);

  res.status(201).json({ reference, expires_in_days: 30 });
});

applicationsRouter.get("/applications/:reference", (req, res) => {
  const r: any = db.prepare(
    "SELECT * FROM application WHERE reference = ? AND expires_at > datetime('now')"
  ).get(req.params.reference.toUpperCase());
  if (!r) return res.status(404).json({ error: "Not found, or the saved application has expired." });

  res.json({
    reference: r.reference,
    created_at: r.created_at,
    expires_at: r.expires_at,
    lang: r.lang,
    profile: JSON.parse(r.profile_json),
    docsHeld: JSON.parse(r.docs_json),
    eligibleIds: JSON.parse(r.eligible_json),
    totalValue: r.total_value,
  });
});
