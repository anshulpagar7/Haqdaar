import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { SceneFarm, SceneHome, SceneSchool, SceneWork } from "./scenes";

/**
 * Scroll story. A sticky stage holds four full-bleed scenes; the acts scroll
 * over it and an IntersectionObserver cross-fades the scene behind them.
 *
 * Reveals use the native scroll-driven `animation-timeline: view()` where the
 * browser has it (Chrome/Edge 115+), and fall back to the same observer adding
 * an `.in` class everywhere else — so it behaves identically in Firefox and
 * Safari. See MDN, "CSS scroll-driven animations".
 */

const ACTS = [
  {
    id: "farm", scene: <SceneFarm />, tone: "green",
    kicker: "For the farmer",
    title: "You own the land. The scheme is already funded. Nobody told you.",
    body: "PM-KISAN pays ₹6,000 a year to every landholding farmer family. Crop insurance costs 2% of the premium. A Kisan Credit Card cuts your interest. A tribal farmer in Maharashtra can get a well subsidised outright. Most people claim one of these, if any — because each one has to be discovered separately.",
    pills: ["PM-KISAN", "Crop insurance", "Kisan Credit Card", "Irrigation subsidy"],
  },
  {
    id: "school", scene: <SceneSchool />, tone: "sky",
    kicker: "For the student",
    title: "The fee waiver exists for exactly your income. You have never heard its name.",
    body: "Post-matric scholarships, tuition waivers for economically weaker students, a hostel maintenance allowance if you study away from home. They are all keyed to an income certificate you probably already hold — and every one of them requires you to know it exists before the deadline passes.",
    pills: ["Post-matric scholarship", "EBC fee waiver", "Hostel allowance", "Free skilling"],
  },
  {
    id: "work", scene: <SceneWork />, tone: "amber",
    kicker: "For the worker",
    title: "You registered on e-Shram once. That card is a door you never walked through.",
    body: "An unorganised worker under 40 can lock in a ₹3,000 monthly pension for ₹55 a month. Two lakh of accident cover costs ₹20 a year. There is housing assistance, a street-vendor loan, free health cover for the whole family. None of it arrives on its own.",
    pills: ["₹3,000 pension", "₹2L accident cover", "Housing", "Vendor loan"],
  },
  {
    id: "home", scene: <SceneHome />, tone: "clay",
    kicker: "For the elder, and the household",
    title: "A pension, a gas connection, a pucca house — each one form away.",
    body: "Old age pension at 60. Widow pension at 40. Five lakh of hospital cover per family, per year. A free LPG connection in a woman's name. A house grant if yours is kutcha. The money is allocated and sitting there. What is missing is the sentence that says: this one is yours.",
    pills: ["Old age pension", "Widow pension", "₹5L health cover", "Free LPG", "Housing grant"],
  },
];

export default function ScrollStory({ total, attrs, onStart }:
  { total: number; attrs: number; onStart: () => void }) {
  const [act, setAct] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            const i = (e.target as HTMLElement).dataset.act;
            if (i !== undefined && e.intersectionRatio > 0.34) setAct(Number(i));
          }
        }
      },
      { threshold: [0.12, 0.35, 0.6], rootMargin: "-8% 0px -8% 0px" }
    );
    el.querySelectorAll(".rv, .act").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <div className="story" ref={root}>
      <div className="story-progress" aria-hidden="true"><i /></div>

      <div className="story-stage" aria-hidden="true">
        {ACTS.map((a, i) => (
          <div key={a.id} className={"stage-layer" + (act === i ? " on" : "")}>{a.scene}</div>
        ))}
        <div className="stage-wash" data-tone={ACTS[act].tone} />
      </div>

      <div className="story-acts">
        {/* opening */}
        <section className="act act-hero" data-act="0">
          <div className="plate rv">
            <p className="eyebrow">हक़दार &nbsp;·&nbsp; the rightful claimant</p>
            <h1>Don't search for schemes.<br />Let the schemes find you.</h1>
            <p className="sub">
              India has thousands of welfare schemes and the money is already
              allocated — only about <b>40% of ₹50,000 crore</b> in worker welfare
              funds has ever been spent. Not because people don't qualify, but
              because nobody ever told them what they qualify for.
            </p>
            <div className="plate-cta">
              <button className="btn btn-primary" onClick={onStart}>
                <Icon name="arrow" size={16} />Apply now
              </button>
              <a className="btn btn-ghost" href="#how">See how it works</a>
            </div>
            <p className="tiny" style={{ margin: "14px 0 0" }}>
              <Icon name="down" size={12} /> Scroll — four lives, one gap
            </p>
          </div>
        </section>

        {/* four acts */}
        {ACTS.map((a, i) => (
          <section key={a.id} className="act" data-act={i} id={a.id}>
            <div className={"plate rv " + (i % 2 ? "plate-right" : "")}>
              <p className="eyebrow">{a.kicker}</p>
              <h2>{a.title}</h2>
              <p className="sub">{a.body}</p>
              <div className="pills">
                {a.pills.map((p) => <span key={p}>{p}</span>)}
              </div>
            </div>
          </section>
        ))}

        {/* how it works + close */}
        <section className="act act-end" data-act="3" id="how">
          <div className="plate plate-wide rv">
            <p className="eyebrow">How it works</p>
            <h2>Three steps, about ninety seconds.</h2>
            <div className="how">
              {[
                { i: "camera", t: "Photograph", d: "A vision model reads the ration card, land record or certificate already in your pocket. You type nothing." },
                { i: "filter", t: "Five questions", d: "Each one is chosen to eliminate the most schemes — spoken, in your own language." },
                { i: "layers", t: "Everything you're owed", d: "With the rupee value, the missing documents, the official clause, and how to actually apply." },
              ].map((s, n) => (
                <div key={s.t} className="how-step">
                  <span className="how-i"><Icon name={s.i} size={19} /></span>
                  <b>{String(n + 1).padStart(2, "0")} · {s.t}</b>
                  <span className="tiny">{s.d}</span>
                </div>
              ))}
            </div>
            <div className="statrow">
              <div><b className="num">{total || "…"}</b><span>schemes in the catalogue</span></div>
              <div><b className="num">{attrs || "…"}</b><span>eligibility attributes</span></div>
              <div><b className="num">~5</b><span>questions to converge</span></div>
              <div><b className="num">₹0</b><span>to run, no card needed</span></div>
            </div>
            <div className="plate-cta" style={{ marginTop: 20 }}>
              <button className="btn btn-primary btn-lg" onClick={onStart}>
                <Icon name="arrow" size={17} />Apply now — it takes 90 seconds
              </button>
            </div>
            <p className="tiny" style={{ marginTop: 12 }}>
              <Icon name="shield" size={12} /> Nothing is stored. ID numbers are masked before they leave the phone.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
