# HAQDAAR — हक़दार

**Don't make citizens search for schemes. Make the schemes search the citizen.**

A citizen photographs the documents already in their pocket, answers about five
spoken questions in Marathi or Hindi, and gets back every government welfare
scheme they are legally entitled to — with the rupee value, the missing
documents, the official clause that justifies each match, and a filled application.

---

## Quick start

```bash
npm install
cp .env.example .env      # optional — it runs without keys
npm run dev               # web on :5173, api on :8787
```

Open **http://localhost:5173**.

**It works with zero API keys.** Without them the app runs in *demo mode*: document
extraction returns a seeded profile and speech returns a fixed answer. Everything
else — the solver, the question selector, the counter, the clause sheet, the PDF —
is fully real either way. A banner tells you which mode you're in.

For the live version, put two free keys in `.env`:

| Key | Where | Free tier |
|---|---|---|
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | image input free |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) | 28,800 audio-sec/day |

Neither needs a credit card.

```bash
npm test                        # 13 engine tests
npx tsx scripts/benchmark.ts    # prove the selector on the real seed data
npm run build                   # production bundle
```

---

## What the benchmark prints

```
32 schemes · 20 attributes

── Nashik farmer household
   cold start      : 32 → 32 → 26 → 22 → 22 → 20 → 18 → 16 → 15 → 14   (12 questions)
   after documents : 19 → 17 → 15 → 15 → 15 → 14                        (5 questions)
   eligible        : 12 schemes, ₹16,62,500/yr

Average questions to converge: 3.7
```

That gap is the whole product. Documents answer nine attributes for free, so the
selector only has to ask about the handful that are left.

---

## How it works

### 1. Documents → profile
`POST /api/extract` sends one frame to Gemini Flash with a strict JSON schema and
gets back typed fields plus a confidence score per field. ID numbers are masked at
extraction. Nothing is written to disk.

### 2. Three-valued matching
Every scheme is a set of predicates. `evaluate()` returns `true`, `false`, or
**`null` for unknown** — and unknown never disqualifies. A scheme stays a
*candidate* until a known fact rules it out, which is what lets us answer before
the profile is complete.

```
any criterion false  → ruled out
all criteria  true   → ELIGIBLE
otherwise            → still a candidate
```

### 3. Information-gain question selection
Of every unknown attribute, pick the one whose answer is expected to eliminate the
most remaining schemes, discounted by how hard the question is to answer:

```
score(a) = ( |C| − E[ |C| after asking a ] ) / ask_cost(a)
```

We stop as soon as the best remaining question would rule out fewer than one
scheme (`MIN_GAIN`). That stopping rule is why it asks five questions instead of
grinding through all twenty attributes.

Priors are uniform by default. `attributes.json` supports per-value priors, and
weighting them with Census/NSSO distributions is the obvious next improvement.

### 4. The output
Filled PDF via `pdf-lib`, a document checklist against what was photographed, and
a clause sheet showing the verbatim eligibility sentence plus every condition
checked against the profile.

**The LLM only handles language.** Speech, translation, and reading a document into
fields. Eligibility is decided entirely by `src/engine/`, which contains no network
call, no database and no model. That is why it cannot hallucinate an entitlement.

---

## Layout

```
data/
  schemes.json        32 seeded schemes — predicates + clause_text
  attributes.json     20 attributes — type, ask_cost, priors, questions in en/hi/mr
src/engine/           PURE. No network, no LLM, no DB. Unit-tested.
  types.ts  evaluate.ts  match.ts  select.ts
  __tests__/engine.test.ts
src/lib/              api.ts · speech.ts (TTS + STT) · pdf.ts
src/components/       Capture · Question · Counter · Results · ClauseSheet
server/               index.ts · extract.ts (Gemini) · asr.ts (Groq Whisper)
scripts/benchmark.ts  selector vs fixed-order, on the real data
```

The engine has zero imports from the rest of the app. You can lift `src/engine/`
into any other project unchanged.

---

## ⚠️ Read this before demoing

**`clause_text` in `data/schemes.json` is currently a plain-language summary, and
every entry is marked `"verified": false`.** The whole credibility of this project
rests on those sentences being verbatim from the official notification.

Before any demo or pitch:

1. Open each scheme's `source_url`.
2. Copy the actual eligibility sentence into `clause_text`.
3. Check the thresholds in `criteria` against that sentence.
4. Set `"verified": true` and update `last_verified`.

The clause sheet displays "not yet verified against the notification" until you do.
Leave that warning in — a judge who spots an unverified claim you flagged yourself
trusts you more, not less.

Also: **use synthetic documents in the demo.** Google's free tier may use submitted
content to improve their products, and these are identity documents.

---

## Adding a scheme

Append to `data/schemes.json`:

