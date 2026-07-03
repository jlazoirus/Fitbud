// REQ-78 — Validador del módulo de dominio nutricional puro.
// Cubre: target consistente e inconsistente, macros de receta desde ingredientes,
// restricción "pollo" que no bloquea "repollo", alergia free-text, slots 2-6 comidas.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const g = globalThis;

assert.ok(g.FITBUD_NUTRITION_DOMAIN, "FITBUD_NUTRITION_DOMAIN debe existir");
const d = g.FITBUD_NUTRITION_DOMAIN;

// ── MEAL_SLOT_VOCAB ───────────────────────────────────────────────────────────
const EXPECTED_SLOTS = ["desayuno","media_manana","almuerzo","merienda","snack","cena","recena"];
EXPECTED_SLOTS.forEach(s => assert.ok(d.MEAL_SLOT_VOCAB.has(s), `MEAL_SLOT_VOCAB debe contener ${s}`));

// ── mealSlotsForCount ─────────────────────────────────────────────────────────
for (const n of [2, 3, 4, 5, 6]) {
  const slots = d.mealSlotsForCount(n);
  assert.equal(slots.length, n, `mealSlotsForCount(${n}) debe devolver ${n} slots`);
  slots.forEach(s => {
    assert.ok(s.id, `slot de mealSlotsForCount(${n}) debe tener id`);
    // s.id es el identificador de máquina (desayuno, media_manana…); s.slot es el label display
    assert.ok(d.MEAL_SLOT_VOCAB.has(s.id), `id "${s.id}" de mealSlotsForCount(${n}) debe estar en MEAL_SLOT_VOCAB`);
  });
}

// ── kcalFromMacros ────────────────────────────────────────────────────────────
assert.equal(d.kcalFromMacros(150, 200, 60), 150*4+200*4+60*9, "kcalFromMacros correcto");
assert.equal(d.kcalFromMacros(0, 0, 0), 0, "kcalFromMacros cero");

// ── macrosFromIngredientMap ───────────────────────────────────────────────────
// kcal del ingrediente es fuente directa, no derivada de 4/4/9
const ingMap = {
  1: { kcal: 364, protein_g: 13, carbs_g: 71, fat_g: 1.5 }, // harina de avena
  2: { kcal:  90, protein_g: 25, carbs_g:  0, fat_g: 1.0 }, // proteína en polvo
};
const lines = [
  { ingredient_id: 1, grams: 80 },
  { ingredient_id: 2, grams: 30 },
];
const macros = d.macrosFromIngredientMap(lines, ingMap);
// kcal debe venir de kcal del ingrediente, no calculada como p*4+c*4+f*9
assert.equal(macros.kcal, Math.round(364*0.8 + 90*0.3), "kcal usa ingredient.kcal directamente");
assert.equal(macros.p,    Math.round(13*0.8 + 25*0.3),  "proteína correcta");
assert.equal(macros.c,    Math.round(71*0.8 + 0*0.3),   "carbohidratos correctos");

// ingrediente desconocido se ignora
const macros2 = d.macrosFromIngredientMap([{ingredient_id:99, grams:100}], ingMap);
assert.equal(macros2.kcal, 0, "ingrediente desconocido da 0");

// ── allergyTermsForProfile ────────────────────────────────────────────────────
const vegPrefs = { diet: ["vegetariano"] };
const terms = d.allergyTermsForProfile(vegPrefs);
assert.ok(terms.includes("pollo"),    "vegetariano bloquea pollo");
assert.ok(terms.includes("carne"),    "vegetariano bloquea carne");
assert.ok(!terms.includes("huevo"),   "vegetariano no bloquea huevo");

const veganPrefs = { diet: ["vegano"] };
const veganTerms = d.allergyTermsForProfile(veganPrefs);
assert.ok(veganTerms.includes("huevo"),  "vegano bloquea huevo");
assert.ok(veganTerms.includes("queso"), "vegano bloquea queso");

const allergyPrefs = { allergies: "nuez, cacahuete" };
const allergyTerms = d.allergyTermsForProfile(allergyPrefs);
assert.ok(allergyTerms.includes("nuez"),      "alergia nuez presente");
assert.ok(allergyTerms.includes("cacahuete"), "alergia cacahuete presente");

// ── foodTextViolatesTerms — falsos positivos ──────────────────────────────────
// "pollo" no debe bloquear "repollo" (matcher por palabra, REQ-66)
const termsCarne = d.allergyTermsForProfile({ diet: ["vegetariano"] });
assert.equal(d.foodTextViolatesTerms("repollo al vapor", termsCarne), "",
  "repollo no debe bloquearse por el término pollo");
assert.ok(d.foodTextViolatesTerms("arroz con pollo asado", termsCarne) !== "",
  "pollo asado debe bloquearse con dieta vegetariana");
// "res" no debe coincidir en "fresco"
assert.equal(d.foodTextViolatesTerms("tomate fresco", termsCarne), "",
  "fresco no debe bloquearse por el término res");
