import { T, tr } from "../i18n";
import type { Lang } from "../engine/types";

export default function Counter({ trail, lang, start }:
  { trail: number[]; lang: Lang; start: number }) {
  const now = trail[trail.length - 1];
  const was = trail.length > 1 ? trail[trail.length - 2] : null;
  const pct = start ? Math.max(2, Math.round((now / start) * 100)) : 100;

  return (
    <div className="counter">
      <div className="lbl">{tr(T.possible, lang)}</div>
      <div className="n">{now}</div>
      {was !== null && was !== now && (
        <div className="was">{tr(T.wasBefore, lang).replace("{n}", String(was))}</div>
      )}
      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      <div className="trail">{trail.join("   →   ")}</div>
    </div>
  );
}
