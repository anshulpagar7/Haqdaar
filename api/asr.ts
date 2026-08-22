import { transcribe } from "../server/asr";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { audioBase64, mimeType, language } = req.body ?? {};
    if (!audioBase64) return res.status(400).json({ error: "audioBase64 required" });
    res.status(200).json(await transcribe(Buffer.from(audioBase64, "base64"), mimeType, language));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
}
