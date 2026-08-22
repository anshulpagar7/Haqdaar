import { useEffect, useMemo, useRef, useState } from "react";
import Capture from "./components/Capture";
import Counter from "./components/Counter";
import Documents from "./components/Documents";
import Icon from "./components/Icon";
import ScrollStory from "./components/ScrollStory";
import LiveList from "./components/LiveList";
import Question from "./components/Question";
import Results from "./components/Results";
import SchemeField from "./components/SchemeField";
import ClauseSheet from "./components/ClauseSheet";
import { livingSet, match, nextQuestion } from "./engine";
import { health, loadData, type Persona } from "./lib/api";
import { LANGS, T, tr } from "./i18n";
import type { Lang, Profile, Registry, Scheme, Value } from "./engine/types";

type Stage = "landing" | "documents" | "questions" | "results";
type Mode = "desktop" | "mobile";

const MIN_GAIN = 1;
const MAX_QUESTIONS = 6;

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [mode, setMode] = useState<Mode>(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024 ? "desktop" : "mobile");
  const [stage, setStage] = useState<Stage>("landing");
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [registry, setRegistry] = useState<Registry>({});
  const [profile, setProfile] = useState<Profile>({});
  const [conf, setConf] = useState<Record<string, number>>({});
  const [docsHeld, setDocsHeld] = useState<string[]>([]);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [trail, setTrail] = useState<number[]>([]);
  const [asked, setAsked] = useState(0);
  const [mock, setMock] = useState<{ extract: boolean; asr: boolean } | null>(null);
  const [sheet, setSheet] = useState<Scheme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const centre = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData().then(({ schemes, attributes }) => { setSchemes(schemes); setRegistry(attributes); })
      .catch((e) => setError(e.message));
    health().then((h) => setMock(h.mock)).catch(() => {});
  }, []);

  useEffect(() => { centre.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [asked, stage]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [stage]);

  const total = schemes.length;
  const { eligible, candidates } = useMemo(
    () => (schemes.length ? match(profile, schemes) : { eligible: [], candidates: [], ruledOut: [] }),
    [profile, schemes]);
  const living = eligible.length + candidates.length;

  const q = useMemo(() => (stage === "questions" && schemes.length
    ? nextQuestion(schemes, profile, registry, { minGain: MIN_GAIN, skip: skipped }) : null),
    [stage, schemes, profile, registry, skipped]);

  useEffect(() => {
    if (stage === "questions" && schemes.length && (!q || asked >= MAX_QUESTIONS)) setStage("results");
  }, [q, asked, stage, schemes.length]);

  function mergeExtraction(fields: Profile, docType: string, c: Record<string, number>) {
    const clean: Profile = {};
    for (const [k, v] of Object.entries(fields)) if (k in registry && v !== null) clean[k] = v as Value;
    setProfile((p) => ({ ...p, ...clean }));
    setConf((p) => ({ ...p, ...c }));
    setDocsHeld((d) => (docType && docType !== "unknown" && !d.includes(docType) ? [...d, docType] : d));
  }
  function beginQuestions() { setTrail([livingSet(profile, schemes).length]); setStage("questions"); }
  function answer(attr: string, value: Value) {
    const next = { ...profile, [attr]: value };
    setProfile(next);
    setTrail((t) => [...t, livingSet(next, schemes).length]);
    setAsked((n) => n + 1);
  }
  function skip(attr: string) { setSkipped((s) => [...s, attr]); setAsked((n) => n + 1); }
  function restart() {
    setProfile({}); setConf({}); setDocsHeld([]); setSkipped([]); setPersona(null);
    setTrail([]); setAsked(0); setSheet(null); setStage("landing");
  }

  const Viz = (
    <SchemeField total={total} living={stage === "landing" ? total : living}
                 eligible={stage === "landing" ? 0 : eligible.length}
                 height={mode === "desktop" ? 340 : 220} />
  );

  const header = (
    <header className="hdr">
      <button className="logo" onClick={restart} style={{ background: "none", border: 0, cursor: "pointer", color: "inherit", padding: 0 }}>
        <span className="mark">ह</span>HAQDAAR
      </button>
      <div className="hdr-tools">
        {stage !== "landing" ? null : (
          <button className="btn btn-primary btn-sm" onClick={() => setStage("documents")}>
            <Icon name="arrow" size={14} />Apply now
          </button>
        )}
        <div className="seg" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l.code} aria-pressed={lang === l.code} onClick={() => setLang(l.code)}>
              {l.code === "en" && <Icon name="globe" size={13} />}{l.label}
            </button>
          ))}
        </div>
        <div className="seg seg-compact" role="group" aria-label="Layout">
          <button aria-pressed={mode === "desktop"} aria-label={tr(T.desktop, lang)} onClick={() => setMode("desktop")}>
            <Icon name="monitor" size={14} /><span>{tr(T.desktop, lang)}</span>
          </button>
          <button aria-pressed={mode === "mobile"} aria-label={tr(T.mobile, lang)} onClick={() => setMode("mobile")}>
            <Icon name="phone" size={14} /><span>{tr(T.mobile, lang)}</span>
          </button>
        </div>
      </div>
    </header>
  );

  const banner = (mock?.extract || mock?.asr) ? (
    <div className="notice">
      Demo mode — {mock.extract && "document reading"}{mock.extract && mock.asr && " and "}
      {mock.asr && "speech"} is mocked. Specimen documents still work exactly as shown.
    </div>
  ) : null;

  const docsPage = (
    <Documents lang={lang} profile={profile} conf={conf} chosen={persona}
               onMerge={mergeExtraction} onChoose={setPersona} onNext={beginQuestions} />
  );
  const resultsPage = (
    <Results eligible={eligible} profile={profile} docsHeld={docsHeld}
             lang={lang} asked={asked} onRestart={restart} />
  );

  const wide = stage === "documents" || stage === "results";

  return (
    <div className="app" data-mode={mode}>
      {header}
      {banner}
      {error && <div className="shell"><div className="pane"><div className="err">{error}</div></div></div>}

      {!error && stage === "landing" && (
        <main>
          <ScrollStory total={total} attrs={Object.keys(registry).length}
                       onStart={() => setStage("documents")} />
          <div className="applybar">
            <button className="btn btn-primary btn-lg" onClick={() => setStage("documents")}>
              <Icon name="arrow" size={17} />Apply now
            </button>
          </div>
        </main>
      )}

      {!error && stage !== "landing" && mode === "desktop" && (
        <main className="shell">
          {wide ? (
            <div className="wide">
              {stage === "documents" && docsPage}
              {stage === "results" && resultsPage}
            </div>
          ) : (
            <div className="cockpit">
              <div className="col">
                <Capture lang={lang} profile={profile} conf={conf} onMerge={mergeExtraction} compact />
              </div>
              <div className="col" ref={centre}>
                {Viz}
                <Counter trail={trail.length ? trail : [total]} lang={lang} start={total} />
                {q && <Question q={q} index={asked} lang={lang} onAnswer={answer} onSkip={skip} />}
              </div>
              <div className="col">
                <LiveList eligible={eligible} candidates={candidates} lang={lang}
                          onOpen={setSheet} docsHeld={docsHeld} />
              </div>
            </div>
          )}
        </main>
      )}

      {!error && stage !== "landing" && mode === "mobile" && (
        <main className="shell">
          <div className="pane">
            {stage === "documents" && docsPage}
            {stage === "questions" && q && (
              <>
                {Viz}<div style={{ height: 12 }} />
                <Counter trail={trail} lang={lang} start={total} /><div style={{ height: 12 }} />
                <Question q={q} index={asked} lang={lang} onAnswer={answer} onSkip={skip} />
              </>
            )}
            {stage === "results" && resultsPage}
          </div>
        </main>
      )}

      {sheet && <ClauseSheet scheme={sheet} profile={profile} lang={lang} onClose={() => setSheet(null)} />}
    </div>
  );
}
