import Icon from "./Icon";
import { T, tr } from "../i18n";
import type { Lang, Scheme } from "../engine/types";

/** Right-hand column of the desktop cockpit: what is confirmed so far and
 *  what is still in play, updating on every answer. */
export default function LiveList({ eligible, candidates, lang, onOpen, docsHeld }: {
  eligible: Scheme[]; candidates: Scheme[]; lang: Lang;
  onOpen: (s: Scheme) => void; docsHeld: string[];
}) {
  const amount = (s: Scheme) =>
    s.benefit.amount_inr_per_year ? `₹ ${s.benefit.amount_inr_per_year.toLocaleString("en-IN")} / yr`
    : s.benefit.one_time_inr ? `₹ ${s.benefit.one_time_inr.toLocaleString("en-IN")} one-time`
    : s.benefit.note ?? "";

  return (
    <section className="glass card" aria-labelledby="live-h">
      <p className="eyebrow">{tr(T.liveResults, lang)}</p>
      <h3 id="live-h">
        {eligible.length} {tr(T.confirmed, lang)}
        <span style={{ color: "var(--dim)", fontWeight: 500 }}> · {candidates.length} {tr(T.stillOpen, lang)}</span>
      </h3>

      <div style={{ marginTop: 14 }}>
        {eligible.length === 0 && candidates.length > 0 && (
          <p className="tiny">{tr(T.keepGoing, lang)}</p>
        )}
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

        {candidates.slice(0, 5).map((s) => (
          <div className="field" key={s.id} style={{ opacity: 0.62 }}>
            <span className="pip" style={{ background: "rgba(255,255,255,.1)", color: "var(--dim)" }}>
              <Icon name="filter" size={13} />
            </span>
            <span className="k">{s.name[lang] ?? s.name.en}</span>
          </div>
        ))}
        {candidates.length > 5 && (
          <p className="tiny" style={{ marginTop: 6 }}>
            + {candidates.length - 5} {tr(T.moreStillOpen, lang)}
          </p>
        )}
      </div>
    </section>
  );
}
