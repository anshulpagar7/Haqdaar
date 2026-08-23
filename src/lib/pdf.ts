import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { Profile, Scheme } from "../engine/types";

/* ── palette, matched to the app ─────────────────────────────── */
const INK = rgb(0.078, 0.149, 0.114);
const MUTED = rgb(0.306, 0.38, 0.341);
const DIM = rgb(0.443, 0.518, 0.478);
const GREEN = rgb(0.18, 0.49, 0.31);
const GREEN_D = rgb(0.11, 0.345, 0.212);
const GREEN_T = rgb(0.902, 0.949, 0.918);
const AMBER = rgb(0.851, 0.506, 0.165);
const AMBER_T = rgb(0.984, 0.933, 0.863);
const SAND = rgb(0.949, 0.925, 0.871);
const CREAM = rgb(0.984, 0.973, 0.941);
const LINE = rgb(0.886, 0.855, 0.78);
const WHITE = rgb(1, 1, 1);

const A4: [number, number] = [595.28, 841.89];
const M = 46;                       // page margin
const W = A4[0] - M * 2;            // usable width
const TOP = A4[1] - 54;
const BOTTOM = 62;

interface HowTo {
  steps?: { title: string; detail: string }[];
  where?: string; url?: string | null; processing_time?: string; helpline?: string;
  documents?: { key: string; label: string }[];
  tips?: string[]; common_rejections?: string[];
}
type FullScheme = Scheme & { how_to?: HowTo | null };

/** WinAnsi has no ₹ and no Devanagari. Rather than let pdf-lib throw on a stray
 *  glyph, everything that reaches the page goes through here first. */
const ascii = (s: string) =>
  (s ?? "")
    .replace(/₹\s?/g, "Rs. ")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[·•]/g, "-")
    .replace(/ /g, " ")
    .replace(/[^\x20-\x7E\n]/g, "")
    .trim();

const money = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

const amountOf = (s: Scheme) =>
  s.benefit.amount_inr_per_year ? `${money(s.benefit.amount_inr_per_year)} per year`
  : s.benefit.one_time_inr ? `${money(s.benefit.one_time_inr)} one-time`
  : s.benefit.note ?? "Benefit in kind";

const titleCase = (s: string) =>
  s.replace(/_/g, " ")
   .replace(/\b7 12\b/, "7/12")
   .replace(/\binr\b/i, "")
   .replace(/\bha$/i, "")          // the unit rides with the value, not the label
   .replace(/\s+/g, " ")
   .trim()
   .replace(/\b\w/g, (c) => c.toUpperCase());

/** Profile values read back the way a clerk would write them, not the way the
 *  engine stores them: rupees grouped, hectares labelled, booleans in words. */
function fmtValue(key: string, v: unknown): string {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") {
    if (/_inr\b|income|amount/i.test(key)) return money(v);
    if (/_ha\b|landholding/i.test(key)) return `${v} ha`;
    if (/age/i.test(key)) return `${v} years`;
    return v.toLocaleString("en-IN");
  }
  const s = String(v);
  /* Codes stay as codes (MH, ST, PHH, AAY); words read as words. */
  return /^[A-Z0-9/]{1,4}$/.test(s) ? s : titleCase(s);
}

/* ── a tiny layout engine: a cursor that knows when to break a page ── */
class Doc {
  page!: PDFPage;
  y = TOP;
  pages: PDFPage[] = [];
  constructor(readonly pdf: PDFDocument, readonly font: PDFFont, readonly bold: PDFFont) {
    this.newPage();
  }

  newPage() {
    this.page = this.pdf.addPage(A4);
    this.pages.push(this.page);
    this.y = TOP;
  }
  /** Reserve vertical space; start a new page if this block will not fit. */
  need(h: number) { if (this.y - h < BOTTOM) this.newPage(); }
  gap(h: number) { this.y -= h; }

  width(text: string, size: number, f = this.font) { return f.widthOfTextAtSize(text, size); }

  /** Greedy wrap against a real measured width, not a character count. */
  wrap(text: string, size: number, maxW: number, f = this.font): string[] {
    const out: string[] = [];
    for (const para of ascii(text).split("\n")) {
      let cur = "";
      for (const word of para.split(/\s+/)) {
        const trial = cur ? `${cur} ${word}` : word;
        if (this.width(trial, size, f) > maxW && cur) { out.push(cur); cur = word; }
        else cur = trial;
      }
      out.push(cur);
    }
    return out;
  }

