import schemes from "../data/schemes.json";
import attributes from "../data/attributes.json";

export default function handler(_req: any, res: any) {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({ schemes, attributes });
}
