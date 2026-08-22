import { extract } from "../server/extract";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { imageBase64, mimeType } = req.body ?? {};
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });
    res.status(200).json(await extract(imageBase64, mimeType));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
}