assert.ok(d.foodTextViolatesTerms("carne de res guisada", termsCarne) !== "",
  "carne de res debe bloquearse con dieta vegetariana");

// ── Restricciones alimenticias completas para generación inicial ──────────────
assert.ok(d.foodBlockTermsForProfile({ diet: ["vegano"] }).includes("miel"),
  "vegano debe bloquear miel");
assert.ok(d.foodTextConflictForProfile("pollo a la plancha", { diet: ["vegetariano"] }),
  "vegetariano debe bloquear pollo");
assert.equal(d.foodTextConflictForProfile("repollo al vapor", { diet: ["vegetariano"] }), "",
  "vegetariano no debe bloquear repollo por falso positivo");
assert.ok(d.foodTextConflictForProfile("yogur griego con fruta", { diet: ["sin_lacteos"] }),
  "sin_lacteos debe bloquear yogur");
assert.ok(d.foodTextConflictForProfile("pan integral con palta", { diet: ["sin_gluten"] }),
  "sin_gluten debe bloquear pan/trigo");
assert.equal(d.foodTextConflictForProfile("tofu salteado", { dislikedIngredients: "tofu" }), "",
  "los ingredientes no preferidos no son restricción dura por defecto");
assert.ok(d.foodTextConflictForProfile("tofu salteado", { dislikedIngredients: "tofu" }, { includeSoft: true }),
  "includeSoft permite detectar ingredientes no preferidos");

// ── validateTargetConsistency ─────────────────────────────────────────────────
// Target consistente (post-REQ-77)
const consistent = { kcal: 2300, p: 160, c: 271, f: 64 }; // 640+1084+576=2300
assert.ok(d.validateTargetConsistency(consistent).ok,
  "target consistente debe pasar validación");

// Target inconsistente (bug original REQ-77: 140 kg mujer)
const inconsistent = { kcal: 2230, p: 280, c: 50, f: 112 }; // suma=2328
assert.ok(!d.validateTargetConsistency(inconsistent).ok,
  "target inconsistente (kcal≠suma_macros) debe fallar");
assert.ok(d.validateTargetConsistency(inconsistent).errors[0].includes("98"),
  "error debe mencionar la diferencia de 98 kcal");

// Entrada inválida
assert.ok(!d.validateTargetConsistency(null).ok, "null debe fallar");

// ── validateDayTotals ─────────────────────────────────────────────────────────
const target = { kcal: 2000, p: 150, c: 200, f: 65 };

// Día dentro de tolerancia
const goodDay = { kcal: 2050, p: 155, c: 210, f: 60 };
const r1 = d.validateDayTotals(goodDay, target);
assert.ok(r1.ok, "día dentro de tolerancia debe pasar");

// kcal fuera de ±15%
const badKcal = { kcal: 1500, p: 150, c: 100, f: 60 };
assert.ok(!d.validateDayTotals(badKcal, target).ok, "kcal muy baja debe fallar");

// proteína insuficiente (<85%)
const lowProt = { kcal: 2000, p: 100, c: 220, f: 68 };
assert.ok(!d.validateDayTotals(lowProt, target).ok, "proteína baja debe fallar");

// carbs lejos solo genera advertencia, no error
const highCarb = { kcal: 2000, p: 150, c: 350, f: 40 };
const r2 = d.validateDayTotals(highCarb, target);
assert.ok(r2.ok, "carbs lejos solo es warning, no bloquea");
assert.ok(r2.warns.length > 0, "carbs lejos genera advertencia");

// ── validateSlotMacros ────────────────────────────────────────────────────────
const slotTarget = { kcal: 500 };
assert.ok(d.validateSlotMacros({ kcal: 520 }, slotTarget).ok,
  "slot dentro de ±25% debe pasar");
assert.ok(!d.validateSlotMacros({ kcal: 200 }, slotTarget).ok,
  "slot muy bajo debe fallar");
// sin target de slot no hay validación
assert.ok(d.validateSlotMacros({ kcal: 100 }, null).ok,
  "sin slotTarget no hay error");

// ── validateReplacementFeasibility ───────────────────────────────────────────
const rep1 = d.validateReplacementFeasibility(480, 500); // delta=-20 → 4%
assert.ok(rep1.rebalanceable, "reemplazo cercano es rebalanceable");
assert.equal(rep1.delta, -20, "delta correcto");

const rep2 = d.validateReplacementFeasibility(650, 500); // delta=+150 → 30%
assert.ok(!rep2.rebalanceable, "reemplazo con +30% no es rebalanceable");

// ── NUTRITION_TOLERANCES ──────────────────────────────────────────────────────
assert.equal(d.NUTRITION_TOLERANCES.TARGET_KCAL_DELTA, 10, "tolerancia target = 10 kcal");
assert.equal(d.NUTRITION_TOLERANCES.DAY_KCAL_PCT, 0.15, "tolerancia día = 15%");
assert.equal(d.NUTRITION_TOLERANCES.SLOT_KCAL_PCT, 0.25, "tolerancia slot = 25%");

console.log("validate-nutrition-domain: todos los checks pasaron.");
