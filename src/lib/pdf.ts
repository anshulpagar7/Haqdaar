import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Profile, Scheme } from "../engine/types";

const INK = rgb(0.09, 0.08, 0.23);
const MARI = rgb(0.82, 0.41, 0.04);
const GREY = rgb(0.42, 0.4, 0.52);

/** Build a consolidated, pre-filled application summary the citizen can print
 *  and carry to the office. In production each scheme's own blank PDF would be
 *  filled by field name; this is the generic fallback. */
export async function buildApplicationPdf(
  eligible: Scheme[],
  profile: Profile,
  missingDocs: string[]
): Promise<Blob> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([595, 842]); // A4
  let y = 792;
  const M = 48;

  const line = (text: string, size = 10, f = font, color = INK, gap = 15) => {
    if (y < 60) { page = doc.addPage([595, 842]); y = 792; }
    page.drawText(text, { x: M, y, size, font: f, color });
    y -= gap;
  };
  const rule = () => {
    if (y < 60) { page = doc.addPage([595, 842]); y = 792; }
    page.drawLine({ start: { x: M, y }, end: { x: 547, y }, thickness: 0.6, color: rgb(0.9, 0.89, 0.94) });
    y -= 14;
  };

  line("HAQDAAR", 22, bold, INK, 10);
  line("Consolidated welfare application summary", 11, font, GREY, 8);
  line("Generated for submission at the block / tahsil office", 9, font, GREY, 18);
  rule();

  line("APPLICANT PROFILE", 10, bold, MARI, 16);
  for (const [k, v] of Object.entries(profile)) {
    line(`${k.replace(/_/g, " ")}:  ${String(v)}`, 10, font, INK, 14);
  }
  y -= 6;
  rule();

  const total = eligible.reduce((t, s) => t + (s.benefit.amount_inr_per_year ?? 0), 0);
  line(`SCHEMES APPLIED FOR — ${eligible.length}`, 10, bold, MARI, 8);
  line(`Combined annual value: Rs. ${total.toLocaleString("en-IN")}`, 10, font, GREY, 18);

  eligible.forEach((s, i) => {
    line(`${i + 1}. ${s.name.en}`, 11, bold, INK, 14);
    line(`   ${s.authority}`, 9, font, GREY, 13);
    const amt = s.benefit.amount_inr_per_year
      ? `Rs. ${s.benefit.amount_inr_per_year.toLocaleString("en-IN")} / year`
      : s.benefit.one_time_inr
      ? `Rs. ${s.benefit.one_time_inr.toLocaleString("en-IN")} one-time`
      : (s.benefit.note ?? "");
    line(`   Benefit: ${amt}`, 9, font, INK, 13);
    line(`   Apply: ${s.apply.url ?? s.apply.office ?? "See department"}`, 9, font, GREY, 13);
    line(`   Documents: ${s.documents_required.join(", ")}`, 9, font, GREY, 13);
    const clause = wrap(`   Clause: "${s.clause_text}"`, 96);
    clause.forEach((l) => line(l, 8.5, font, GREY, 11));
    y -= 6;
  });

  rule();
  line("DOCUMENTS STILL TO BE OBTAINED", 10, bold, MARI, 14);
  if (missingDocs.length === 0) line("None — every required document was supplied.", 10, font, INK, 14);
  else missingDocs.forEach((d) => line(`[  ]  ${d.replace(/_/g, " ")}`, 10, font, INK, 14));

  y -= 10;
  rule();
  line("Eligibility on this sheet was determined by a deterministic rule engine and each", 8.5, font, GREY, 11);
  line("match cites the clause it satisfied. Verify against the official notification before", 8.5, font, GREY, 11);
  line("acting. This prototype stores no personal data.", 8.5, font, GREY, 11);

  return new Blob([(await doc.save()) as unknown as BlobPart], { type: "application/pdf" });
}

function wrap(s: string, n: number): string[] {
  const words = s.split(" ");
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).length > n) { out.push(cur); cur = "   " + w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
