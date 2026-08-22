/** Document → structured profile fields, via Gemini Flash (free tier).
 *  Falls back to a deterministic mock when GEMINI_API_KEY is absent, so the
 *  whole app is demoable with no keys and no network. */

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const PROMPT = `You are reading an Indian government identity or welfare document.
Extract ONLY what is clearly visible. Never guess. Never invent a value.

Return strict JSON with this shape and no prose:
{
  "doc_type": "ration_card | land_record_7_12 | income_certificate | caste_certificate | aadhaar | disability_certificate | marksheet | bank_passbook | unknown",
  "fields": {
    "state": "MH|GJ|KA|MP|RJ|UP|OTHER",
    "residence": "rural|urban",
    "age": 0,
    "gender": "female|male|other",
    "annual_income_inr": 0,
    "category": "SC|ST|OBC|VJNT|SBC|GENERAL",
    "ration_card_type": "AAY|PHH|NPHH|none",
    "household_size": 0,
    "owns_agri_land": true,
    "landholding_ha": 0,
    "has_disability_cert": true,
    "disability_pct": 0,
    "education_level": "none|primary|secondary|higher_secondary|graduate"
  },
  "confidence": { "<same field names>": 0.0 },
  "masked_ids": ["last 4 digits only, e.g. XXXX-XXXX-1234"]
}

Omit any field you cannot read. Confidence is 0..1 per field you did return.
NEVER return a full Aadhaar or account number — mask all but the last four digits.`;

export interface ExtractResult {
  doc_type: string;
  fields: Record<string, string | number | boolean>;
  confidence: Record<string, number>;
  masked_ids?: string[];
  mock?: boolean;
}

const MOCK: ExtractResult = {
  doc_type: "ration_card",
  fields: {
    state: "MH", residence: "rural", gender: "male", age: 47,
    ration_card_type: "PHH", household_size: 5, annual_income_inr: 145000,
    category: "ST", owns_agri_land: true, landholding_ha: 1.4,
  },
  confidence: {
    state: 0.98, residence: 0.86, gender: 0.95, age: 0.91,
    ration_card_type: 0.97, household_size: 0.93, annual_income_inr: 0.74,
    category: 0.88, owns_agri_land: 0.9, landholding_ha: 0.82,
  },
  masked_ids: ["XXXX-XXXX-4417"],
  mock: true,
};

export async function extract(imageBase64: string, mimeType: string): Promise<ExtractResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return MOCK;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } },
      ],
    }],
    generationConfig: { responseMimeType: "application/json", temperature: 0 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const json: any = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));

  return {
    doc_type: parsed.doc_type ?? "unknown",
    fields: parsed.fields ?? {},
    confidence: parsed.confidence ?? {},
    masked_ids: parsed.masked_ids ?? [],
  };
}
