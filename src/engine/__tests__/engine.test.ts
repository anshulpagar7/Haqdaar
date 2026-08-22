import { describe, expect, it } from "vitest";
import {
  compatible, documentGap, evaluate, explain, livingSet, match,
  nextQuestion, simulate, totalAnnualValue,
} from "../index";
import type { Profile, Registry, Scheme } from "../types";

const S = (id: string, criteria: Scheme["criteria"], amount = 1000): Scheme => ({
  id,
  name: { en: id, hi: id, mr: id },
  authority: "Test",
  level: "state",
  benefit: { type: "cash", amount_inr_per_year: amount },
  criteria,
  documents_required: ["aadhaar"],
  apply: { mode: "online" },
  clause_text: "test clause",
});

describe("evaluate — three-valued logic", () => {
  it("returns null for an unknown attribute rather than false", () => {
    expect(evaluate({ attr: "age", op: "lt", value: 30 }, {})).toBeNull();
  });
  it("handles every operator", () => {
    const p: Profile = { age: 25, state: "MH", student: true, income: 200000 };
    expect(evaluate({ attr: "age", op: "lt", value: 30 }, p)).toBe(true);
    expect(evaluate({ attr: "age", op: "gte", value: 60 }, p)).toBe(false);
    expect(evaluate({ attr: "age", op: "between", value: [18, 30] }, p)).toBe(true);
    expect(evaluate({ attr: "state", op: "in", value: ["MH", "GJ"] }, p)).toBe(true);
    expect(evaluate({ attr: "state", op: "neq", value: "MH" }, p)).toBe(false);
    expect(evaluate({ attr: "student", op: "eq", value: true }, p)).toBe(true);
    expect(evaluate({ attr: "income", op: "lte", value: 200000 }, p)).toBe(true);
    expect(evaluate({ attr: "income", op: "gt", value: 200000 }, p)).toBe(false);
    expect(evaluate({ attr: "student", op: "exists" }, p)).toBe(true);
  });
});

describe("match — partitioning", () => {
  const schemes = [
    S("A", [{ attr: "state", op: "eq", value: "MH" }]),
    S("B", [{ attr: "state", op: "eq", value: "GJ" }]),
    S("C", [{ attr: "state", op: "eq", value: "MH" }, { attr: "age", op: "gte", value: 60 }]),
  ];

  it("keeps a scheme alive while an attribute is unknown", () => {
    const r = match({ state: "MH" }, schemes);
    expect(r.eligible.map((s) => s.id)).toEqual(["A"]);
    expect(r.candidates.map((s) => s.id)).toEqual(["C"]);
    expect(r.ruledOut.map((s) => s.id)).toEqual(["B"]);
  });

  it("only excludes on a definite contradiction", () => {
    const r = match({ state: "MH", age: 30 }, schemes);
    expect(r.eligible.map((s) => s.id)).toEqual(["A"]);
    expect(r.candidates).toHaveLength(0);
    expect(r.ruledOut.map((s) => s.id)).toEqual(["B", "C"]);
  });

  it("returns everything as a candidate for an empty profile", () => {
    expect(livingSet({}, schemes)).toHaveLength(3);
  });

  it("compatible() answers the hypothetical", () => {
    expect(compatible(schemes[2], "age", 65, { state: "MH" })).toBe(true);
    expect(compatible(schemes[2], "age", 20, { state: "MH" })).toBe(false);
  });
});

const registry: Registry = {
  state: {
    type: "enum", values: ["MH", "GJ", "KA", "RJ"], ask_cost: 1,
    question: { en: "Which state?", hi: "कौन सा राज्य?", mr: "कोणते राज्य?" },
  },
  age: {
    type: "number", bands: [[0, 17], [18, 35], [36, 59], [60, 100]], ask_cost: 1,
    question: { en: "Age?", hi: "उम्र?", mr: "वय?" },
  },
  income: {
    type: "number", bands: [[0, 100000], [100001, 250000], [250001, 800000]], ask_cost: 3,
    question: { en: "Income?", hi: "आय?", mr: "उत्पन्न?" },
  },
};

describe("nextQuestion — information gain", () => {
  it("picks the attribute that eliminates the most schemes", () => {
    const schemes = [
      ...Array.from({ length: 8 }, (_, i) => S(`mh${i}`, [{ attr: "state", op: "eq", value: "MH" }])),
      ...Array.from({ length: 8 }, (_, i) => S(`gj${i}`, [{ attr: "state", op: "eq", value: "GJ" }])),
      S("old", [{ attr: "age", op: "gte", value: 60 }]),
    ];
    const q = nextQuestion(schemes, {}, registry);
    expect(q?.attr).toBe("state");
    expect(q!.expectedRemaining).toBeLessThan(q!.candidatesNow);
  });

  it("never asks a question that cannot eliminate anything", () => {
    const schemes = [S("A", [{ attr: "state", op: "eq", value: "MH" }])];
    const q = nextQuestion(schemes, { state: "MH" }, registry);
    expect(q).toBeNull();
  });

  it("never re-asks something already known", () => {
    const schemes = [S("A", [{ attr: "state", op: "eq", value: "MH" }, { attr: "age", op: "gte", value: 60 }])];
    const q = nextQuestion(schemes, { state: "MH" }, registry);
    expect(q?.attr).toBe("age");
  });

  it("prefers the cheaper question when gain is comparable", () => {
    // both split the set in half, but income costs 3 and age costs 1
    const schemes = [
      ...Array.from({ length: 6 }, (_, i) => S(`a${i}`, [{ attr: "age", op: "gte", value: 60 }])),
      ...Array.from({ length: 6 }, (_, i) => S(`b${i}`, [{ attr: "income", op: "lt", value: 100000 }])),
    ];
    expect(nextQuestion(schemes, {}, registry)?.attr).toBe("age");
  });

  it("converges monotonically and terminates", () => {
    const schemes = [
      S("A", [{ attr: "state", op: "eq", value: "MH" }, { attr: "age", op: "gte", value: 60 }]),
      S("B", [{ attr: "state", op: "eq", value: "GJ" }]),
      S("C", [{ attr: "income", op: "lt", value: 250000 }]),
      S("D", [{ attr: "state", op: "eq", value: "MH" }, { attr: "income", op: "lt", value: 100000 }]),
    ];
    const truth: Profile = { state: "MH", age: 70, income: 90000 };
    const { trail, asked } = simulate(schemes, truth, registry);
    expect(asked.length).toBeGreaterThan(0);
    for (let i = 1; i < trail.length; i++) expect(trail[i]).toBeLessThanOrEqual(trail[i - 1]);
    expect(trail.at(-1)).toBe(match(truth, schemes).eligible.length);
  });
});

describe("reporting helpers", () => {
  it("explains every criterion with the citizen's own value", () => {
    const s = S("A", [{ attr: "age", op: "between", value: [18, 30] }]);
    const rows = explain(s, { age: 25 });
    expect(rows[0].result).toBe(true);
    expect(rows[0].yours).toBe(25);
    expect(rows[0].rule).toContain("18");
  });

  it("totals the annual value and finds the document gap", () => {
    const list = [S("A", [], 12000), S("B", [], 18000)];
    expect(totalAnnualValue(list)).toBe(30000);
    const gap = documentGap(list, []);
    expect(gap.missing).toContain("aadhaar");
    expect(documentGap(list, ["aadhaar"]).missing).toHaveLength(0);
  });
});
