import { compatible, livingSet } from "./match";
import type { AttributeDef, NextQuestion, Profile, Registry, Scheme, Value } from "./types";

/** The candidate answers for an attribute, with a prior on each.
 *  Numbers are represented by the midpoint of each band. */
export function domain(attr: string, def: AttributeDef): { value: Value; prior: number }[] {
  let values: Value[];
  if (def.type === "boolean") values = [true, false];
  else if (def.type === "enum") values = def.values ?? [];
  else values = (def.bands ?? []).map(([lo, hi]) => Math.round((lo + hi) / 2));

  if (values.length === 0) return [];

  const raw = values.map((v) => def.priors?.[String(v)] ?? 1);
  const sum = raw.reduce((a, b) => a + b, 0);
  return values.map((v, i) => ({ value: v, prior: raw[i] / sum }));
}

/** Which attributes are actually worth asking about: unknown, in the registry,
 *  and mentioned by at least one scheme still in play. */
export function askableAttributes(
  candidates: Scheme[],
  profile: Profile,
  registry: Registry
): string[] {
  const mentioned = new Set(candidates.flatMap((s) => s.criteria.map((c) => c.attr)));
  return Object.keys(registry).filter(
    (a) => mentioned.has(a) && !Object.prototype.hasOwnProperty.call(profile, a)
  );
}

/**
 * Greedy information-gain question selection.
 *
 *   score(a) = ( |C| − E[ |C| after asking a ] ) / ask_cost(a)
 *
 * We pick the single unknown attribute whose answer is expected to eliminate the
 * most remaining schemes, discounted by how much effort the question costs the
 * citizen. Uniform priors are the honest default; Census/NSSO distributions are
 * the obvious upgrade and would converge in fewer questions.
 */
export interface SelectOptions {
  /** Stop asking once the best remaining question is expected to eliminate
   *  fewer than this many schemes. Prevents a long tail of low-value questions. */
  minGain?: number;
  /** Attributes we already read off a document, or deliberately never ask. */
  skip?: string[];
}

export function nextQuestion(
  schemes: Scheme[],
  profile: Profile,
  registry: Registry,
  opts: SelectOptions = {}
): NextQuestion | null {
  const minGain = opts.minGain ?? 0.5;
  const skip = new Set(opts.skip ?? []);
  const living = livingSet(profile, schemes);
  const candidatesNow = living.length;
  if (candidatesNow === 0) return null;

  let best: NextQuestion | null = null;

  for (const attr of askableAttributes(living, profile, registry)) {
    if (skip.has(attr)) continue;
    const def = registry[attr];
    const dom = domain(attr, def);
    if (dom.length === 0) continue;

    let expectedRemaining = 0;
    for (const { value, prior } of dom) {
      const survivors = living.filter((s) => compatible(s, attr, value, profile)).length;
      expectedRemaining += prior * survivors;
    }

    const gain = candidatesNow - expectedRemaining;
    // Never ask a question that tells us nothing, or whose expected payoff is
    // smaller than the patience it costs. This is the stopping rule.
    if (gain < minGain) continue;

    const score = gain / Math.max(1, def.ask_cost);
    if (!best || score > best.score) {
      best = { attr, def, candidatesNow, expectedRemaining, gain, score };
    }
  }
  return best;
}

/** Run the selector to exhaustion against a known ground-truth profile.
 *  Used by the tests and by the benchmark script. */
export function simulate(
  schemes: Scheme[],
  truth: Profile,
  registry: Registry,
  maxQuestions = 20,
  opts: SelectOptions & { seed?: Profile } = {}
): { asked: string[]; trail: number[]; profile: Profile } {
  const profile: Profile = { ...(opts.seed ?? {}) };
  const trail: number[] = [livingSet(profile, schemes).length];
  const asked: string[] = [];

  for (let i = 0; i < maxQuestions; i++) {
    const q = nextQuestion(schemes, profile, registry, opts);
    if (!q) break;
    if (!Object.prototype.hasOwnProperty.call(truth, q.attr)) break;
    profile[q.attr] = truth[q.attr];
    asked.push(q.attr);
    trail.push(livingSet(profile, schemes).length);
  }
  return { asked, trail, profile };
}

/** Baseline for the pitch chart: ask the same attributes in a fixed order. */
export function simulateFixedOrder(
  schemes: Scheme[],
  truth: Profile,
  order: string[]
): number[] {
  const profile: Profile = {};
  const trail = [livingSet(profile, schemes).length];
  for (const attr of order) {
    if (!Object.prototype.hasOwnProperty.call(truth, attr)) continue;
    profile[attr] = truth[attr];
    trail.push(livingSet(profile, schemes).length);
  }
  return trail;
}
