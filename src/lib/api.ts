import type { Registry, Scheme } from "../engine/types";

export interface ExtractResponse {
  doc_type: string;
  fields: Record<string, string | number | boolean>;
  confidence: Record<string, number>;
  masked_ids?: string[];
  mock?: boolean;
}

/** Turn a failed API call into a sentence that names the actual problem. */
async function fail(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => ({} as any));
  throw new Error(body.error || `${fallback} (HTTP ${res.status})`);
}

export async function loadData(): Promise<{ schemes: Scheme[]; attributes: Registry }> {
  let res: Response;
  try {
    res = await fetch("/api/data");
  } catch {
    throw new Error(
      "Could not reach the server. Is the dev server still running? Restart it with: npm run dev"
    );
  }
  if (!res.ok) return fail(res, "Could not load the scheme catalogue");
  return res.json();
}

export async function health(): Promise<{ mock: { extract: boolean; asr: boolean } }> {
  const res = await fetch("/api/health");
  return res.json();
}

export async function extractDocument(file: File): Promise<ExtractResponse> {
  const imageBase64 = await toBase64(file);
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType: file.type || "image/jpeg" }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Extraction failed.");
  return res.json();
}

export async function transcribe(blob: Blob, language: string): Promise<{ text: string }> {
  const audioBase64 = await toBase64(blob);
  const res = await fetch("/api/asr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType: blob.type, language }),
  });
  if (!res.ok) throw new Error("Could not hear that.");
  return res.json();
}

function toBase64(f: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

export interface Persona {
  id: string; name: string; tagline: string; story: string;
  portrait: string; document: string; document_type: string;
  document_label: string; accent: string;
  fields: Record<string, string | number | boolean>;
  confidence: Record<string, number>;
  masked_ids: string[];
}

export async function loadPersonas(): Promise<Persona[]> {
  const res = await fetch("/api/personas");
  if (!res.ok) return fail(res, "Could not load the specimen documents");
  return res.json();
}

export async function saveApplication(body: {
  lang: string; profile: Record<string, unknown>; docsHeld: string[];
  eligibleIds: string[]; totalValue: number; questionsAsked: number;
}): Promise<{ reference: string; expires_in_days: number }> {
  const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Could not save the application.");
  return res.json();
}
