import { useEffect, useMemo, useState } from "react";
import Capture from "./components/Capture";
import Question from "./components/Question";
import Results from "./components/Results";
import { livingSet, match, nextQuestion } from "./engine";
import { health, loadData } from "./lib/api";
import { LANGS, T, tr } from "./i18n";
import type { Lang, Profile, Registry, Scheme, Value } from "./engine/types";

type Stage = "intro" | "capture" | "questions" | "results";

/** Stop asking once the best remaining question would rule out fewer than this
 *  many schemes. Five easy questions beat twelve pedantic ones. */
const MIN_GAIN = 1;
const MAX_QUESTIONS = 6;

export default function App() {
  const [lang, setLang] = useState<Lang>("mr");
  const [stage, setStage] = useState<Stage>("intro");
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [registry, setRegistry] = useState<Registry>({});
  const [profile, setProfile] = useState<Profile>({});
  const [docsHeld, setDocsHeld] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [trail, setTrail] = useState<number[]>([]);
  const [asked, setAsked] = useState(0);
  const [mock, setMock] = useState<{ extract: boolean; asr: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData()
      .then(({ schemes, attributes }) => { setSchemes(schemes); setRegistry(attributes); })
      .catch((e) => setError(e.message));
    health().then((h) => setMock(h.mock)).catch(() => {});
  }, []);

  const start = schemes.length;
  const q = useMemo(
    () => (stage === "questions" && schemes.length
      ? nextQuestion(schemes, profile, registry, { minGain: MIN_GAIN, skip: skipped })
      : null),
    [stage, schemes, profile, registry, skipped]
  );

  // finish as soon as no question is worth asking, or we hit the cap
  useEffect(() => {
    if (stage === "questions" && schemes.length && (!q || asked >= MAX_QUESTIONS)) {
      setStage("results");
    }
  }, [q, asked, stage, schemes.length]);

  function mergeExtraction(fields: Profile, docType: string) {
    const clean: Profile = {};
    for (const [k, v] of Object.entries(fields)) if (k in registry && v !== null) clean[k] = v as Value;
    setProfile((p) => ({ ...p, ...clean }));
    setDocsHeld((d) => (docType && docType !== "unknown" && !d.includes(docType) ? [...d, docType] : d));
  }

  function beginQuestions() {
    setTrail([livingSet(profile, schemes).length]);
    setStage("questions");
  }

  function answer(attr: string, value: Value) {
    const next = { ...profile, [attr]: value };
    setProfile(next);
    setTrail((t) => [...t, livingSet(next, schemes).length]);
    setAsked((n) => n + 1);
  }

  function skip(attr: string) {
    setSkipped((s) => [...s, attr]);
    setAsked((n) => n + 1);
  }

  function restart() {
    setProfile({}); setDocsHeld([]); setSkipped([]); setTrail([]); setAsked(0); setStage("intro");
  }

  const eligible = useMemo(
    () => (stage === "results" ? match(profile, schemes).eligible : []),
    [stage, profile, schemes]
  );

  return (
    <div className="phone">
      <div className="top">
        <span className="brand">HAQDAAR</span>
        <div className="langs">
          {LANGS.map((l) => (
            <button key={l.code} className={"lang" + (lang === l.code ? " on" : "")}
                    onClick={() => setLang(l.code)}>{l.label}</button>
          ))}
        </div>
      </div>

      {(mock?.extract || mock?.asr) && (
        <div className="banner">
          Demo mode — {mock.extract && "document reading"}{mock.extract && mock.asr && " and "}
          {mock.asr && "speech"} is mocked. Add API keys in .env for the live version.
        </div>
      )}

      {error && <div className="body"><div className="err">{error}</div></div>}

      {!error && stage === "intro" && (
        <>
          <div className="body">
            <p className="eyebrow">हक़दार · THE RIGHTFUL CLAIMANT</p>
            <h1 style={{ fontSize: 30 }}>{tr(T.tagline, lang)}</h1>
            <p className="sub">
              Photograph the documents already in your pocket, answer a few spoken questions,
              and see every government scheme you are entitled to — with the forms filled in.
            </p>
            <div className="card">
              <b style={{ fontSize: 15 }}>{schemes.length || "…"} schemes loaded</b>
              <p className="tiny" style={{ marginTop: 6 }}>
                {Object.keys(registry).length} attributes · deterministic solver ·
                every match cites its official clause
              </p>
            </div>
            <div className="card green" style={{ marginTop: 10 }}>
              <p className="tiny" style={{ color: "var(--green-d)", fontWeight: 600, margin: 0 }}>
                {tr(T.privacy, lang)}
              </p>
            </div>
          </div>
          <div className="foot">
            <button className="btn primary" disabled={!schemes.length}
                    onClick={() => setStage("capture")}>{tr(T.start, lang)}</button>
          </div>
        </>
      )}

      {!error && stage === "capture" && (
        <Capture lang={lang} profile={profile} onMerge={mergeExtraction} onDone={beginQuestions} />
      )}

      {!error && stage === "questions" && q && (
        <Question q={q} index={asked} lang={lang} trail={trail} start={start}
                  onAnswer={answer} onSkip={skip} />
      )}

      {!error && stage === "results" && (
        <Results eligible={eligible} profile={profile} docsHeld={docsHeld}
                 lang={lang} onRestart={restart} />
      )}
    </div>
  );
}
