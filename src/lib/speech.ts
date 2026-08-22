import type { Lang } from "../engine/types";

const LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

/** Read a question aloud. Free, offline, built into the browser. */
export function say(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LOCALE[lang];
  u.rate = 0.95;
  const v = window.speechSynthesis.getVoices().find((x) => x.lang === LOCALE[lang]);
  if (v) u.voice = v;
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
