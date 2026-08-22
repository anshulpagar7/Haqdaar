/** The read side of the scheme catalogue.
 *
 *  Reads from SQLite when it is available and from data/*.json when it is not,
 *  returning the identical shape either way. Routes never branch on storage. */
import { readFileSync } from "node:fs";
import { db } from "./db/index";
import { dataFile } from "./paths";

const json = <T>(name: string): T => JSON.parse(readFileSync(dataFile(name), "utf8"));

/* JSON is read once and cached; the files do not change while the server runs. */
let _files: { schemes: any[]; attributes: any; howTo: any; personas: any[] } | null = null;
function files() {
  if (!_files)
    _files = {
      schemes: json<any[]>("schemes.json"),
      attributes: json<any>("attributes.json"),
      howTo: json<any>("how-to-apply.json"),
      personas: json<any[]>("personas.json"),
    };
  return _files;
}

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

const fileToScheme = (s: any) => {
  const { howTo } = files();
  return {
    ...s,
    how_to: howTo[s.id] ?? howTo._default ?? null,
    verified: !!s.verified,
  };
};

/** Try SQLite, fall back to the JSON files on any failure — a missing table, a
 *  half-applied migration, a locked file. A read must never 500. */
function read<T>(fromDb: () => T, fromFiles: () => T): T {
  if (db) {
    try { return fromDb(); } catch { /* fall through */ }
  }
  return fromFiles();
}

export function allSchemes(): any[] {
  return read(
    () => {
      const rows = db.prepare("SELECT * FROM scheme WHERE active = 1 ORDER BY level DESC, id").all();
      if (!rows.length) throw new Error("empty catalogue");   // unseeded — use the files
      return rows.map(rowToScheme);
    },
    () => files().schemes.map(fileToScheme)
  );
}

export function schemeById(id: string): any | null {
  return read(
    () => {
      const r = db.prepare("SELECT * FROM scheme WHERE id = ?").get(id);
      return r ? rowToScheme(r) : null;
    },
    () => {
      const s = files().schemes.find((x) => x.id === id);
      return s ? fileToScheme(s) : null;
    }
  );
}

export function allAttributes(): Record<string, any> {
  return read(
    () => Object.fromEntries(
      db.prepare("SELECT key, def_json FROM attribute").all()
        .map((r: any) => [r.key, JSON.parse(r.def_json)])
    ),
    () => files().attributes
  );
}

export function allPersonas(): any[] {
  return files().personas;
}

/** Counts for /api/health and /api/stats, valid in either storage mode. */
export function catalogueCounts() {
  const s = allSchemes();
  return {
    schemes: s.length,
    verified: s.filter((x) => x.verified).length,
    states: new Set(s.map((x) => x.state).filter(Boolean)).size,
  };
}
