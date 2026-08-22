/** Indic speech → text via Groq Whisper large-v3-turbo (free tier).
 *  Mocks a plausible answer when GROQ_API_KEY is absent. */

const MODEL = process.env.GROQ_ASR_MODEL || "whisper-large-v3-turbo";

export async function transcribe(
  audio: Buffer,
  mimeType: string,
  language = "mr"
): Promise<{ text: string; mock?: boolean }> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { text: "होय", mock: true };

  const form = new FormData();
  form.append("file", new Blob([audio as unknown as BlobPart], { type: mimeType || "audio/webm" }), "clip.webm");
  form.append("model", MODEL);
  form.append("language", language);
  form.append("response_format", "json");
  form.append("temperature", "0");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const json: any = await res.json();
  return { text: (json.text ?? "").trim() };
}