```jsonc
{
  "id": "MH-YOUR-SCHEME-01",
  "name": { "en": "...", "hi": "...", "mr": "..." },
  "authority": "Department, Govt. of Maharashtra",
  "level": "state",
  "benefit": { "type": "cash", "amount_inr_per_year": 12000 },
  "criteria": [
    { "attr": "state",             "op": "eq",      "value": "MH" },
    { "attr": "annual_income_inr", "op": "lt",      "value": 250000 },
    { "attr": "age",               "op": "between", "value": [18, 30] }
  ],
  "documents_required": ["income_certificate", "domicile"],
  "apply": { "mode": "online", "url": "https://...", "office": "..." },
  "clause_text": "verbatim sentence from the notification",
  "source_url": "https://...",
  "last_verified": "2026-08-18",
  "verified": true
}
```

Nine operators, deliberately: `eq neq lt lte gt gte between in exists`. If a scheme
can't be expressed in those, simplify it or skip it. Coverage is a data problem you
can grind through; an unbounded rule language is a bug factory you can't.

Any attribute used in `criteria` must exist in `attributes.json`, or it will never
be asked about. The benchmark script prints missing attributes.

---

## Deploying free

- **Frontend** — `npm run build`, push `dist/` to Vercel / Netlify / Cloudflare Pages.
- **API** — the three handlers in `server/` are plain functions; drop them into
  `api/` on Vercel or into Supabase Edge Functions. Keep the keys server-side:
  never call Gemini or Groq from the browser, or a scraped key gets drained before
  your demo slot.

---

## Demo script (3 minutes)

| Time | Beat |
|---|---|
| 0:00 | The problem: 40% of ₹50,000 crore in welfare funds unspent. |
| 0:20 | Hand a judge the phone. They photograph the sample card. Fields fill in. |
| 0:45 | Five spoken questions in Marathi. The counter falls on the projector. |
| 1:45 | The result: N schemes, ₹X per year this family wasn't claiming. |
| 2:15 | Tap a scheme → the official clause and every condition checked. |
| 2:40 | One line on the deterministic solver. Stop talking. |

Record a screen capture of a clean run the night before. Hackathon wifi fails.

---

## Roadmap

- **30 days** — one full state of scheme coverage; Census-weighted priors (5 questions → ~3).
- **90 days** — pilot with CSC operators; measure applications actually filed.
- **The version that matters** — on-device extraction, so identity documents never
  leave the phone and a department can deploy without a data-sharing agreement.

---

## Deploying in one command (for the submission link)

```bash
npm i -g vercel
vercel            # accept defaults — it detects Vite
vercel env add GEMINI_API_KEY      # paste your key, choose Production
vercel env add GROQ_API_KEY
vercel --prod
```

`api/health.ts`, `api/data.ts`, `api/extract.ts` and `api/asr.ts` are the same
handlers as `server/`, wrapped for Vercel. The Express server in `server/` stays
the local dev path. Without env vars the deployed site still runs in demo mode.

## Sample documents for the demo

`public/sample-documents/` contains two synthetic documents — a ration card and an
income certificate. They are clearly stamped SPECIMEN. **Use these in every demo.**
Google's free tier may use submitted content to improve their products, and real
ration cards are identity documents belonging to real people.

Print them, or open them on a second screen and photograph that.

---

## Interface

Two layouts, switchable from the header at any time — the toggle forces the
layout regardless of screen size, so you can show the phone experience on a
projector or the cockpit on a laptop.

**Mobile** — the citizen's flow: capture, one question at a time, result.

**Desktop cockpit** — three columns for demoing and for service-centre operators:
extracted profile on the left, the eligibility field + counter + current question
in the centre, and the live confirmed/still-open scheme list on the right, updating
on every answer.

**The eligibility field** (`src/components/SchemeField.tsx`) renders every scheme
as a point in perspective 3D on a plain 2D canvas — no WebGL, no 3D library.
Points pull to the centre and burn gold as they are confirmed, and fall away and
dim as they are ruled out. It is the solver made visible, and it costs ~26 KB
instead of 600 KB of dependency.

### Design rules this UI follows

Built against the *ui-ux-pro-max* rule set:

- every text token is ≥ 4.5:1 on its surface; focus rings are never removed
- 44×44 px minimum touch targets, 8 px+ apart
- SVG icons throughout — no emoji used as an icon
- transitions are 150–300 ms and convey spatial continuity
- the meter animates `transform`, never `width` — no layout thrash
- `prefers-reduced-motion` disables the aurora, the field's rotation and the
  counter tween
- visible labels on every control; language and layout switches are real
  `aria-pressed` toggle groups
- base 16 px, line-height 1.5, semantic colour tokens only — no raw hex in components