  text(s: string, o: {
    size?: number; bold?: boolean; color?: any; x?: number; maxW?: number; lead?: number;
  } = {}) {
    const size = o.size ?? 10;
    const f = o.bold ? this.bold : this.font;
    const lead = o.lead ?? size * 1.45;
    const x = o.x ?? M;
    for (const ln of this.wrap(s, size, o.maxW ?? M + W - x, f)) {
      this.need(lead);
      this.page.drawText(ln, { x, y: this.y - size, size, font: f, color: o.color ?? INK });
      this.y -= lead;
    }
  }

  rule(color = LINE) {
    this.need(12);
    this.page.drawLine({
      start: { x: M, y: this.y }, end: { x: M + W, y: this.y },
      thickness: 0.75, color,
    });
    this.y -= 14;
  }

  /** Section heading with a green rule under it. */
  heading(s: string) {
    this.need(40);
    this.gap(6);
    this.text(s, { size: 10.5, bold: true, color: GREEN_D });
    this.page.drawLine({
      start: { x: M, y: this.y + 4 }, end: { x: M + W, y: this.y + 4 },
      thickness: 1.6, color: GREEN,
    });
    this.gap(12);
  }

  box(h: number, fill: any, stroke?: any) {
    this.need(h);
    this.page.drawRectangle({
      x: M, y: this.y - h, width: W, height: h,
      color: fill, borderColor: stroke, borderWidth: stroke ? 0.9 : 0,
    });
  }
}

/** The HAQDAAR mark, drawn as vector geometry rather than a bitmap or a font
 *  substitute — WinAnsi has no Devanagari, so a real ह can only reach the page
 *  as an outline. Coordinates are the 512x512 brand tile, y-down (pdf-lib's
 *  SVG path space). Generated from Noto Sans Devanagari ExtraBold. */
const MARK_HA = "M233.48 324.07Q240.31 318.76 244.1 313.08Q247.9 307.39 247.9 301.32Q247.9 293.35 240.69 288.42Q233.48 283.49 217.93 283.49Q199.35 283.49 189.3 290.32Q179.25 297.15 179.25 309.28Q179.25 319.14 187.59 327.30Q195.94 335.45 213.95 343.23Q231.97 351 260.79 360.48L236.9 406Q195.56 395 169.77 380.78Q143.98 366.55 132.03 348.73Q120.08 330.9 120.08 310.04Q120.08 284.63 133.74 268.70Q136.77 265.29 140.56 261.87Q132.22 254.67 127.67 247.08Q119.7 234.57 119.7 220.91Q119.7 197.02 137.53 184.50Q155.35 171.99 187.97 171.99H232.73V153.02H100.74V105.99H325.27V153.02H291.51V216.74H197.07Q186.83 216.74 182.47 220.15Q178.11 223.57 178.11 230.02Q178.11 235.33 182.66 240.26Q183.42 241.01 184.18 242.15Q201.25 238.36 220.97 238.36Q251.31 238.36 270.27 246.70Q289.24 255.05 297.96 268.70Q306.68 282.35 306.68 299.04Q306.68 313.45 300.99 325.78Q295.31 338.11 283.17 349.86Z";
/** Rounded tile, same 512 box. */
const MARK_TILE =
  "M118 0 H394 A118 118 0 0 1 512 118 V394 A118 118 0 0 1 394 512 H118 " +
  "A118 118 0 0 1 0 394 V118 A118 118 0 0 1 118 0 Z";
const MARK_DOT = { cx: 377.3, cy: 372, r: 34 };

/** Draw the mark with its top-left at (x, y-top) at the given pixel size. */
function drawMark(page: PDFPage, x: number, yTop: number, size: number) {
  const k = size / 512;
  page.drawSvgPath(MARK_TILE, { x, y: yTop, scale: k, color: GREEN_D, borderWidth: 0 });
  page.drawSvgPath(MARK_HA, { x, y: yTop, scale: k, color: CREAM, borderWidth: 0 });
  page.drawCircle({
    x: x + MARK_DOT.cx * k, y: yTop - MARK_DOT.cy * k, size: MARK_DOT.r * k, color: AMBER,
  });
}

