import { useEffect, useMemo, useRef, useState } from "react";
import Counter from "./components/Counter";
import Documents from "./components/Documents";
import Icon from "./components/Icon";
import Logo from "./components/Logo";
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
  const hdr = useRef<HTMLElement>(null);

  /* The header floats over the story rather than pushing it down, so the scene
   * runs to the very top of the window. Its height changes when the toolbar
   * wraps on a narrow screen, so it is measured rather than guessed. */
  useEffect(() => {
    const el = hdr.current;
    if (!el) return;
    const set = () =>
      document.documentElement.style.setProperty("--hdr-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    loadData().then(({ schemes, attributes }) => { setSchemes(schemes); setRegistry(attributes); })
      .catch((e) => setError(e.message));
    health().then((h) => setMock(h.mock)).catch(() => {});
  }, []);

  /* Each new question starts at the top of the page, not wherever the last
   * answer button happened to leave the scroll position. */
  useEffect(() => {
    centre.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [asked, stage]);

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

  const Viz = (h: number) => (
    <SchemeField total={total} living={stage === "landing" ? total : living}
                 eligible={stage === "landing" ? 0 : eligible.length} height={h} />
  );

  const header = (
    <header className="hdr" ref={hdr}>
      <button className="logo" onClick={restart} style={{ background: "none", border: 0, cursor: "pointer", color: "inherit", padding: 0 }}>
        <Logo size={30} />HAQDAAR
      </button>
      {stage !== "landing" ? null : (
        /* A direct child of the header, not of the tool cluster: on a phone the
           header becomes a two-row grid and this needs to sit beside the logo
           rather than wrap below with the toggles. */
        <button className="hdr-cta btn btn-primary btn-sm" onClick={() => setStage("documents")}>
          <Icon name="arrow" size={14} />Apply now
        </button>
      )}
      <div className="hdr-tools">
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

  /* No global banner: it pushed the scene down the page and shouted at every
     visitor about a detail that only matters where documents are read. The
     same fact now sits inside the documents step, where it is actually true. */
  const docsPage = (
    <Documents lang={lang} profile={profile} conf={conf} chosen={persona} mock={mock}
               onMerge={mergeExtraction} onChoose={setPersona} onNext={beginQuestions} />
  );
  const resultsPage = (
    <Results eligible={eligible} profile={profile} docsHeld={docsHeld}
             lang={lang} asked={asked} onRestart={restart} />
  );

  const wide = stage === "documents" || stage === "results";

  return (
    <div className="app" data-mode={mode} data-stage={stage}>
      {header}
      {error &&<div className="shell"><div className="pane"><div className="err">{error}</div></div></div>}

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
            /* Left: the question, and nothing above it. Right: everything the
               answer is changing — the field, the count, the surviving list. */
            <div className="cockpit">
              <div className="col" ref={centre}>
                {q && <Question q={q} index={asked} lang={lang} onAnswer={answer} onSkip={skip} />}
              </div>
              <div className="col">
                {Viz(150)}
                <Counter trail={trail.length ? trail : [total]} lang={lang} start={total} />
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
              /* On a phone the question comes first — the visual proof of
                 narrowing sits under it, one thumb-scroll away. */
              <>
                <Question q={q} index={asked} lang={lang} onAnswer={answer} onSkip={skip} />
                <div style={{ height: 12 }} />
                <Counter trail={trail} lang={lang} start={total} /><div style={{ height: 12 }} />
                {Viz(180)}
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
