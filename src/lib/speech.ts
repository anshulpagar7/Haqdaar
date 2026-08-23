import type { Lang } from "../engine/types";

const LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

/** Where to look for a voice, in order, per language.
 *  Marathi is the reason this list exists: most desktops ship no mr-IN voice at
 *  all, and an utterance tagged mr-IN with no matching voice is simply silent.
 *  Hindi is the right fallback — same Devanagari script, and the vowels and
 *  consonants a Hindi voice produces are close enough to be understood. */
const CHAIN: Record<Lang, string[]> = {
  en: ["en-IN", "en-GB", "en-US", "en"],
  hi: ["hi-IN", "hi", "mr-IN", "en-IN"],
  mr: ["mr-IN", "mr", "hi-IN", "hi", "en-IN"],
};

/* No Web Speech API exposes gender, so we match on the names the platforms
 * actually ship. Female is checked first — "female" contains "male". */
const FEMALE = /female|aarohi|swara|heera|neerja|kalpana|lekha|veena|priya|ananya|isha|zira|samantha|karen|moira|tessa|shreya|google हिन्दी|google मराठी/i;
const MALE = /\bmale\b|madhur|hemant|manohar|ravi|prabhat|rishi|david|mark|george|daniel|alex|rakesh|aditya/i;

/** Chrome populates getVoices() asynchronously. Calling say() before that
 *  finishes is the other half of the silence bug. */
let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesReady) return voicesReady;
  voicesReady = new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve([]);
    const now = window.speechSynthesis.getVoices();
    if (now.length) return resolve(now);
    const done = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1500);          // Safari sometimes never fires the event
  });
  return voicesReady;
}

/** Best available voice for a language: nearest locale first, female first
 *  within that locale, and never a voice we can identify as male while a
 *  neutral one is on offer. */
function pick(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | null {
  for (const tag of CHAIN[lang]) {
    const pool = voices.filter((v) =>
      v.lang.replace("_", "-").toLowerCase().startsWith(tag.toLowerCase()));
    if (!pool.length) continue;
    return pool.find((v) => FEMALE.test(v.name))
        ?? pool.find((v) => !MALE.test(v.name))
        ?? pool[0];
  }
  return null;
}

const chosen: Partial<Record<Lang, SpeechSynthesisVoice | null>> = {};

/** Which voice will actually speak, and whether it is a stand-in from another
 *  language. The UI uses this to stay honest instead of failing silently. */
export async function voiceFor(lang: Lang): Promise<{ name: string; lang: string; substitute: boolean } | null> {
  const v = chosen[lang] ?? pick(await loadVoices(), lang);
  chosen[lang] = v;
  if (!v) return null;
  return { name: v.name, lang: v.lang, substitute: !v.lang.toLowerCase().startsWith(lang) };
}

/** Read a question aloud. Free, offline, built into the browser. */
export async function say(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voices = await loadVoices();
  window.speechSynthesis.cancel();

  const v = chosen[lang] ?? pick(voices, lang);
  chosen[lang] = v;

  const u = new SpeechSynthesisUtterance(text);
  /* Tag the utterance with the voice's own locale, not the one we wished for:
   * an mr-IN tag on a hi-IN voice makes some engines refuse to speak. */
  u.lang = v?.lang || LOCALE[lang];
  if (v) u.voice = v;
  u.rate = lang === "en" ? 0.98 : 0.92;   // Devanagari reads better a little slower
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

type SR = any;
const SRClass = (): SR =>
  (typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;

export const hasNativeSTT = () => !!SRClass();

/** Browser-native speech recognition. Instant and free where available. */
export function listenNative(lang: Lang): Promise<string> {
  return new Promise((resolve, reject) => {
    const C = SRClass();
    if (!C) return reject(new Error("no-native-stt"));
    const r = new C();
    r.lang = LOCALE[lang];
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e: any) => resolve(String(e.results[0][0].transcript || "").trim());
    r.onerror = (e: any) => reject(new Error(e.error || "stt-error"));
    r.onend = () => {};
    r.start();
  });
}

/** Fallback: record a clip and send it to the server (Groq Whisper). */
export async function recordClip(ms = 3500): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const parts: BlobPart[] = [];
  rec.ondataavailable = (e) => parts.push(e.data);
  return new Promise((resolve) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(parts, { type: rec.mimeType || "audio/webm" }));
    };
    rec.start();
    setTimeout(() => rec.stop(), ms);
  });
}

/** Map whatever the citizen said onto one of the offered answers. */
export function interpret(
  said: string,
  options: { value: any; spoken: string[] }[]
): any | undefined {
  const s = said.toLowerCase().replace(/[।.?!,]/g, " ").trim();
  if (!s) return undefined;
  for (const o of options) {
    for (const alias of o.spoken) {
      const a = alias.toLowerCase();
      if (s === a || s.includes(a)) return o.value;
    }
  }
  const n = s.match(/\d+/);
  if (n) return Number(n[0]);
  return undefined;
}

/** Common yes/no words across Marathi, Hindi and English. */
export const YES_WORDS = ["होय", "हो", "हाँ", "हां", "haan", "ho", "yes", "yeah", "ha"];
export const NO_WORDS = ["नाही", "नहीं", "नही", "nahi", "nahin", "no", "nope"];
