import { readFileSync } from "node:fs";
import { db, migrate, audit } from "./index";
import { dataFile } from "../paths";

/** Load data/*.json into the database. Run with: npm run db:seed
 *  Upserts, so it is safe to run repeatedly after editing the JSON. */
export function seed(verbose = true) {
  if (!db) {
    if (verbose) console.log("no SQLite — nothing to seed; the catalogue is read straight from data/*.json");
    return;
  }
  migrate();
  const schemes = JSON.parse(readFileSync(dataFile("schemes.json"), "utf8"));
  const attributes = JSON.parse(readFileSync(dataFile("attributes.json"), "utf8"));
  const howTo = JSON.parse(readFileSync(dataFile("how-to-apply.json"), "utf8"));

  const upScheme = db.prepare(`
    INSERT INTO scheme (id,name_en,name_hi,name_mr,authority,level,state,
      benefit_json,criteria_json,documents_json,apply_json,how_to_json,
      deadline,clause_text,source_url,last_verified,verified,updated_at)
    VALUES (@id,@name_en,@name_hi,@name_mr,@authority,@level,@state,
      @benefit_json,@criteria_json,@documents_json,@apply_json,@how_to_json,
      @deadline,@clause_text,@source_url,@last_verified,@verified,datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name_en=excluded.name_en, name_hi=excluded.name_hi, name_mr=excluded.name_mr,
      authority=excluded.authority, level=excluded.level, state=excluded.state,
      benefit_json=excluded.benefit_json, criteria_json=excluded.criteria_json,
      documents_json=excluded.documents_json, apply_json=excluded.apply_json,
      how_to_json=excluded.how_to_json, deadline=excluded.deadline,
      clause_text=excluded.clause_text, source_url=excluded.source_url,
      last_verified=excluded.last_verified, verified=excluded.verified,
      updated_at=datetime('now')
  `);

  const upAttr = db.prepare(`
    INSERT INTO attribute (key, def_json, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET def_json=excluded.def_json, updated_at=datetime('now')
  `);

  const tx = db.transaction(() => {
    for (const s of schemes) {
      upScheme.run({
        id: s.id,
        name_en: s.name.en, name_hi: s.name.hi, name_mr: s.name.mr,
        authority: s.authority, level: s.level, state: s.state ?? null,
        benefit_json: JSON.stringify(s.benefit),
        criteria_json: JSON.stringify(s.criteria),
        documents_json: JSON.stringify(s.documents_required),
        apply_json: JSON.stringify(s.apply),
        how_to_json: JSON.stringify(howTo[s.id] ?? howTo._default),
        deadline: s.deadline ?? null,
        clause_text: s.clause_text,
        source_url: s.source_url ?? null,
        last_verified: s.last_verified ?? null,
        verified: s.verified ? 1 : 0,
      });
    }
    for (const [k, v] of Object.entries(attributes)) upAttr.run(k, JSON.stringify(v));
  });
  tx();
  audit("seed", "database", `${schemes.length} schemes, ${Object.keys(attributes).length} attributes`);
  if (verbose) console.log(`seeded ${schemes.length} schemes · ${Object.keys(attributes).length} attributes`);
}

if (process.argv[1]?.endsWith("seed.ts")) seed();
