import { evaluate, ruleText } from "./evaluate";
import type { CheckedCriterion, MatchResult, Profile, Scheme, Value } from "./types";

/** Partition schemes into eligible / still-possible / ruled-out.
 *
 *  The whole trick is three-valued: an unknown attribute never disqualifies a
 *  scheme, so we can answer usefully before the profile is complete. */
export function match(profile: Profile, schemes: Scheme[]): MatchResult {
  const eligible: Scheme[] = [];
  const candidates: Scheme[] = [];
  const ruledOut: Scheme[] = [];

  for (const s of schemes) {
    const results = s.criteria.map((c) => evaluate(c, profile));
    if (results.some((r) => r === false)) ruledOut.push(s);
    else if (results.every((r) => r === true)) eligible.push(s);
    else candidates.push(s);
  }
  return { eligible, candidates, ruledOut };
}

/** Everything that is still on the table: confirmed + not yet excluded. */
export function livingSet(profile: Profile, schemes: Scheme[]): Scheme[] {
  const { eligible, candidates } = match(profile, schemes);
  return [...eligible, ...candidates];
}

/** Would this scheme survive if `attr` turned out to be `value`? */
export function compatible(s: Scheme, attr: string, value: Value, profile: Profile): boolean {
  const hypothetical: Profile = { ...profile, [attr]: value };
  return !s.criteria.some((c) => evaluate(c, hypothetical) === false);
}

/** Per-criterion audit trail for the "why you qualify" sheet. */
export function explain(s: Scheme, profile: Profile): CheckedCriterion[] {
  return s.criteria.map((c) => ({
    criterion: c,
    result: evaluate(c, profile),
    yours: Object.prototype.hasOwnProperty.call(profile, c.attr) ? profile[c.attr] : null,
    rule: ruleText(c),
  }));
}

export function annualValue(s: Scheme): number {
  return s.benefit.amount_inr_per_year ?? 0;
}

export function totalAnnualValue(schemes: Scheme[]): number {
  return schemes.reduce((t, s) => t + annualValue(s), 0);
}

/** Which required documents the citizen has already supplied. */
export function documentGap(schemes: Scheme[], held: string[]): { needed: string[]; missing: string[] } {
  const needed = [...new Set(schemes.flatMap((s) => s.documents_required))];
  const missing = needed.filter((d) => !held.includes(d));
  return { needed, missing };
}
