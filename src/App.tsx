import { useEffect, useMemo, useRef, useState } from "react";
import Capture from "./components/Capture";
import ClauseSheet from "./components/ClauseSheet";
import Counter from "./components/Counter";
import Icon from "./components/Icon";
import LiveList from "./components/LiveList";
import Question from "./components/Question";
import Results from "./components/Results";
import SchemeField from "./components/SchemeField";
import { livingSet, match, nextQuestion } from "./engine";
import { health, loadData } from "./lib/api";
import { LANGS, T, tr } from "./i18n";
import type { Lang, Profile, Registry, Scheme, Value } from "./engine/types";

type Stage = "intro" | "capture" | "questions" | "results";
type Mode = "desktop" | "mobile";

const MIN_GAIN = 1;
const MAX_QUESTIONS = 6;

export default function App() {
  const [lang, setLang] = useState<Lang>("en");          // English by default
  const [mode, setMode] = useState<Mode>(() =>
    typeof window !== "undefined" && window.innerWidth >= 1024 ? "desktop" : "mobile");
  const [stage, setStage] = useState<Stage>("intro");
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [registry, setRegistry] = useState<Registry>({});
  const [profile, setProfile] = useState<Profile>({});
  const [conf, setConf] = useState<Record<string, number>>({});
  const [docsHeld, setDocsHeld] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [trail, setTrail] = useState<number[]>([]);
  const [asked, setAsked] = useState(0);
  const [mock, setMock] = useState<{ extract: boolean; asr: boolean } | null>(null);
  const [open, setOpen] = useState<Scheme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const centre = useRef<HTMLDivElement>(null);

  // clicking an answer scrolls it into view; bring the column back to the top
  // so the field and the counter are always the first thing seen
  useEffect(() => { centre.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [asked, stage]);

  useEffect(() => {
    loadData()
      .then(({ schemes, attributes }) => { setSchemes(schemes); setRegistry(attributes); })
      .catch((e) => setError(e.message));
    health().then((h) => setMock(h.mock)).catch(() => {});
  }, []);

  const total = schemes.length;
  const { eligible, candidates } = useMemo(
    () => (schemes.length ? match(profile, schemes) : { eligible: [], candidates: [], ruledOut: [] }),
    [profile, schemes]
  );
  const living = eligible.length + candidates.length;

  const q = useMemo(
    () => (stage === "questions" && schemes.length
      ? nextQuestion(schemes, profile, registry, { minGain: MIN_GAIN, skip: skipped })
      : null),
    [stage, schemes, profile, registry, skipped]
  );

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
    setProfile({}); setConf({}); setDocsHeld([]); setSkipped([]);
    setTrail([]); setAsked(0); setStage("intro"); setOpen(null);
  }

  /* ── shared panels ─────────────────────────────────────────── */
  const Intro = (
    <section className="glass card">
      <p className="eyebrow">हक़दार &nbsp;·&nbsp; the rightful claimant</p>
      <h1>{lang === "en" ? "Don't search for schemes. Let the schemes find you." : tr(T.tagline, lang)}</h1>
      <p className="sub" style={{ marginBottom: 18 }}>{tr(T.heroLead, lang)}</p>
      <div className="glass card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--mari)" }}><Icon name="layers" size={22} /></span>
          <div>
            <b className="num" style={{ fontSize: 20 }}>{total || "…"}</b>{" "}
            <span style={{ fontWeight: 600 }}>{tr(T.schemesLoaded, lang)}</span>
            <p className="tiny" style={{ margin: "2px 0 0" }}>
              {Object.keys(registry).length} {tr(T.attributes, lang)} · {tr(T.engineNote, lang)}
            </p>
          </div>
        </div>
      </div>
      <div className="dock" style={{ marginTop: 16 }}>
        <button className="btn btn-primary btn-block" disabled={!total} onClick={() => setStage("capture")}>
          <Icon name="arrow" size={16} />{tr(T.begin, lang)}
        </button>
      </div>
    </section>
  );

  const Ask = stage === "questions" && q
    ? <Question q={q} index={asked} lang={lang} onAnswer={answer} onSkip={skip} />
    : null;

  const Viz = (
    <SchemeField total={total} living={stage === "intro" ? total : living}
                 eligible={stage === "intro" ? 0 : eligible.length}
                 height={mode === "desktop" ? 360 : 230} />
  );

  /* ── chrome ────────────────────────────────────────────────── */
  const header = (
    <header className="hdr">
      <div className="logo"><span className="mark">ह</span>HAQDAAR</div>
      <div className="hdr-tools">
        <div className="seg" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l.code} aria-pressed={lang === l.code} onClick={() => setLang(l.code)}>
              {l.code === "en" && <Icon name="globe" size={13} />}{l.label}
            </button>
          ))}
        </div>
        <div className="seg seg-compact" role="group" aria-label="Layout">
          <button aria-pressed={mode === "desktop"} aria-label={tr(T.desktop, lang)}
                  onClick={() => setMode("desktop")}>
            <Icon name="monitor" size={14} /><span>{tr(T.desktop, lang)}</span>
          </button>
          <button aria-pressed={mode === "mobile"} aria-label={tr(T.mobile, lang)}
                  onClick={() => setMode("mobile")}>
            <Icon name="phone" size={14} /><span>{tr(T.mobile, lang)}</span>
          </button>
        </div>
      </div>
    </header>
  );

  const banner = (mock?.extract || mock?.asr) ? (
    <div className="notice">
      Demo mode — {mock.extract && "document reading"}{mock.extract && mock.asr && " and "}
      {mock.asr && "speech"} is mocked. Add API keys in .env for the live version.
    </div>
  ) : null;

  return (
    <div className="app" data-mode={mode}>
      <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
      {header}
      {banner}

      {error && <div className="shell"><div className="pane"><div className="err">{error}</div></div></div>}

      {!error && mode === "desktop" && (
        <main className="shell">
          <div className="cockpit">
            <div className="col">
              <Capture lang={lang} profile={profile} conf={conf} onMerge={mergeExtraction} />
              {stage === "capture" && (
                <button className="btn btn-primary btn-block" onClick={beginQuestions}>
                  <Icon name="arrow" size={16} />
                  {Object.keys(profile).length ? tr(T.continue, lang) : tr(T.skip, lang)}
                </button>
              )}
            </div>

            <div className="col" ref={centre}>
              {Viz}
              {stage !== "intro" && <Counter trail={trail.length ? trail : [total]} lang={lang} start={total} />}
              {stage === "intro" && Intro}
              {stage === "capture" && (
                <section className="glass card">
                  <p className="eyebrow">{tr(T.step1, lang)}</p>
                  <h2>{tr(T.holdCard, lang)}</h2>
                  <p className="sub" style={{ margin: 0 }}>{tr(T.privacy, lang)}</p>
                </section>
              )}
              {Ask}
              {stage === "results" && (
                <Results eligible={eligible} profile={profile} docsHeld={docsHeld}
                         lang={lang} onOpen={setOpen} onRestart={restart} />
              )}
            </div>

            <div className="col col-scroll">
              <LiveList eligible={eligible} candidates={stage === "intro" ? [] : candidates}
                        lang={lang} onOpen={setOpen} docsHeld={docsHeld} />
            </div>
          </div>
        </main>
      )}

      {!error && mode === "mobile" && (
        <main className="shell">
          <div className="pane">
            {stage === "intro" && <>{Viz}<div style={{ height: 14 }} />{Intro}</>}
            {stage === "capture" && (
              <>
                <Capture lang={lang} profile={profile} conf={conf} onMerge={mergeExtraction} />
                <div className="dock">
                  <button className="btn btn-primary btn-block" onClick={beginQuestions}>
                    <Icon name="arrow" size={16} />
                    {Object.keys(profile).length ? tr(T.continue, lang) : tr(T.skip, lang)}
                  </button>
                </div>
              </>
            )}
            {stage === "questions" && q && (
              <>
                {Viz}
                <div style={{ height: 12 }} />
                <Counter trail={trail} lang={lang} start={total} />
                <div style={{ height: 12 }} />
                {Ask}
              </>
            )}
            {stage === "results" && (
              <>
                {Viz}
                <div style={{ height: 12 }} />
                <Results eligible={eligible} profile={profile} docsHeld={docsHeld}
                         lang={lang} onOpen={setOpen} onRestart={restart} />
              </>
            )}
          </div>
        </main>
      )}

      {open && <ClauseSheet scheme={open} profile={profile} lang={lang} onClose={() => setOpen(null)} />}
    </div>
  );
}
