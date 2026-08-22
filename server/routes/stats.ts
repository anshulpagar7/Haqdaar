import { Router } from "express";
import { db } from "../db/index";
import { catalogueCounts } from "../catalogue";

export const statsRouter = Router();

const EMPTY = { runs: 0, avg_q: 0, avg_matched: 0, value: 0 };

/** Anonymous aggregates — no personal data is stored to aggregate. */
statsRouter.get("/stats", (_req, res) => {
  const catalogue = catalogueCounts();

  if (!db)
    return res.json({ catalogue, totals: EMPTY, top_schemes: [], storage: "memory" });

  const g = <T>(sql: string): T => db.prepare(sql).get() as T;
  const totals = g<typeof EMPTY>(`
    SELECT COUNT(*) runs,
           ROUND(AVG(questions),1) avg_q,
           ROUND(AVG(matched),1) avg_matched,
           COALESCE(SUM(total_value),0) value
    FROM event WHERE kind = 'application'`);

  const top = db.prepare(`
    SELECT e.scheme_id id, s.name_en name, COUNT(*) hits
    FROM event e JOIN scheme s ON s.id = e.scheme_id
    WHERE e.kind = 'match' GROUP BY e.scheme_id ORDER BY hits DESC LIMIT 8`).all();

  res.json({ catalogue, totals, top_schemes: top, storage: "sqlite" });
});
