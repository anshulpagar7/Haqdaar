import { useState } from "react";
import ClauseSheet from "./ClauseSheet";
import { documentGap, totalAnnualValue } from "../engine";
import { buildApplicationPdf } from "../lib/pdf";
import { T, tr } from "../i18n";
import type { Lang, Profile, Scheme } from "../engine/types";

export default function Results({ eligible, profile, docsHeld, lang, onRestart }: {
  eligible: Scheme[]; profile: Profile; docsHeld: string[]; lang: Lang; onRestart: () => void;
}) {
  const [open, setOpen] = useState<Scheme | null>(null);
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

  return (
    <>
      <div className="body">
        <p className="eyebrow">YOUR RESULT</p>
        <p className="sub" style={{ margin: 0 }}>{tr(T.entitled, lang)}</p>
        <div className="hero">
          <span className="big">{eligible.length}</span>
          <span className="w">{tr(T.schemes, lang)}</span>
        </div>

        {total > 0 && (
          <div className="card green" style={{ marginBottom: 16 }}>
            <p className="eyebrow" style={{ color: "var(--green-d)", margin: 0 }}>{tr(T.perYear, lang)}</p>
            <div style={{ fontSize: 30, fontWeight: 900, color: "var(--green-d)", marginTop: 4 }}>
              ₹ {total.toLocaleString("en-IN")}
            </div>
          </div>
        )}

        {eligible.length === 0 && <div className="card">{tr(T.noneFound, lang)}</div>}

        {eligible.map((s) => {
          const need = s.documents_required.filter((d) => !docsHeld.includes(d));
          const amt = s.benefit.amount_inr_per_year
            ? `₹ ${s.benefit.amount_inr_per_year.toLocaleString("en-IN")} / yr`
            : s.benefit.one_time_inr
            ? `₹ ${s.benefit.one_time_inr.toLocaleString("en-IN")} one-time`
            : s.benefit.note ?? "";
          return (
            <div className="scheme" key={s.id} onClick={() => setOpen(s)}>
              <div className="between">
                <div style={{ flex: 1 }}>
                  <div className="n">{s.name[lang] ?? s.name.en}</div>
                  <div className="a">{amt}</div>
                </div>
                <span className={"chip " + (need.length ? "mari" : "green")}>
                  {need.length ? `${need.length} ${tr(T.docsMissing, lang)}` : tr(T.docsReady, lang)}
                </span>
              </div>
            </div>
          );
        })}

        {missing.length > 0 && (
          <div className="card plain" style={{ marginTop: 14 }}>
            <p className="eyebrow" style={{ margin: 0 }}>{tr(T.needed, lang).toUpperCase()}</p>
            <ul style={{ margin: "10px 0 0 18px", padding: 0, fontSize: 14, lineHeight: 1.7 }}>
              {missing.map((d) => <li key={d}>{d.replace(/_/g, " ")}</li>)}
            </ul>
          </div>
        )}

        <p className="tiny" style={{ marginTop: 16 }}>
          Tap any scheme to see the exact clause it satisfied. Every result here was decided by a
          deterministic rule engine — no part of it was written by a language model.
        </p>
      </div>

      <div className="foot">
        <button className="btn mari" disabled={busy || !eligible.length} onClick={download}>
          {busy ? <span className="spin dark" /> : "⬇"} {tr(T.download, lang)}
        </button>
        <div style={{ height: 10 }} />
        <button className="btn ghost" onClick={onRestart}>{tr(T.startOver, lang)}</button>
      </div>

      {open && <ClauseSheet scheme={open} profile={profile} lang={lang} onClose={() => setOpen(null)} />}
    </>
  );
}
