import { Router } from "express";
import { db } from "../db/index";

export const statsRouter = Router();

/** Anonymous aggregates — no personal data is stored to aggregate. */
statsRouter.get("/stats", (_req, res) => {
  const g = <T>(sql: string): T => db.prepare(sql).get() as T;
  const totals = g<{ runs: number; avg_q: number; avg_matched: number; value: number }>(`
    SELECT COUNT(*) runs,
           ROUND(AVG(questions),1) avg_q,
           ROUND(AVG(matched),1) avg_matched,
           COALESCE(SUM(total_value),0) value
    FROM event WHERE kind = 'application'`);

  const top = db.prepare(`
    SELECT e.scheme_id id, s.name_en name, COUNT(*) hits
    FROM event e JOIN scheme s ON s.id = e.scheme_id
    WHERE e.kind = 'match' GROUP BY e.scheme_id ORDER BY hits DESC LIMIT 8`).all();

  const catalogue = g<{ schemes: number; verified: number; states: number }>(`
    SELECT COUNT(*) schemes,
           SUM(verified) verified,
           COUNT(DISTINCT state) states
    FROM scheme WHERE active = 1`);

  res.json({ catalogue, totals, top_schemes: top });
});
