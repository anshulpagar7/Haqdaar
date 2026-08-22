import type { Criterion, Profile, Tri, Value } from "./types";

const num = (v: unknown): number => Number(v);

/** Evaluate one criterion against a (possibly partial) profile.
 *  Returns true / false / null, where null means "we don't know yet". */
export function evaluate(c: Criterion, profile: Profile): Tri {
  const has = Object.prototype.hasOwnProperty.call(profile, c.attr);
  const v = profile[c.attr];

  if (c.op === "exists") return has && v !== null && v !== "" ? true : has ? false : null;
  if (!has || v === undefined || v === null) return null;

  switch (c.op) {
    case "eq":  return v === c.value;
    case "neq": return v !== c.value;
    case "lt":  return num(v) <  num(c.value);
    case "lte": return num(v) <= num(c.value);
    case "gt":  return num(v) >  num(c.value);
    case "gte": return num(v) >= num(c.value);
    case "between": {
      const [lo, hi] = c.value as [number, number];
      return num(v) >= num(lo) && num(v) <= num(hi);
    }
    case "in": return (c.value as Value[]).includes(v);
    default:   return null;
  }
}

/** Human-readable form of a rule, for the "why you qualify" screen. */
export function ruleText(c: Criterion): string {
  switch (c.op) {
    case "exists":  return "must be provided";
    case "eq":      return `= ${c.value}`;
    case "neq":     return `≠ ${c.value}`;
    case "lt":      return `< ${fmt(c.value)}`;
    case "lte":     return `≤ ${fmt(c.value)}`;
    case "gt":      return `> ${fmt(c.value)}`;
    case "gte":     return `≥ ${fmt(c.value)}`;
    case "between": {
      const [lo, hi] = c.value as [number, number];
      return `${fmt(lo)} – ${fmt(hi)}`;
    }
    case "in":      return `one of ${(c.value as Value[]).join(", ")}`;
    default:        return "";
  }
}

function fmt(v: unknown): string {
  if (typeof v === "number" && v >= 1000) return v.toLocaleString("en-IN");
  return String(v);
}
