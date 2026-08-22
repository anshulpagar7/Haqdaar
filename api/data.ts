import schemes from "../data/schemes.json";
import attributes from "../data/attributes.json";
import howTo from "../data/how-to-apply.json";

/** Same payload the Express route serves, including the how-to-apply block the
 *  result cards expand into. Kept in sync deliberately: the serverless build has
 *  no SQLite, so the JSON files are the catalogue here. */
const merged = (schemes as any[]).map((s) => ({
  ...s,
  how_to: (howTo as any)[s.id] ?? (howTo as any)._default ?? null,
  verified: !!s.verified,
}));

export default function handler(_req: any, res: any) {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({ schemes: merged, attributes });
}
