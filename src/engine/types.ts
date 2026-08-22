/** Core types for the Haqdaar eligibility engine.
 *  This module is PURE: no network, no database, no model calls. */

export type Lang = "en" | "hi" | "mr";
export type Value = string | number | boolean;
export type Profile = Record<string, Value>;

/** Three-valued logic. `null` means "unknown", which is NOT the same as false. */
export type Tri = true | false | null;

export type Op =
  | "eq" | "neq" | "lt" | "lte" | "gt" | "gte"
  | "between" | "in" | "exists";

export interface Criterion {
  attr: string;
  op: Op;
  /** number | string | boolean for scalar ops, [min,max] for between, array for in.
   *  Omitted for `exists`. */
  value?: Value | Value[];
}

export interface Benefit {
  type: "cash" | "insurance" | "subsidy" | "asset" | "service";
  amount_inr_per_year?: number;
  one_time_inr?: number;
  note?: string;
}

export interface Scheme {
  id: string;
  name: Record<Lang, string>;
  authority: string;
  level: "central" | "state";
  state?: string;
  benefit: Benefit;
  criteria: Criterion[];
  documents_required: string[];
  apply: { mode: "online" | "offline" | "both"; url?: string; office?: string };
  deadline?: string;
  /** Verbatim eligibility sentence from the official notification. Displayed to the
   *  citizen and to any officer verifying the result. Never paraphrase it. */
  clause_text: string;
  source_url?: string;
  last_verified?: string;
  /** false until a human has checked clause_text against the source notification. */
  verified?: boolean;
}

export type AttrType = "boolean" | "number" | "enum";

export interface AttributeDef {
  type: AttrType;
  /** enum only */
  values?: Value[];
  /** number only — inclusive-exclusive bands used to build the question domain */
  bands?: [number, number][];
  /** 1 = trivially easy to answer, 5 = hard or intrusive */
  ask_cost: number;
  question: Record<Lang, string>;
  /** answer labels for enum/boolean, keyed by the value */
  labels?: Record<string, Record<Lang, string>>;
  /** document types this attribute can be read from, so we never ask for it twice */
  derivable_from?: string[];
  /** optional non-uniform priors, keyed by String(value); missing entries default */
  priors?: Record<string, number>;
}

export type Registry = Record<string, AttributeDef>;

export interface MatchResult {
  eligible: Scheme[];
  candidates: Scheme[];
  ruledOut: Scheme[];
}

export interface NextQuestion {
  attr: string;
  def: AttributeDef;
  /** candidates now, and how many we expect to remain after this answer */
  candidatesNow: number;
  expectedRemaining: number;
  gain: number;
  score: number;
}

export interface CheckedCriterion {
  criterion: Criterion;
  result: Tri;
  yours: Value | null;
  rule: string;
}
