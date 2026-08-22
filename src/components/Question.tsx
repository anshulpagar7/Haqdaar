import { useEffect, useState } from "react";
import Counter from "./Counter";
import { T, tr } from "../i18n";
import { hasNativeSTT, interpret, listenNative, NO_WORDS, recordClip, say, stopSpeaking, YES_WORDS } from "../lib/speech";
import { transcribe } from "../lib/api";
import type { AttributeDef, Lang, NextQuestion, Value } from "../engine/types";

interface Opt { value: Value; label: string; hint?: string; spoken: string[] }

function options(def: AttributeDef, lang: Lang): Opt[] {
  if (def.type === "boolean")
    return [
      { value: true, label: tr(T.yes, lang), spoken: YES_WORDS },
      { value: false, label: tr(T.no, lang), spoken: NO_WORDS },
    ];
  if (def.type === "enum")
    return (def.values ?? []).map((v) => {
      const l = def.labels?.[String(v)];
      const label = l ? l[lang] ?? l.en : String(v);
      return { value: v, label, spoken: [label, String(v), l?.en ?? ""].filter(Boolean) };
    });
  return (def.bands ?? []).map(([lo, hi]) => {
    const mid = Math.round((lo + hi) / 2);
    const money = hi > 20000;
    const fmt = (n: number) => (money ? "₹" + n.toLocaleString("en-IN") : String(n));
    return { value: mid, label: `${fmt(lo)} – ${fmt(hi)}`, spoken: [String(lo), String(hi), String(mid)] };
  });
}

export default function Question({ q, index, lang, trail, start, onAnswer, onSkip }: {
  q: NextQuestion; index: number; lang: Lang; trail: number[]; start: number;
  onAnswer: (attr: string, value: Value) => void;
  onSkip: (attr: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const opts = options(q.def, lang);
  const text = q.def.question[lang] ?? q.def.question.en;

  useEffect(() => { setHeard(null); say(text, lang); return stopSpeaking; }, [q.attr, lang]);

  async function listen() {
    setListening(true); setHeard(null); stopSpeaking();
    try {
      const said = hasNativeSTT()
        ? await listenNative(lang)
        : (await transcribe(await recordClip(3500), lang)).text;
      setHeard(said);
      const v = interpret(said, opts);
      if (v !== undefined) onAnswer(q.attr, v as Value);
    } catch {
      setHeard("—");
    } finally {
      setListening(false);
    }
  }

  return (
    <>
      <div className="body">
        <div className="steps">
          {[0, 1, 2, 3, 4].map((i) => <i key={i} className={i <= index ? "on" : ""} />)}
        </div>
        <p className="eyebrow">{tr(T.question, lang).toUpperCase()} {index + 1}</p>
        <h1>{text}</h1>
        {lang !== "en" && <p className="sub">{q.def.question.en}</p>}

        <Counter trail={trail} lang={lang} start={start} />

        <div className="answers">
          {opts.map((o) => (
            <button key={String(o.value)} className="ans" onClick={() => onAnswer(q.attr, o.value)}>
              <span>{o.label}</span>
            </button>
          ))}
          <button className="ans" style={{ color: "var(--muted)" }} onClick={() => onSkip(q.attr)}>
            <span>{tr(T.dontKnow, lang)}</span>
          </button>
        </div>

        <button className="btn ghost sm" style={{ marginTop: 14 }} disabled={listening} onClick={listen}>
          {listening ? <><span className="spin dark" /> …</> : <>🎙  {tr(T.speak, lang)}</>}
        </button>
        {heard && <p className="tiny" style={{ marginTop: 8 }}>heard: “{heard}”</p>}

        <p className="tiny" style={{ marginTop: 14 }}>
          This question was chosen because it is expected to rule out{" "}
          <b>{q.gain.toFixed(1)}</b> of the {q.candidatesNow} remaining schemes —
          the highest gain per unit of effort of anything we could ask.
        </p>
      </div>
    </>
  );
}
