import { useState } from "react";
import Icon from "./Icon";
import SchemeCard from "./SchemeCard";
import { documentGap, totalAnnualValue } from "../engine";
import { buildApplicationPdf } from "../lib/pdf";
import { saveApplication } from "../lib/api";
import { T, tr } from "../i18n";
import type { Lang, Profile, Scheme } from "../engine/types";

export default function Results({ eligible, profile, docsHeld, lang, asked, onRestart }: {
  eligible: Scheme[]; profile: Profile; docsHeld: string[]; lang: Lang;
  asked: number; onRestart: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const total = totalAnnualValue(eligible);
  const { missing } = documentGap(eligible, docsHeld);

  async function download() {
    setBusy(true);
    try {
      const blob = await buildApplicationPdf(eligible, profile, missing);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "haqdaar-application.pdf"; a.click();
      URL.revokeObjectURL(url);
    } finally { setBusy(false); }
  }

  async function save() {
    try {
      const r = await saveApplication({
        lang, profile, docsHeld, eligibleIds: eligible.map((s) => s.id),
        totalValue: total, questionsAsked: asked,
      });
      setRef(r.reference);
    } catch { /* the result is still on screen either way */ }
  }

  return (
    <section className="glass card">
      <div className="steps" aria-hidden="true"><i className="on" /><i className="on" /><i className="on" /></div>
      <p className="eyebrow">Step 3 of 3 · {tr(T.yourResult, lang)}</p>
      <p className="sub" style={{ margin: 0 }}>{tr(T.entitled, lang)}</p>
      <div className="hero">
        <span className="num h-num">{eligible.length}</span>
        <span className="h-w">{tr(T.schemes, lang)}</span>
      </div>

      {total > 0 && (
        <div className="glass tint-green card" style={{ margin: "8px 0 18px" }}>
          <p className="eyebrow" style={{ color: "var(--green)", margin: "0 0 6px" }}>{tr(T.perYear, lang)}</p>
          <div className="num" style={{ fontSize: 34, color: "var(--green)" }}>₹ {total.toLocaleString("en-IN")}</div>
          <p className="tiny" style={{ margin: "6px 0 0", color: "var(--green)" }}>
            Already allocated. Already theirs. Simply never claimed.
          </p>
        </div>
      )}

      {eligible.length === 0 && <p className="sub">{tr(T.noneFound, lang)}</p>}

      <p className="tiny" style={{ marginBottom: 10 }}>
        <Icon name="info" size={12} /> Tap any scheme to open the full instructions — steps,
        documents, helpline and the clause it satisfied.
      </p>

      <div className="grid">
        {eligible.map((s) => (
          <SchemeCard key={s.id} scheme={s} profile={profile} docsHeld={docsHeld} lang={lang}
                      open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} />
        ))}
      </div>

      {missing.length > 0 && (
        <div className="glass card" style={{ marginTop: 14 }}>
          <p className="eyebrow" style={{ margin: "0 0 8px" }}>{tr(T.needed, lang)}</p>
          <div className="doclist">
            {missing.map((d) => <span key={d} className="doc-need">+ {d.replace(/_/g, " ")}</span>)}
          </div>
        </div>
      )}

      {ref && (
        <div className="glass tint-mari card" style={{ marginTop: 14 }}>
          <p className="eyebrow" style={{ margin: "0 0 4px" }}>Saved · quote this at the office</p>
          <div className="num" style={{ fontSize: 28, color: "var(--mari)", letterSpacing: ".06em" }}>{ref}</div>
          <p className="tiny" style={{ margin: "6px 0 0" }}>
            Kept for 30 days, then deleted. No identity numbers are stored against it.
          </p>
        </div>
      )}

      <div className="dock" style={{ marginTop: 16 }}>
        <button className="btn btn-primary btn-block" disabled={busy || !eligible.length} onClick={download}>
          {busy ? <span className="spin" /> : <Icon name="down" size={16} />}{tr(T.download, lang)}
        </button>
        {!ref && (
          <button className="btn btn-ghost btn-block" disabled={!eligible.length} onClick={save}>
            <Icon name="shield" size={16} />Save and get a reference code
          </button>
        )}
        <button className="btn btn-ghost btn-block" onClick={onRestart}>
          <Icon name="refresh" size={16} />{tr(T.startOver, lang)}
        </button>
      </div>
    </section>
  );
}