export async function buildApplicationPdf(
  eligible: FullScheme[],
  profile: Profile,
  missingDocs: string[],
  meta: { reference?: string | null; asked?: number; docsHeld?: string[]; lang?: string } = {}
): Promise<Blob> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const d = new Doc(pdf, font, bold);

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const total = eligible.reduce(
    (t, s) => t + (s.benefit.amount_inr_per_year ?? s.benefit.one_time_inr ?? 0), 0);

  pdf.setTitle("HAQDAAR — welfare entitlement summary");
  pdf.setSubject(`${eligible.length} schemes, ${money(total)} annual value`);
  pdf.setProducer("HAQDAAR");
  pdf.setCreator("HAQDAAR");

  /* ═══ 1. Masthead ═══════════════════════════════════════════ */
  d.page.drawRectangle({ x: 0, y: A4[1] - 132, width: A4[0], height: 132, color: GREEN_D });
  /* The mark, reversed out of the masthead: cream tile, green letter, gold dot. */
  const k = 38 / 512;
  d.page.drawSvgPath(MARK_TILE, { x: M, y: A4[1] - 58, scale: k, color: CREAM, borderWidth: 0 });
  d.page.drawSvgPath(MARK_HA, { x: M, y: A4[1] - 58, scale: k, color: GREEN_D, borderWidth: 0 });
  d.page.drawCircle({
    x: M + MARK_DOT.cx * k, y: A4[1] - 58 - MARK_DOT.cy * k, size: MARK_DOT.r * k, color: AMBER,
  });
  d.page.drawText("HAQDAAR", {
    x: M + 46, y: A4[1] - 82, size: 21, font: bold, color: WHITE,
  });
  d.page.drawText("Welfare entitlement summary", {
    x: M + 46, y: A4[1] - 99, size: 9.5, font, color: rgb(0.72, 0.85, 0.78),
  });
  const stamp = `${today}${meta.reference ? `   |   Ref ${meta.reference}` : ""}`;
  d.page.drawText(stamp, {
    x: M + W - font.widthOfTextAtSize(stamp, 9), y: A4[1] - 82, size: 9, font,
    color: rgb(0.72, 0.85, 0.78),
  });
  d.y = A4[1] - 156;

  /* ═══ 2. Headline numbers ═══════════════════════════════════ */
  const cardW = (W - 20) / 3;
  const cards: [string, string][] = [
    [String(eligible.length), eligible.length === 1 ? "scheme you qualify for" : "schemes you qualify for"],
    [money(total), "combined annual value"],
    [String(missingDocs.length), missingDocs.length === 1 ? "document still needed" : "documents still needed"],
  ];
  cards.forEach(([big, label], i) => {
    const x = M + i * (cardW + 10);
    d.page.drawRectangle({
      x, y: d.y - 62, width: cardW, height: 62,
      color: i === 2 && missingDocs.length ? AMBER_T : GREEN_T,
      borderColor: i === 2 && missingDocs.length ? AMBER : GREEN, borderWidth: 1,
    });
    let size = 20;
    while (bold.widthOfTextAtSize(big, size) > cardW - 22 && size > 10) size -= 1;
    d.page.drawText(big, { x: x + 12, y: d.y - 30, size, font: bold, color: GREEN_D });
    for (const [j, ln] of d.wrap(label, 8, cardW - 22).entries())
      d.page.drawText(ln, { x: x + 12, y: d.y - 42 - j * 9.5, size: 8, font, color: MUTED });
  });
  d.y -= 78;

  d.text(
    "This sheet lists every scheme the applicant was found eligible for, the clause each " +
    "match satisfied, and what has to be done to claim it. Carry it to the office named " +
    "under each scheme, along with the documents ticked below.",
    { size: 9.5, color: MUTED, lead: 13 }
  );
  d.gap(6);

  /* ═══ 3. Applicant profile ══════════════════════════════════ */
  d.heading("APPLICANT PROFILE");
  const entries = Object.entries(profile);
  if (!entries.length) d.text("No profile fields were captured.", { size: 10, color: DIM });

  const rowH = 20, colW = W / 2;
  entries.forEach(([k, v], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    if (col === 0) {
      d.need(rowH);
      if (row % 2 === 0)
        d.page.drawRectangle({ x: M, y: d.y - rowH + 4, width: W, height: rowH, color: SAND });
    }
    const x = M + col * colW + 10;
    d.page.drawText(ascii(titleCase(k)), {
      x, y: d.y - rowH + 11, size: 8.5, font, color: MUTED,
    });
    const val = ascii(fmtValue(k, v));
    d.page.drawText(val, {
      x: x + colW - 26 - font.widthOfTextAtSize(val, 9.5), y: d.y - rowH + 11,
      size: 9.5, font: bold, color: INK,
    });
    if (col === 1 || i === entries.length - 1) d.y -= rowH;
  });
  d.gap(4);
  d.text(
    `Established from the applicant's own documents and ${meta.asked ?? 0} spoken ` +
    `question${meta.asked === 1 ? "" : "s"}. No identity number is stored on this sheet.`,
    { size: 8.5, color: DIM }
  );

  /* ═══ 4. Document checklist ═════════════════════════════════ */
  d.gap(8);
  d.heading("DOCUMENT CHECKLIST");
  const held = meta.docsHeld ?? [];
  const tick = (label: string, on: boolean) => {
    d.need(18);
    const y = d.y - 12;
    d.page.drawRectangle({
      x: M + 2, y: y - 1, width: 10, height: 10,
      color: on ? GREEN : WHITE, borderColor: on ? GREEN : LINE, borderWidth: 1,
    });
    if (on) {
      d.page.drawLine({ start: { x: M + 4.2, y: y + 3.8 }, end: { x: M + 6.2, y: y + 1.4 }, thickness: 1.4, color: WHITE });
      d.page.drawLine({ start: { x: M + 6.2, y: y + 1.4 }, end: { x: M + 10, y: y + 7 }, thickness: 1.4, color: WHITE });
    }
    d.page.drawText(ascii(titleCase(label)), {
      x: M + 20, y, size: 9.5, font: on ? font : bold, color: on ? MUTED : INK,
    });
    if (!on)
      d.page.drawText("to be obtained", {
        x: M + W - font.widthOfTextAtSize("to be obtained", 8.5), y, size: 8.5, font, color: AMBER,
      });
    d.y -= 18;
  };
  for (const h of held) tick(h, true);
  for (const m of missingDocs) tick(m, false);
  if (!held.length && !missingDocs.length)
    d.text("No documents were required beyond what was already supplied.", { size: 10, color: DIM });

  /* ═══ 5. One block per scheme ═══════════════════════════════ */
  eligible.forEach((s, i) => {
    d.need(150);
    d.gap(14);

    /* title bar */
    const name = ascii(s.name.en);
    const titleLines = d.wrap(name, 13, W - 130, bold);
    const barH = 30 + (titleLines.length - 1) * 16;
    d.page.drawRectangle({ x: M, y: d.y - barH, width: W, height: barH, color: GREEN_D });
    titleLines.forEach((ln, j) =>
      d.page.drawText(ln, { x: M + 12, y: d.y - 20 - j * 16, size: 13, font: bold, color: WHITE }));
    const amt = ascii(amountOf(s));
    d.page.drawText(amt, {
      x: M + W - 12 - bold.widthOfTextAtSize(amt, 11), y: d.y - 20,
      size: 11, font: bold, color: AMBER,
    });
    d.y -= barH + 12;

    const meta2 = [
      `${i + 1} of ${eligible.length}`,
      s.level === "central" ? "Central scheme" : `State scheme${s.state ? ` - ${s.state}` : ""}`,
      ascii(s.authority),
      s.deadline ? `Apply before ${ascii(s.deadline)}` : null,
    ].filter(Boolean).join("   |   ");
    d.text(meta2, { size: 8.5, color: DIM });
    d.gap(6);

    /* the clause — the whole point of the product */
    const clauseLines = d.wrap(`"${s.clause_text}"`, 9, W - 28);
    const clauseH = clauseLines.length * 12.5 + 30;
    d.box(clauseH, GREEN_T);
    d.page.drawRectangle({ x: M, y: d.y - clauseH, width: 3, height: clauseH, color: GREEN });
    d.page.drawText("WHY YOU QUALIFY - VERBATIM CLAUSE", {
      x: M + 14, y: d.y - 15, size: 7.5, font: bold, color: GREEN_D,
    });
    clauseLines.forEach((ln, j) =>
      d.page.drawText(ln, { x: M + 14, y: d.y - 28 - j * 12.5, size: 9, font, color: INK }));
    d.y -= clauseH + 10;
    if (s.source_url) d.text(`Source: ${s.source_url}`, { size: 8, color: DIM });
    if (s.verified === false)
      d.text("Clause not yet checked against the official notification - verify before acting.",
             { size: 8, color: AMBER });

    /* how to apply */
    const how = s.how_to ?? null;
    const steps = how?.steps ?? [];
    if (steps.length) {
      d.gap(8);
      d.text("HOW TO APPLY", { size: 8.5, bold: true, color: GREEN_D });
      d.gap(4);
      steps.forEach((st, j) => {
        d.need(34);
        const y = d.y;
        d.page.drawCircle({ x: M + 8, y: y - 6, size: 8, color: GREEN });
        d.page.drawText(String(j + 1), {
          x: M + 8 - bold.widthOfTextAtSize(String(j + 1), 8) / 2, y: y - 9,
          size: 8, font: bold, color: WHITE,
        });
        d.y = y;
        d.text(ascii(st.title), { size: 9.5, bold: true, x: M + 24, maxW: W - 24, lead: 12.5 });
        d.text(ascii(st.detail), { size: 8.5, color: MUTED, x: M + 24, maxW: W - 24, lead: 11 });
        d.gap(5);
      });
    }

    /* practicalities */
    const facts: [string, string | undefined | null][] = [
      ["Where", how?.where ?? s.apply.office],
      ["Online", how?.url ?? s.apply.url],
      ["Processing time", how?.processing_time],
      ["Helpline", how?.helpline],
      ["Documents", s.documents_required.map(titleCase).join(", ")],
    ];
    d.gap(4);
    for (const [k, v] of facts) {
      if (!v) continue;
      d.need(14);
      d.page.drawText(k, { x: M, y: d.y - 9, size: 8.5, font: bold, color: MUTED });
      const startY = d.y;
      d.y = startY;
      d.text(ascii(String(v)), { size: 8.5, x: M + 92, maxW: W - 92, lead: 11.5, color: INK });
      d.gap(2);
    }

    /* what gets applications rejected */
    const rej = how?.common_rejections ?? [];
    if (rej.length) {
      d.gap(6);
      const lines = rej.flatMap((r) => d.wrap(`- ${r}`, 8.5, W - 28));
      const h = lines.length * 11.5 + 26;
      d.box(h, AMBER_T, AMBER);
      d.page.drawText("MOST COMMON REASONS THIS GETS REJECTED", {
        x: M + 14, y: d.y - 14, size: 7.5, font: bold, color: rgb(0.54, 0.31, 0.03),
      });
      lines.forEach((ln, j) =>
        d.page.drawText(ln, { x: M + 14, y: d.y - 26 - j * 11.5, size: 8.5, font, color: INK }));
      d.y -= h + 6;
    }

    if (i < eligible.length - 1) { d.gap(6); d.rule(); }
  });

  /* ═══ 6. Closing note ═══════════════════════════════════════ */
  d.gap(10);
  d.heading("BEFORE YOU GO TO THE OFFICE");
  const advice = [
    "Carry the originals and one photocopy set of every document ticked above.",
    "Take this sheet with you - it names the clause each entitlement rests on.",
    "Note the application ID the office or portal gives you; you need it to follow up.",
    "If a form asks for something not on this list, ask which rule requires it.",
  ];
  for (const a of advice) {
    d.need(16);
    d.page.drawCircle({ x: M + 3, y: d.y - 8, size: 2, color: GREEN });
    d.text(a, { size: 9.5, x: M + 14, maxW: W - 14, lead: 13 });
    d.gap(2);
  }

  d.gap(10);
  d.rule();
  d.text(
    "Eligibility on this sheet was decided by a deterministic rule engine, not by a language " +
    "model, and every match cites the clause it satisfied. Verify against the official " +
    "notification before acting. No identity number and no document image is stored.",
    { size: 8, color: DIM, lead: 10.5 }
  );

  /* ═══ 7. Footer on every page ═══════════════════════════════ */
  const n = d.pages.length;
  d.pages.forEach((p, i) => {
    p.drawLine({
      start: { x: M, y: BOTTOM - 14 }, end: { x: M + W, y: BOTTOM - 14 },
      thickness: 0.75, color: LINE,
    });
    p.drawText("HAQDAAR - welfare entitlement summary", {
      x: M, y: BOTTOM - 27, size: 7.5, font, color: DIM,
    });
    const right = `${meta.reference ? `Ref ${meta.reference}   |   ` : ""}Page ${i + 1} of ${n}`;
    p.drawText(right, {
      x: M + W - font.widthOfTextAtSize(right, 7.5), y: BOTTOM - 27, size: 7.5, font, color: DIM,
    });
  });

  return new Blob([(await pdf.save()) as unknown as BlobPart], { type: "application/pdf" });
}
