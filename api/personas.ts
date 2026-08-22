import personas from "../data/personas.json";

/** Synthetic specimens for the demo. No real citizen's document is ever used. */
export default function handler(_req: any, res: any) {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json(personas);
}
