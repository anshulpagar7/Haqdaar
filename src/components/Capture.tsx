import { useRef, useState } from "react";
import Icon from "./Icon";
import { extractDocument, type ExtractResponse } from "../lib/api";
import { T, tr } from "../i18n";
import type { Lang, Profile } from "../engine/types";

const PRETTY: Record<string, string> = {
  state: "State", residence: "Village or town", age: "Age", gender: "Gender",
  annual_income_inr: "Annual income", category: "Category",
  ration_card_type: "Ration card", household_size: "Household size",
  owns_agri_land: "Owns farmland", landholding_ha: "Land held (ha)",
  has_disability_cert: "Disability certificate", disability_pct: "Disability %",
  education_level: "Studied up to", occupation: "Occupation",
  is_student: "Someone studying", is_widow: "Widow",
  owns_pucca_house: "Owns pucca house", has_bank_account: "Bank account",
  has_lpg_connection: "LPG connection", works_unorganised: "Unorganised work",
};

const show = (k: string, v: unknown) =>
  k === "annual_income_inr" ? "₹ " + Number(v).toLocaleString("en-IN")
  : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);

export default function Capture({ lang, profile, conf, onMerge, compact }: {
  lang: Lang;
  profile: Profile;
  conf: Record<string, number>;
  onMerge: (fields: Profile, docType: string, conf: Record<string, number>) => void;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<ExtractResponse | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setErr(null);
    try {
      const r = await extractDocument(f);
      setLast(r);
      onMerge(r.fields as Profile, r.doc_type, r.confidence);
    } catch (e: any) {
      setErr(e.message || "Could not read that image.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const known = Object.entries(profile);

  return (
    <section className="glass card" aria-labelledby="cap-h">
      <p className="eyebrow">{tr(T.yourProfile, lang)}</p>
      <h3 id="cap-h" style={{ marginBottom: 4 }}>{tr(T.step1, lang)}</h3>
      <p className="tiny" style={{ marginBottom: 14 }}>{tr(T.holdCard, lang)}</p>

      {err && <div className="err" role="alert">{err}</div>}

      <input ref={input} id="doc-file" type="file" accept="image/*" capture="environment"
             onChange={onFile} className="sr" />
      <label htmlFor="doc-file" className="btn btn-primary btn-block"
             style={{ cursor: busy ? "wait" : "pointer" }}>
        {busy ? <><span className="spin" />{tr(T.reading, lang)}</>
              : <><Icon name="camera" />{known.length ? tr(T.addAnother, lang) : tr(T.takePhoto, lang)}</>}
      </label>

      {known.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p className="eyebrow" style={{ color: "var(--dim)" }}>{tr(T.readFrom, lang)}</p>
          {known.map(([k, v]) => (
            <div className="field" key={k}>
              <span className="pip pip-green"><Icon name="check" size={14} stroke={3} /></span>
              <span className="k">
                {PRETTY[k] ?? k.replace(/_/g, " ")}
                {conf[k] !== undefined && (
                  <span className="conf">confidence {(conf[k] * 100).toFixed(0)}%</span>
                )}
              </span>
              <span className="v">{show(k, v)}</span>
            </div>
          ))}
        </div>
      )}

      {last?.masked_ids?.length ? (
        <p className="tiny" style={{ marginTop: 10 }}>
          ID on document <span className="mono">{last.masked_ids.join(", ")}</span> — masked before upload.
        </p>
      ) : null}

      {!compact && (
        <div className="glass tint-green card" style={{ marginTop: 14, padding: 14 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ color: "var(--green)" }}><Icon name="shield" /></span>
            <p className="tiny" style={{ margin: 0, color: "var(--green)" }}>{tr(T.privacy, lang)}</p>
          </div>
        </div>
      )}
    </section>
  );
}
