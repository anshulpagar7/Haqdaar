import Icon from "./Icon";
import { explain } from "../engine";
import type { Lang, Profile, Scheme } from "../engine/types";

interface HowTo {
  steps: { title: string; detail: string }[];
  where: string; url: string | null; processing_time: string; helpline: string;
  documents: { key: string; label: string }[];
  tips: string[]; common_rejections: string[];
}

export const amountOf = (s: Scheme) =>
  s.benefit.amount_inr_per_year ? `₹ ${s.benefit.amount_inr_per_year.toLocaleString("en-IN")} / year`
  : s.benefit.one_time_inr ? `₹ ${s.benefit.one_time_inr.toLocaleString("en-IN")} one-time`
  : s.benefit.note ?? "—";

export default function SchemeCard({ scheme, profile, docsHeld, lang, open, onToggle }: {
  scheme: Scheme & { how_to?: HowTo | null };
  profile: Profile; docsHeld: string[]; lang: Lang;
  open: boolean; onToggle: () => void;
}) {
  const how = scheme.how_to ?? null;
  const need = scheme.documents_required.filter((d) => !docsHeld.includes(d));
  const rows = explain(scheme, profile);
  const ok = rows.filter((r) => r.result === true).length;

  return (
    <div className={"tile" + (open ? " open" : "")}>
      <button onClick={onToggle} aria-expanded={open}
              style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}>
        <span className="thead">
          <span style={{ minWidth: 0 }}>
            <span className="tname">{scheme.name[lang] ?? scheme.name.en}</span>
            <span className="tauth">{scheme.authority}</span>
          </span>
          <span className={"chip " + (need.length ? "chip-mari" : "chip-green")}>
            {need.length ? `${need.length} doc${need.length > 1 ? "s" : ""} needed` : "Docs ready"}
          </span>
        </span>
        <span className="tamt">{amountOf(scheme)}</span>
        {!open && (
          <span className="tiny" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
            <Icon name="down" size={13} />Tap for how to apply
          </span>
        )}
      </button>

      {open && how && (
        <div className="detail">
          <div className="dcols">
            <div>
              <h4>How to apply</h4>
              <ol className="stepl">
                {how.steps.map((s, i) => (
                  <li key={i}><b>{s.title}</b><span>{s.detail}</span></li>
                ))}
              </ol>

              <h4>What you need to take</h4>
              <div className="doclist">
                {how.documents.map((d) => (
                  <span key={d.key} className={docsHeld.includes(d.key) ? "doc-have" : "doc-need"}>
                    {docsHeld.includes(d.key) ? "✓ " : "+ "}{d.label}
                  </span>
                ))}
              </div>

              <h4>What gets applications rejected</h4>
              <ul className="bullets">
                {how.common_rejections.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <div>
              <h4>At a glance</h4>
              <div className="kv"><span>Benefit</span><span>{amountOf(scheme)}</span></div>
              <div className="kv"><span>Where to go</span><span>{how.where}</span></div>
              <div className="kv"><span>How long it takes</span><span>{how.processing_time}</span></div>
              <div className="kv"><span>Helpline</span><span>{how.helpline}</span></div>
              {scheme.deadline && <div className="kv"><span>Deadline</span><span>{scheme.deadline}</span></div>}
              <div className="kv"><span>Level</span><span>{scheme.level === "central" ? "Central" : "State"}</span></div>

              <h4>Why you qualify</h4>
              <div className="glass tint-mari card" style={{ padding: 14 }}>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>“{scheme.clause_text}”</p>
                <p className="tiny" style={{ margin: "8px 0 0", wordBreak: "break-all" }}>
                  {scheme.source_url}{scheme.verified === false && " · not yet verified against the notification"}
                </p>
              </div>
              <div style={{ marginTop: 10 }}>
                {rows.map((r, i) => (
                  <div className="kv" key={i}>
                    <span className="mono">{r.criterion.attr} {r.rule}</span>
                    <span style={{ color: r.result === true ? "var(--green)" : "var(--mari)" }}>
                      {r.yours === null ? "—" : String(r.yours)} {r.result === true ? "✓" : "?"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="tiny" style={{ marginTop: 8, color: "var(--green)" }}>
                {ok} of {rows.length} conditions satisfied · decided by the solver, not the model
              </p>

              <h4>Worth knowing</h4>
              <ul className="bullets">{how.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>

              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                {how.url && (
                  <a className="btn btn-primary btn-sm" href={how.url} target="_blank" rel="noreferrer">
                    <Icon name="arrow" size={14} />Apply online
                  </a>
                )}
                <button className="btn btn-ghost btn-sm" onClick={onToggle}>
                  <Icon name="close" size={14} />Collapse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
