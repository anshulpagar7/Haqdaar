/** Prove the selector works on the real seed data.
 *  Run:  npx tsx scripts/benchmark.ts        */
import { readFileSync } from "node:fs";
import { livingSet, match, nextQuestion, simulate, simulateFixedOrder } from "../src/engine";
import type { Profile, Registry, Scheme } from "../src/engine/types";

const schemes: Scheme[] = JSON.parse(readFileSync("data/schemes.json", "utf8"));
const registry: Registry = JSON.parse(readFileSync("data/attributes.json", "utf8"));

const personas: Record<string, Profile> = {
  "Nashik farmer household": {
    state: "MH", residence: "rural", age: 47, gender: "male", annual_income_inr: 145000,
    category: "ST", ration_card_type: "PHH", occupation: "farmer", is_student: true,
    education_level: "secondary", owns_agri_land: true, landholding_ha: 1.4,
    has_disability_cert: false, is_widow: false, owns_pucca_house: false,
    has_bank_account: true, has_lpg_connection: false, works_unorganised: true, household_size: 5,
  },
  "Pune student, open category": {
    state: "MH", residence: "urban", age: 19, gender: "female", annual_income_inr: 620000,
    category: "GENERAL", ration_card_type: "NPHH", occupation: "student", is_student: true,
    education_level: "graduate", owns_agri_land: false, has_disability_cert: false,
    is_widow: false, owns_pucca_house: true, has_bank_account: true,
    has_lpg_connection: true, works_unorganised: false, household_size: 4,
  },
  "Widowed elder, Latur": {
    state: "MH", residence: "rural", age: 68, gender: "female", annual_income_inr: 18000,
    category: "OBC", ration_card_type: "AAY", occupation: "homemaker", is_student: false,
    education_level: "primary", owns_agri_land: false, has_disability_cert: false,
    is_widow: true, owns_pucca_house: false, has_bank_account: true,
    has_lpg_connection: false, works_unorganised: true, household_size: 2,
  },
};

const FIXED = ["household_size", "education_level", "gender", "has_bank_account",
  "owns_pucca_house", "residence", "occupation", "category", "age",
  "annual_income_inr", "ration_card_type", "state"];

console.log(`\n${schemes.length} schemes · ${Object.keys(registry).length} attributes\n`);

for (const [label, truth] of Object.entries(personas)) {
  // What the vision model reads off a ration card + 7/12 extract, before any question.
  const FROM_DOCS = ["state", "age", "gender", "ration_card_type", "household_size",
    "annual_income_inr", "owns_agri_land", "landholding_ha", "category"];
  const seed: Profile = {};
  for (const a of FROM_DOCS) if (a in truth) seed[a] = truth[a];

  const cold = simulate(schemes, truth, registry, 20, { minGain: 1 });
  const { asked, trail } = simulate(schemes, truth, registry, 20, { minGain: 1, seed });
  const fixed = simulateFixedOrder(schemes, truth, FIXED);
  const final = match(truth, schemes);

  console.log(`── ${label}`);
  console.log(`   cold start        : ${cold.trail.join(" → ")}  (${cold.asked.length} questions)`);
  console.log(`   after documents   : ${trail.join(" → ")}  (${asked.length} questions)`);
  console.log(`   asked    : ${asked.join(", ")}`);
  console.log(`   fixed    : ${fixed.slice(0, trail.length).join(" → ")} …`);
  console.log(`   eligible : ${final.eligible.length} schemes, ` +
    `₹${final.eligible.reduce((t, s) => t + (s.benefit.amount_inr_per_year ?? 0), 0).toLocaleString("en-IN")}/yr`);
  console.log(`   ${final.eligible.slice(0, 5).map((s) => s.name.en).join("; ")}\n`);
}

// how many questions to reach a stable answer, averaged
const DOCS = ["state", "age", "gender", "ration_card_type", "household_size",
  "annual_income_inr", "owns_agri_land", "landholding_ha", "category"];
const lens = Object.values(personas).map((p) => {
  const seed: Profile = {};
  for (const a of DOCS) if (a in p) seed[a] = p[a];
  return simulate(schemes, p, registry, 20, { minGain: 1, seed }).asked.length;
});
console.log(`Average questions to converge: ${(lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(1)}`);
console.log(`Starting candidate set: ${livingSet({}, schemes).length}\n`);
