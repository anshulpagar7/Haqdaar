import { useEffect, useRef, useState } from "react";
import { T, tr } from "../i18n";
import type { Lang } from "../engine/types";

/** Animated tally. The number tweens; the meter uses transform, never width. */
export default function Counter({ trail, lang, start }:
  { trail: number[]; lang: Lang; start: number }) {
  const now = trail[trail.length - 1] ?? start;
  const was = trail.length > 1 ? trail[trail.length - 2] : null;
  const [shown, setShown] = useState(now);
  const from = useRef(now);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setShown(now); from.current = now; return; }
    const a = from.current, b = now, t0 = performance.now(), dur = 480;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(a + (b - a) * e));
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = b;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [now]);

  const pct = start ? Math.max(0.03, now / start) : 1;

  return (
    <div className="glass counter" aria-live="polite">
      <div className="lbl">{tr(T.possible, lang)}</div>
      <div className="num big">{shown}</div>
      {was !== null && was !== now && (
        <div className="was">{tr(T.wasBefore, lang).replace("{n}", String(was))}</div>
      )}
      <div className="meter"><i style={{ transform: `scaleX(${pct})` }} /></div>
      {trail.length > 1 && (
        <div className="trail">
          {trail.map((n, i) => (
            <span key={i} style={{ display: "contents" }}>
              {i > 0 && <span>→</span>}
              {i === trail.length - 1 ? <b>{n}</b> : <span>{n}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
