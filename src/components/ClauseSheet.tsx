import { explain } from "../engine";
import { T, tr } from "../i18n";
import type { Lang, Profile, Scheme } from "../engine/types";

export default function ClauseSheet({ scheme, profile, lang, onClose }: {
  scheme: Scheme; profile: Profile; lang: Lang; onClose: () => void;
}) {
  const rows = explain(scheme, profile);
  const ok = rows.filter((r) => r.result === true).length;

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <p className="eyebrow">{tr(T.whyQualify, lang).toUpperCase()}</p>
        <h2>{scheme.name[lang] ?? scheme.name.en}</h2>
        <p className="tiny" style={{ marginBottom: 16 }}>{scheme.authority}</p>

        <div className="card mari">
          <p className="eyebrow" style={{ margin: 0 }}>{tr(T.officialClause, lang)}</p>
          <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "8px 0 6px" }}>
            “{scheme.clause_text}”
          </p>
          <p className="tiny">
            {scheme.source_url}
            {scheme.verified === false && " · not yet verified against the notification"}
          </p>
        </div>

        <p className="eyebrow" style={{ marginTop: 18 }}>{tr(T.checked, lang)}</p>
        {rows.map((r, i) => (
          <div className="field" key={i}>
            <span className="k">
              <b className="mono" style={{ fontSize: 13 }}>{r.criterion.attr}</b>
              <span className="conf">rule {r.rule}</span>
            </span>
            <span className="v" style={{ fontWeight: 600, color: "var(--muted)", fontSize: 13 }}>
              {r.yours === null ? "—" : String(r.yours)}
            </span>
            <span className={"dot " + (r.result === true ? "green" : "mari")}>
              {r.result === true ? "✓" : "?"}
            </span>
          </div>
        ))}

        <div className="card green" style={{ marginTop: 12 }}>
          <b style={{ color: "var(--green-d)" }}>{ok} / {rows.length} {tr(T.satisfied, lang)}</b>
          <p className="tiny" style={{ color: "var(--green-d)", marginTop: 4 }}>
            {tr(T.notModel, lang)}
          </p>
        </div>

        <p className="eyebrow" style={{ marginTop: 18 }}>{tr(T.applyAt, lang).toUpperCase()}</p>
        <p style={{ fontSize: 14, margin: "0 0 4px" }}>{scheme.apply.office ?? "—"}</p>
        {scheme.apply.url && (
          <a href={scheme.apply.url} target="_blank" rel="noreferrer"
             style={{ fontSize: 13.5, color: "var(--mari-d)", wordBreak: "break-all" }}>
            {scheme.apply.url}
          </a>
        )}

        <button className="btn primary" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
