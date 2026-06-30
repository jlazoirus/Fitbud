// REQ-77 — Barrido de dominio: garantiza que calculateMacroTargets produce
// metas internamente consistentes: |kcal - (p*4+c*4+f*9)| <= 10 para todo
// perfil válido. También verifica que la proteína para personas de alto peso
// queda en un rango fisiológico razonable.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";

const g = globalThis;

const WEIGHTS   = [35, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 160, 180, 200, 250];
const HEIGHTS   = [130, 150, 155, 160, 165, 170, 175, 180, 185, 190, 200, 210, 220, 230];
const AGES      = [18, 25, 30, 40, 50, 60, 70, 80, 90];
const SEXES     = ["male", "female"];
const GOALS     = ["deficit", "mantenimiento", "volumen"];
const ACTIVITIES= ["light", "moderate", "high"];
const BF_SAMPLES= [null, 10, 15, 25, 35];  // null = sin %grasa

let checks = 0;
let failures = [];

for (const weightKg of WEIGHTS) {
  for (const heightCm of HEIGHTS) {
    for (const age of AGES) {
      for (const sex of SEXES) {
        for (const goal of GOALS) {
          for (const activityLevel of ACTIVITIES) {
            for (const bfPct of BF_SAMPLES) {
              const input = { weightKg, heightCm, age, sex, goal, activityLevel };
              if (bfPct !== null) input.bodyFatPct = bfPct;

              const r = g.calculateMacroTargets(input);
              const sum = r.p * 4 + r.c * 4 + r.f * 9;
              const delta = Math.abs(r.kcal - sum);
              checks++;

              if (delta > 10) {
                failures.push({ input, result: r, sum, delta });
              }
            }
          }
        }
      }
    }
  }
}

assert.equal(failures.length, 0,
  `${failures.length} perfil(es) con |kcal - suma_macros| > 10:\n` +
  failures.slice(0, 5).map(f =>
    `  ${JSON.stringify(f.input)} → kcal=${f.result.kcal} suma=${f.sum} delta=${f.delta}`
  ).join("\n")
);

// Caso canónico del bug REQ-77: 140 kg / 160 cm / 60 años / female / light / déficit
const canon = g.calculateMacroTargets({
  weightKg: 140, heightCm: 160, age: 60, sex: "female",
  goal: "deficit", activityLevel: "light"
});
const canonSum = canon.p * 4 + canon.c * 4 + canon.f * 9;
assert.ok(Math.abs(canon.kcal - canonSum) <= 10,
  `Caso canónico: kcal=${canon.kcal} vs suma=${canonSum} (delta ${Math.abs(canon.kcal-canonSum)} > 10)`
);
assert.ok(canon.p <= 220,
  `Proteína para 140 kg female sin BF% debe ser ≤ 220 g (era 280 g con bug), obtuvo ${canon.p} g`
);

console.log(`validate-macro-targets-invariant: ${checks} perfiles verificados — todos pasan |kcal-suma|≤10.`);
console.log(`  Caso canónico 140 kg / 160 cm / 60 a / female / light / déficit: kcal=${canon.kcal} P=${canon.p} C=${canon.c} F=${canon.f} suma=${canonSum}`);
