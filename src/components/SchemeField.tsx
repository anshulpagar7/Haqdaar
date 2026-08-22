import { useEffect, useRef } from "react";

/**
 * The eligibility field, rendered in perspective 3D on a 2D canvas.
 *
 * Every scheme still in play is a live point. As answers rule schemes out,
 * their points fall away and dim; confirmed-eligible ones pull toward the
 * centre and burn gold. It is the solver made visible — not decoration.
 *
 * No WebGL, no 3D library: ~26 KB of maths instead of 600 KB of dependency.
 */
type Phase = "eligible" | "candidate" | "out";

interface Node {
  x: number; y: number; z: number;      // home position on the shell
  tx: number; ty: number; tz: number;   // current animated position
  seed: number; real: boolean;
}

const AMBIENT = 620;
const TAU = Math.PI * 2;

export default function SchemeField({ total, living, eligible, height = 380, paused }:
  { total: number; living: number; eligible: number; height?: number; paused?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ living, eligible, total });
  state.current = { living, eligible, total };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes: Node[] = [];
    const N = AMBIENT + Math.max(total, 1);
    for (let i = 0; i < N; i++) {
      // even-ish distribution on a spherical shell (golden-angle spiral)
      const t = (i + 0.5) / N;
      const phi = Math.acos(1 - 2 * t);
      const theta = TAU * i * 0.6180339887;
      const r = 1 + (i % 7) * 0.035;
      const x = Math.sin(phi) * Math.cos(theta) * r;
      const y = Math.cos(phi) * r * 0.72;
      const z = Math.sin(phi) * Math.sin(theta) * r;
      nodes.push({ x, y, z, tx: x, ty: y, tz: z, seed: (i * 97) % 360, real: i >= AMBIENT });
    }

    let raf = 0, rot = 0, last = performance.now();
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth, h = cv.clientHeight;
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);

    const draw = (now: number) => {
      const dt = Math.min(48, now - last); last = now;
      if (!paused && !reduced) rot += dt * 0.00016;

      const W = cv.width, H = cv.height;
      const cx = W / 2, cy = H / 2;
      const scale = Math.min(W, H) * 0.36;
      ctx.clearRect(0, 0, W, H);

      const { living: liv, eligible: elig, total: tot } = state.current;
      const aliveRatio = tot ? liv / tot : 1;
      const eligRatio = tot ? elig / tot : 0;

      const cosR = Math.cos(rot), sinR = Math.sin(rot);
      type Draw = { sx: number; sy: number; r: number; a: number; c: string; glow: boolean };
      const out: Draw[] = [];

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const frac = (i % 1000) / 1000;

        let phase: Phase = "out";
        if (frac < eligRatio) phase = "eligible";
        else if (frac < aliveRatio) phase = "candidate";

        // ease each node toward where its phase says it should sit
        const wantR = phase === "eligible" ? 0.46 : phase === "candidate" ? 1 : 1.85;
        const k = reduced ? 1 : 0.055;
        n.tx += (n.x * wantR - n.tx) * k;
        n.ty += (n.y * wantR - n.ty) * k;
        n.tz += (n.z * wantR - n.tz) * k;

        // rotate about Y, then project
        const rx = n.tx * cosR - n.tz * sinR;
        const rz = n.tx * sinR + n.tz * cosR;
        const depth = 3.05 + rz;
        if (depth <= 0.35) continue;
        const p = 2.35 / depth;
        const sx = cx + rx * scale * p;
        const sy = cy + n.ty * scale * p;

        const near = Math.max(0, Math.min(1, (p - 0.55) / 0.95));
        const big = n.real ? 1.9 : 1;

        if (phase === "eligible") {
          const pulse = reduced ? 1 : 0.82 + 0.18 * Math.sin(now * 0.004 + n.seed);
          out.push({ sx, sy, r: (1.5 + near * 2.6) * big * pulse, a: 0.55 + near * 0.45,
                     c: "46,125,79", glow: true });
        } else if (phase === "candidate") {
          out.push({ sx, sy, r: (0.9 + near * 1.7) * big, a: 0.30 + near * 0.45,
                     c: "113,132,122", glow: false });
        } else {
          out.push({ sx, sy, r: (0.6 + near * 0.9) * big, a: 0.16 + near * 0.24,
                     c: "186,176,155", glow: false });
        }
      }

      out.sort((a, b) => a.r - b.r);
      for (const d of out) {
        if (d.glow) {
          const g = ctx.createRadialGradient(d.sx, d.sy, 0, d.sx, d.sy, d.r * 5.5 * dpr);
          g.addColorStop(0, `rgba(${d.c},${d.a * 0.4})`);
          g.addColorStop(1, `rgba(${d.c},0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(d.sx, d.sy, d.r * 5.5 * dpr, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = `rgba(${d.c},${d.a})`;
        ctx.beginPath(); ctx.arc(d.sx, d.sy, d.r * dpr, 0, TAU); ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [total, paused]);

  return (
    <div className="viz glass" style={{ height }}>
      <canvas ref={ref} role="img"
        aria-label={`Eligibility field: ${eligible} confirmed eligible, ${living} of ${total} schemes still possible.`} />
      <div className="viz-legend">
        <span><i style={{ background: "var(--green)" }} />Eligible</span>
        <span><i style={{ background: "#71847A" }} />Still possible</span>
        <span><i style={{ background: "#CFC4AA" }} />Ruled out</span>
      </div>
    </div>
  );
}
