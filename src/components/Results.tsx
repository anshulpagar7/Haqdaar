import { useState } from "react";
import Icon from "./Icon";
import { documentGap, totalAnnualValue } from "../engine";
import { buildApplicationPdf } from "../lib/pdf";
import { T, tr } from "../i18n";
import type { Lang, Profile, Scheme } from "../engine/types";

export default function Results({ eligible, profile, docsHeld, lang, onOpen, onRestart }: {
  eligible: Scheme[]; profile: Profile; docsHeld: string[]; lang: Lang;
  onOpen: (s: Scheme) => void; onRestart: () => void;
}) {
  const [busy, setBusy] = useState(false);
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

  const amount = (s: Scheme) =>
    s.benefit.amount_inr_per_year ? `₹ ${s.benefit.amount_inr_per_year.toLocaleString("en-IN")} / yr`
    : s.benefit.one_time_inr ? `₹ ${s.benefit.one_time_inr.toLocaleString("en-IN")} one-time`
    : s.benefit.note ?? "";

  return (
    <section className="glass card" aria-labelledby="res-h">
      <p className="eyebrow">{tr(T.yourResult, lang)}</p>
      <p className="sub" style={{ margin: 0 }}>{tr(T.entitled, lang)}</p>
      <div className="hero">
        <span className="num h-num">{eligible.length}</span>
        <span className="h-w" id="res-h">{tr(T.schemes, lang)}</span>
      </div>

      {total > 0 && (
        <div className="glass tint-green card" style={{ margin: "8px 0 18px" }}>
          <p className="eyebrow" style={{ color: "var(--green)", margin: "0 0 6px" }}>{tr(T.perYear, lang)}</p>
          <div className="num" style={{ fontSize: 34, color: "var(--green)" }}>
            ₹ {total.toLocaleString("en-IN")}
          </div>
        </div>
      )}

      {eligible.length === 0 && <p className="sub">{tr(T.noneFound, lang)}</p>}

      {eligible.map((s) => {
        const need = s.documents_required.filter((d) => !docsHeld.includes(d));
        return (
          <button className="scheme" key={s.id} onClick={() => onOpen(s)}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="n">{s.name[lang] ?? s.name.en}</span>
              <span className="a">{amount(s)}</span>
            </span>
            <span className={"chip " + (need.length ? "chip-mari" : "chip-green")}>
              {need.length ? `${need.length} ${tr(T.docsMissing, lang)}` : tr(T.docsReady, lang)}
            </span>
          </button>
        );
      })}

      {missing.length > 0 && (
        <div className="glass card" style={{ marginTop: 12 }}>
          <p className="eyebrow" style={{ margin: "0 0 8px" }}>{tr(T.needed, lang)}</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.8, color: "var(--muted)" }}>
            {missing.map((d) => <li key={d}>{d.replace(/_/g, " ")}</li>)}
          </ul>
        </div>
      )}

      <p className="tiny" style={{ marginTop: 16 }}>{tr(T.auditNote, lang)}</p>

      <div className="dock" style={{ marginTop: 16 }}>
        <button className="btn btn-primary btn-block" disabled={busy || !eligible.length} onClick={download}>
          {busy ? <span className="spin" /> : <Icon name="down" size={16} />}
          {tr(T.download, lang)}
        </button>
        <button className="btn btn-ghost btn-block" onClick={onRestart}>
          <Icon name="refresh" size={16} />{tr(T.startOver, lang)}
        </button>
      </div>
    </section>
  );
}
