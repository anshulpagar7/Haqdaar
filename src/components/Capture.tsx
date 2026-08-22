import { useRef, useState } from "react";
import { extractDocument, type ExtractResponse } from "../lib/api";
import { T, tr } from "../i18n";
import type { Lang, Profile } from "../engine/types";

const PRETTY: Record<string, string> = {
  state: "State", residence: "Village or town", age: "Age", gender: "Gender",
  annual_income_inr: "Annual income", category: "Category",
  ration_card_type: "Ration card", household_size: "Household size",
  owns_agri_land: "Owns farmland", landholding_ha: "Land held (ha)",
  has_disability_cert: "Disability certificate", disability_pct: "Disability %",
  education_level: "Studied up to",
};

const show = (k: string, v: unknown) =>
  k === "annual_income_inr" ? "₹ " + Number(v).toLocaleString("en-IN")
  : typeof v === "boolean" ? (v ? "Yes" : "No")
  : String(v);

export default function Capture({ lang, profile, onMerge, onDone }: {
  lang: Lang;
  profile: Profile;
  onMerge: (fields: Profile, docType: string, conf: Record<string, number>) => void;
  onDone: () => void;
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
    <>
      <div className="body">
        <div className="steps"><i className="on" /><i /><i /></div>
        <p className="eyebrow">STEP 1 {tr(T.of, lang).toUpperCase()} 3</p>
        <h1>{tr(T.step1, lang)}</h1>
        <p className="sub">{tr(T.holdCard, lang)}</p>

        {err && <div className="err">{err}</div>}

        {known.length > 0 && (
          <>
            <p className="eyebrow" style={{ marginTop: 4 }}>{tr(T.readFrom, lang).toUpperCase()}</p>
            {known.map(([k, v]) => (
              <div className="field" key={k}>
                <span className="dot green">✓</span>
                <span className="k">
                  {PRETTY[k] ?? k.replace(/_/g, " ")}
                  {last?.confidence?.[k] !== undefined && (
                    <span className="conf">confidence {(last.confidence[k] * 100).toFixed(0)}%</span>
                  )}
                </span>
                <span className="v">{show(k, v)}</span>
              </div>
            ))}
          </>
        )}

        {last?.masked_ids?.length ? (
          <p className="tiny" style={{ marginTop: 10 }}>
            ID on document: <span className="mono">{last.masked_ids.join(", ")}</span> — masked before upload.
          </p>
        ) : null}

        <div className="card green" style={{ marginTop: 18 }}>
          <p className="tiny" style={{ color: "var(--green-d)", fontWeight: 600 }}>
            {tr(T.privacy, lang)}
          </p>
        </div>
      </div>

      <div className="foot">
        <input ref={input} type="file" accept="image/*" capture="environment"
               onChange={onFile} className="hide" />
        <button className="btn mari" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <><span className="spin dark" />{tr(T.reading, lang)}</>
                : (known.length ? tr(T.addAnother, lang) : tr(T.takePhoto, lang))}
        </button>
        <div style={{ height: 10 }} />
        <button className="btn ghost" onClick={onDone}>
          {known.length ? tr(T.continue, lang) : tr(T.skip, lang)}
        </button>
      </div>
    </>
  );
}
