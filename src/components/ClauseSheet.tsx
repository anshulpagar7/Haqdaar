import Icon from "./Icon";
import { explain } from "../engine";
import { T, tr } from "../i18n";
import type { Lang, Profile, Scheme } from "../engine/types";

export default function ClauseSheet({ scheme, profile, lang, onClose }: {
  scheme: Scheme; profile: Profile; lang: Lang; onClose: () => void;
}) {
  const rows = explain(scheme, profile);
  const ok = rows.filter((r) => r.result === true).length;

  return (
    <div className="scrim" onClick={onClose} role="dialog" aria-modal="true" aria-label={tr(T.whyQualify, lang)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <p className="eyebrow">{tr(T.whyQualify, lang)}</p>
        <h2>{scheme.name[lang] ?? scheme.name.en}</h2>
        <p className="tiny" style={{ marginBottom: 18 }}>{scheme.authority}</p>

        <div className="glass tint-mari card">
          <p className="eyebrow" style={{ margin: "0 0 8px" }}>{tr(T.officialClause, lang)}</p>
          <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 8px" }}>“{scheme.clause_text}”</p>
          <p className="tiny" style={{ margin: 0, wordBreak: "break-all" }}>
            {scheme.source_url}
            {scheme.verified === false && ` · ${tr(T.notVerified, lang)}`}
          </p>
        </div>

        <p className="eyebrow" style={{ marginTop: 20 }}>{tr(T.checked, lang)}</p>
        {rows.map((r, i) => (
          <div className="field" key={i}>
            <span className="k">
              <b className="mono">{r.criterion.attr}</b>
              <span className="conf">rule {r.rule}</span>
            </span>
            <span className="v" style={{ color: "var(--muted)", fontWeight: 600, fontSize: 13 }}>
              {r.yours === null ? "—" : String(r.yours)}
            </span>
            <span className={"pip " + (r.result === true ? "pip-green" : "pip-mari")}>
              {r.result === true ? <Icon name="check" size={14} stroke={3} /> : "?"}
            </span>
          </div>
        ))}

        <div className="glass tint-green card" style={{ marginTop: 12 }}>
          <b style={{ color: "var(--green)" }}>{ok} / {rows.length} {tr(T.satisfied, lang)}</b>
          <p className="tiny" style={{ margin: "4px 0 0", color: "var(--green)" }}>{tr(T.notModel, lang)}</p>
        </div>

        <p className="eyebrow" style={{ marginTop: 20 }}>{tr(T.applyAt, lang)}</p>
        <p style={{ fontSize: 14.5, margin: "0 0 6px" }}>
          <Icon name="pin" size={14} /> {scheme.apply.office ?? "—"}
        </p>
        {scheme.apply.url && (
          <a href={scheme.apply.url} target="_blank" rel="noreferrer"
             style={{ fontSize: 13.5, color: "var(--mari)", wordBreak: "break-all" }}>
            {scheme.apply.url}
          </a>
        )}

        <button className="btn btn-ghost btn-block" style={{ marginTop: 22 }} onClick={onClose}>
          <Icon name="close" size={16} />{tr(T.close, lang)}
        </button>
      </div>
    </div>
  );
}
