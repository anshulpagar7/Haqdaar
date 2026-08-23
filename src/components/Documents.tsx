import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { extractDocument, loadPersonas, type Persona } from "../lib/api";
import { T, tr } from "../i18n";
import type { Lang, Profile } from "../engine/types";

const PRETTY: Record<string, string> = {
  state: "State", residence: "Village or town", age: "Age", gender: "Gender",
  annual_income_inr: "Annual income", category: "Category", ration_card_type: "Ration card",
  household_size: "Household size", owns_agri_land: "Owns farmland",
  landholding_ha: "Land held (ha)", has_disability_cert: "Disability certificate",
  disability_pct: "Disability %", education_level: "Studied up to", occupation: "Occupation",
  is_student: "Someone studying", is_widow: "Widow", owns_pucca_house: "Owns pucca house",
  has_bank_account: "Bank account", has_lpg_connection: "LPG connection",
  works_unorganised: "Unorganised work",
};
const show = (k: string, v: unknown) =>
  k === "annual_income_inr" ? "₹ " + Number(v).toLocaleString("en-IN")
  : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);

export default function Documents({ lang, profile, conf, chosen, mock, onMerge, onChoose, onNext }: {
  lang: Lang; profile: Profile; conf: Record<string, number>; chosen: Persona | null;
  mock?: { extract: boolean; asr: boolean } | null;
  onMerge: (f: Profile, docType: string, c: Record<string, number>, ids?: string[]) => void;
  onChoose: (p: Persona | null) => void;
  onNext: () => void;
}) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { loadPersonas().then(setPersonas).catch(() => {}); }, []);

  /** Picking a specimen replays what the extractor returns for that document,
   *  field by field, so the demo shows the same behaviour without burning quota. */
  function pick(p: Persona) {
    if (chosen?.id === p.id) return;
    onChoose(p);
    setReading(true);
    setTimeout(() => {
      onMerge(p.fields as Profile, p.document_type, p.confidence, p.masked_ids);
      setReading(false);
    }, 850);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setErr(null); onChoose(null);
    try {
      const r = await extractDocument(f);
      onMerge(r.fields as Profile, r.doc_type, r.confidence, r.masked_ids);
    } catch (e: any) { setErr(e.message || "Could not read that image."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }

  const known = Object.entries(profile);

  return (
    <section className="glass card">
      <div className="steps" aria-hidden="true"><i className="on" /><i /><i /></div>
      <p className="eyebrow">Step 1 of 3 · your documents</p>
      <h2>Show a document, and we read it for you</h2>
      <p className="sub">
        Pick one of the four specimen documents below to try it, or photograph your own.
        Every specimen is clearly marked — no real citizen's document is ever used.
      </p>

      {(mock?.extract || mock?.asr) && (
        <p className="tiny" style={{ marginTop: -4, marginBottom: 14 }}>
          <Icon name="info" size={12} /> Demo mode — no model key is set, so{" "}
          {mock.extract && "document reading"}{mock.extract && mock.asr && " and "}
          {mock.asr && "speech"} replay a recorded result. Everything after this step is real.
        </p>
      )}

      {err && <div className="err" role="alert">{err}</div>}

      <div className="personas">
        {personas.map((p) => (
          <button key={p.id} className="persona" aria-pressed={chosen?.id === p.id}
                  onClick={() => pick(p)}>
            <img src={p.portrait} alt="" width={54} height={54} />
            <span style={{ minWidth: 0 }}>
              <b>{p.name}</b>
              <span className="tag">{p.tagline}</span>
              <span className="st">{p.story}</span>
              <span className="chip chip-mari" style={{ marginTop: 8, display: "inline-flex" }}>
                <Icon name="file" size={11} />{p.document_label}
              </span>
            </span>
          </button>
        ))}
      </div>

      <input ref={input} id="own-doc" type="file" accept="image/*" capture="environment"
             onChange={onFile} className="sr" />
      <label htmlFor="own-doc" className="btn btn-ghost btn-block" style={{ cursor: busy ? "wait" : "pointer" }}>
        {busy ? <><span className="spin" />{tr(T.reading, lang)}</>
              : <><Icon name="camera" size={16} />Photograph your own document instead</>}
      </label>

      {chosen && (
        <div style={{ marginTop: 18 }}>
          <h4 className="eyebrow">The document being read</h4>
          <div className="docshot">
            <span className="stamp">SPECIMEN</span>
            <img src={chosen.document} alt={`${chosen.document_label} for ${chosen.name}`} />
          </div>
        </div>
      )}

      {(reading || known.length > 0) && (
        <div style={{ marginTop: 6 }}>
          <h4 className="eyebrow">{reading ? tr(T.reading, lang) : tr(T.readFrom, lang)}</h4>
          {reading && <div className="glass card" style={{ padding: 14 }}>
            <span className="spin dark" /> <span className="tiny">extracting fields…</span></div>}
          {!reading && known.map(([k, v]) => (
            <div className="field" key={k}>
              <span className="pip pip-green"><Icon name="check" size={14} stroke={3} /></span>
              <span className="k">
                {PRETTY[k] ?? k.replace(/_/g, " ")}
                {conf[k] !== undefined && <span className="conf">confidence {(conf[k] * 100).toFixed(0)}%</span>}
              </span>
              <span className="v">{show(k, v)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="dock" style={{ marginTop: 16 }}>
        <button className="btn btn-primary btn-block" onClick={onNext} disabled={reading}>
          <Icon name="arrow" size={16} />
          {known.length ? `Continue with ${known.length} known facts` : "Skip — just ask me questions"}
        </button>
      </div>
    </section>
  );
}
