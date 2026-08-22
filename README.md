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
npm run doctor                  # check Node, ports, native module, data files
npx tsx scripts/benchmark.ts    # prove the selector on the real seed data
npm run build                   # typecheck + production bundle
```

---

## If something will not start

Run `npm run doctor` first. It checks Node's version, the four data files, the
native SQLite module, and whether anything is listening on the API port, and it
prints the exact command that fixes whatever it finds.

**"Could not load the scheme catalogue" / `http proxy error … ECONNREFUSED`**

The web half is up on :5173 but the API half on :8787 is not. `npm run dev` starts
both with `concurrently`, so if the API crashes at boot its error can scroll past
in the shared output. Run it alone to see the real message:

```bash
npm run dev:api
```

Three common causes:

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find module 'better-sqlite3'` or `bindings file` | the native module did not compile — usually Windows without build tools | `npm rebuild better-sqlite3`. **The app still runs without it** — read-only from `data/*.json`. |
| `EADDRINUSE` | an older API process is still holding :8787 | Windows: `netstat -ano \| findstr :8787` then `taskkill /PID <pid> /F` · macOS/Linux: `lsof -ti:8787 \| xargs kill` |
| the API prints nothing at all | it was started from the wrong folder | `cd` into the project root — the one with `package.json` — and re-run |

**The demo does not depend on any of this.** If :8787 is refused, the Vite dev
server answers `/api/data`, `/api/schemes`, `/api/attributes`, `/api/personas` and
`/api/health` from `data/*.json` itself, and the console says so once. The landing
page, the specimen documents, the question flow, the results and the PDF all work
with the API process dead. Only saving an application and live model calls need it.

`PORT=9000 npm run dev` moves the API port; Vite follows it automatically.

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

### The landing is a scroll story

`src/components/ScrollStory.tsx` + `scenes.tsx`. A sticky stage holds four
full-bleed scenes — a farm with a tractor driving through the crops, a school
with a flag and children walking in, a construction site with a swinging crane
and a spinning mixer, and a village at sunset with elders on a bench. The acts
scroll over the stage and an IntersectionObserver cross-fades the scene and the
colour wash behind them. Apply now sits in the header and again on a sticky bar
at the foot of every act.

Motion is layered:

- **Continuous** — CSS keyframes on the scene itself (tractor, crane, flag, leaves).
- **Scroll-driven** — the progress rail uses native
  `animation-timeline: scroll(root block)`, behind an `@supports` guard.
- **Reveals** — native `animation-timeline: view()` where the browser has it
  (Chrome/Edge 115+), with the same IntersectionObserver adding an `.in` class as
  the baseline everywhere else, so Firefox and Safari behave identically.
  See [MDN, CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations).

Every keyframe is disabled by the global `prefers-reduced-motion` rule.

### Two layouts

Switchable from the header at any time — the toggle forces the
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

---

## Architecture — this is a full-stack application

The repo is TypeScript end to end, but that is the language, not the shape. There
is a real server, a real relational database and a real API behind the UI.

```
┌─ CLIENT ─────────────────────────────────────────────────────┐
│  React 18 + Vite PWA · four-page flow                        │
│  landing → documents → questions → results                   │
│  SchemeField (3D canvas) · Web Speech in/out · pdf-lib       │
└───────────────────────────┬──────────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────▼──────────────────────────────────┐
│  SERVER · Node + Express                                     │
│    routes/schemes       catalogue + attributes + personas    │
│    routes/applications  save & retrieve by reference code    │
│    routes/admin         upsert / verify / retire  (key-gated)│
│    routes/stats         anonymous aggregates                 │
│    extract · asr        Gemini vision · Groq Whisper         │
│  zod validation · rate limiting · request log · audit trail  │
└───────────────────────────┬──────────────────────────────────┘
┌───────────────────────────▼──────────────────────────────────┐
│  DATABASE · SQLite (better-sqlite3, WAL)                     │
│    scheme · attribute · application · event · audit          │
│    schema.sql migrations · seed from data/*.json             │
└──────────────────────────────────────────────────────────────┘
        ▲ the eligibility ENGINE sits beside all of this:
          pure TypeScript, no network, no DB, no model. 13 tests.
```

### API

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | status, mock flags, scheme count |
| GET | `/api/data` | catalogue + attributes in one bootstrap call |
| GET | `/api/schemes` · `/api/schemes/:id` | scheme catalogue from the DB |
| GET | `/api/attributes` | the attribute registry |
| GET | `/api/personas` | the four specimen test documents |
| POST | `/api/extract` | document image → typed fields + confidence |
| POST | `/api/asr` | audio → Indic transcript |
| POST | `/api/applications` | save a result, returns `HQ-XXXXXX` |
| GET | `/api/applications/:ref` | retrieve a saved result |
| GET | `/api/stats` | anonymous aggregates |
| POST | `/api/admin/schemes` | add or replace a scheme, no redeploy |
| POST | `/api/admin/schemes/:id/verify` | mark clause_text checked |
| DELETE | `/api/admin/schemes/:id` | retire a scheme |
| GET | `/api/admin/audit` | last 100 admin actions |

Admin routes require `x-admin-key` matching `ADMIN_KEY` in `.env`. Without that
variable set they return 503 — they are off by default.

```bash
npm run db:seed     # load data/*.json into SQLite
npm run db:reset    # wipe and reseed
```

### What is stored, and what is not

`application` holds a saved result under a random reference code, expires after
30 days, and is swept hourly. Any key matching `aadhaar|account|uid|card_no|mobile|phone`
is stripped server-side before the row is written — those values never reach us
anyway, because the client masks them at extraction. `event` holds counts only:
how many questions, how many matched, which scheme ids. There is no user table,
no login and no tracking.

### Every layer degrades instead of failing

A welfare kiosk in a tehsil office does not get to say "the database is down."
So each dependency has a defined behaviour when it is missing, and none of them
stops the citizen mid-flow:

| Missing | What happens |
|---|---|
| `GEMINI_API_KEY` | extraction returns a seeded profile; a banner says demo mode |
| `GROQ_API_KEY` | speech falls back to the browser's Web Speech API, then to typing |
| SQLite (native module fails) | the catalogue is read from `data/*.json`; saves live in memory for the session |
| the whole API process | the dev server answers the read endpoints from `data/*.json` |
| JavaScript-heavy motion | `prefers-reduced-motion` and the IntersectionObserver baseline still render every act |

`GET /api/health` reports which of these are active — `storage`, `mock.extract`,
`mock.asr` — so you never have to guess what the running instance is doing.

### Test documents

`data/personas.json` plus `public/personas/` ship four synthetic specimens — a
ration card, an income certificate, an e-Shram card and an Antyodaya card, each
with an illustrated portrait. Every one is stamped SPECIMEN and every artwork in
this repo was drawn for it. Nothing is scraped, and no real person's document or
photograph is used anywhere.
