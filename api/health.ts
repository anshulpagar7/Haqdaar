export default function handler(_req: any, res: any) {
  res.status(200).json({
    ok: true,
    mock: { extract: !process.env.GEMINI_API_KEY, asr: !process.env.GROQ_API_KEY },
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  });
}
