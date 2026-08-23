import { useEffect, useState } from "react";
import Icon from "./Icon";
import { T, tr } from "../i18n";
import { hasNativeSTT, interpret, listenNative, NO_WORDS, recordClip, say, stopSpeaking, voiceFor, YES_WORDS } from "../lib/speech";
import { transcribe } from "../lib/api";
import type { AttributeDef, Lang, NextQuestion, Value } from "../engine/types";

interface Opt { value: Value; label: string; spoken: string[] }

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

export default function Question({ q, index, lang, onAnswer, onSkip }: {
  q: NextQuestion; index: number; lang: Lang;
  onAnswer: (attr: string, value: Value) => void;
  onSkip: (attr: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const opts = options(q.def, lang);
  const text = q.def.question[lang] ?? q.def.question.en;

  const [voice, setVoice] = useState<{ name: string; lang: string; substitute: boolean } | null>(null);

  useEffect(() => {
    setHeard(null);
    let live = true;
    /* say() waits for the browser to finish loading its voice list, so guard
     * against the question changing while that is still in flight. */
    (async () => { if (live) await say(text, lang); })();
    voiceFor(lang).then((v) => { if (live) setVoice(v); });
    return () => { live = false; stopSpeaking(); };
  }, [q.attr, lang]);

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
    } finally { setListening(false); }
  }

  return (
    <section className="glass card" aria-labelledby="q-h">
      <div className="steps" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <i key={i} className={i <= index ? "on" : ""} />)}
      </div>

      <p className="eyebrow">{tr(T.question, lang)} {index + 1}</p>
      <h2 id="q-h" lang={lang} className={lang === "en" ? "" : "deva"}>{text}</h2>
      {lang !== "en" && <p className="sub" style={{ marginBottom: 18 }}>{q.def.question.en}</p>}

      <div className="answers" role="group" aria-labelledby="q-h">
        {opts.map((o) => (
          <button key={String(o.value)} className="ans" onClick={() => onAnswer(q.attr, o.value)}>
            <span className={lang === "en" ? "" : "deva"}>{o.label}</span>
            <span className="arw"><Icon name="arrow" size={16} /></span>
          </button>
        ))}
        <button className="ans ans-quiet" onClick={() => onSkip(q.attr)}>
          <span>{tr(T.dontKnow, lang)}</span>
        </button>
      </div>

      <div className="voicebar">
        <button className="btn btn-ghost btn-sm" onClick={() => say(text, lang)}
                aria-label="Read the question aloud again">
          <Icon name="speaker" size={16} />{tr(T.replay, lang)}
        </button>
        <button className="btn btn-ghost btn-sm" disabled={listening} onClick={listen}
                aria-label={tr(T.speakAria, lang)}>
          {listening ? <><span className="spin" />{tr(T.listening, lang)}</>
                     : <><Icon name="mic" size={16} />{tr(T.speak, lang)}</>}
        </button>
      </div>
      {heard && <p className="tiny" style={{ marginTop: 8 }}>{tr(T.heard, lang)} “{heard}”</p>}
      {voice?.substitute && (
        <p className="tiny" style={{ marginTop: 8 }}>
          <Icon name="info" size={12} /> No {lang === "mr" ? "Marathi" : "Hindi"} voice is installed
          on this device — reading in {voice.name} ({voice.lang}).
        </p>
      )}

      <p className="tiny" style={{ marginTop: 16, borderTop: "1px solid var(--brd)", paddingTop: 12 }}>
        <Icon name="spark" size={13} />{" "}
        {tr(T.whyThis, lang)
          .replace("{g}", q.gain.toFixed(1))
          .replace("{c}", String(q.candidatesNow))}
      </p>
    </section>
  );
}
