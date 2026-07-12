#!/usr/bin/env node
// REQ-129 — finalizeNutritionDay() puro, dormido y verificable.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");
assert.equal(typeof d.finalizeNutritionDay, "function", "finalizeNutritionDay debe exportarse");
assert.equal(typeof globalThis.finalizeNutritionDay, "function", "finalizeNutritionDay debe exponerse globalmente");
assert.equal(d.DIET_CONTRACT.runtimeActive, true, "REQ-139 activa DIET_CONTRACT como aviso suave");

const SLOT_TARGET = { kcal: 390, p: 20, c: 50, f: 10 };
const DAY_TARGET = { kcal: 390, p: 20, c: 50, f: 10 };
const TWO_SLOT_TARGET = { kcal: 780, p: 40, c: 100, f: 20 };
const catalog = {
  ingredients: [
    { id: 1, name: "Proteina aislada", slug: "proteina-aislada", category: "Proteina", kcal: 100, protein_g: 20, carbs_g: 0, fat_g: 0 },
    { id: 2, name: "Arroz cocido", slug: "arroz-cocido", category: "Carbohidrato", kcal: 100, protein_g: 0, carbs_g: 25, fat_g: 0 },
    { id: 3, name: "Aceite de oliva", slug: "aceite-de-oliva", category: "Grasa", kcal: 900, protein_g: 0, carbs_g: 0, fat_g: 100 },
  ],
  dishes: [
    {
      id: 10,
      name: "Bowl exacto",
      slug: "bowl-exacto",
      slot: "desayuno",
      compatible_slots: ["desayuno", "almuerzo"],
      diet_tags: ["omnivoro", "vegetariano", "vegano"],
    },
  ],
  dishIng: [
    { dish_id: 10, ingredient_id: 1, grams: 100, scalable: false },
    { dish_id: 10, ingredient_id: 2, grams: 200, scalable: false },
    { dish_id: 10, ingredient_id: 3, grams: 10, scalable: false },
  ],
};
const prefs = { mealCount: 2, mainMealIndex: 1, diet: ["omnivoro"] };
const oneSlot = [{ id: "desayuno", slot: "Desayuno", target: SLOT_TARGET }];

const unknown = d.finalizeNutritionDay({
  prefs,
  dayTarget: DAY_TARGET,
  catalog,
  slots: oneSlot,
  proposal: {
    comidas: [{
      slot_id: "desayuno",
      nombre: "Batido misterioso",
      kcal: 9999,
      proteina_g: 999,
      carbohidratos_g: 999,
      grasa_g: 999,
      ingredientes: [{ nombre: "Polvo lunar", gramos: 100 }],
    }],
  },
});
assert.ok(unknown.diagnostics.some(item => item.reason === "unknown_ingredient"), "ingrediente desconocido debe diagnosticarse");
assert.equal(unknown.comidas.length, 1, "fallback debe llenar el slot descartado");
assert.equal(unknown.comidas[0].nombre, "Bowl exacto", "la comida desconocida no debe pasar como aplicable");
assert.equal(unknown.comidas[0].source, "deterministic_fallback", "el slot descartado se reemplaza por catalogo");
assert.ok(unknown.contract.ok, "el contrato debe reportarse tras el reemplazo");

const recalculated = d.finalizeNutritionDay({
  prefs,
  dayTarget: DAY_TARGET,
  catalog,
  slots: oneSlot,
  proposal: {
    comidas: [{
      slot_id: "desayuno",
      nombre: "Bowl exacto",
      dishSlug: "bowl-exacto",
      kcal: 9999,
      proteina_g: 999,
      carbohidratos_g: 999,
      grasa_g: 999,
      ingredientes: [
        { nombre: "Proteina aislada", gramos: 100, ingredientSlug: "proteina-aislada" },
        { nombre: "Arroz cocido", gramos: 200, ingredientSlug: "arroz-cocido" },
        { nombre: "Aceite de oliva", gramos: 10, ingredientSlug: "aceite-de-oliva" },
      ],
    }],
  },
});
assert.equal(recalculated.status, "ok", "propuesta conocida exacta debe quedar aplicable");
assert.equal(recalculated.totals.kcal, 390, "kcal debe venir del catalogo, no de macros declarados");
assert.equal(recalculated.comidas[0].kcal, 390, "macros declarados por la propuesta se ignoran");
assert.equal(recalculated.contract.ok, true, "contract.ok debe reportarse");

const fallback = d.finalizeNutritionDay({
  prefs,
  dayTarget: TWO_SLOT_TARGET,
  catalog,
  slots: [
    { id: "desayuno", slot: "Desayuno", target: SLOT_TARGET },
    { id: "almuerzo", slot: "Almuerzo", target: SLOT_TARGET },
  ],
  proposal: { comidas: [] },
});
assert.equal(fallback.comidas.length, 2, "fallback debe completar slots faltantes");
assert.deepEqual(fallback.totals, TWO_SLOT_TARGET, "fallback usa el solver/catalogo para completar macros");
assert.equal(fallback.contract.ok, true, "fallback exacto debe cumplir contrato");

const lockedMeal = {
  slot_id: "desayuno",
  nombre: "Comida registrada",
  kcal: 120,
  proteina_g: 5,
  carbohidratos_g: 10,
  grasa_g: 2,
  ingredientes: [{ nombre: "Registro manual", gramos: 1 }],
};
const lockedBefore = JSON.stringify(lockedMeal);
const locked = d.finalizeNutritionDay({
  prefs,
  dayTarget: DAY_TARGET,
  catalog,
  slots: oneSlot,
  lockedMeals: [lockedMeal],
});
assert.equal(JSON.stringify(lockedMeal), lockedBefore, "lockedMeals no debe mutarse");
assert.deepEqual(locked.comidas[0], lockedMeal, "la comida bloqueada debe salir intacta");
assert.equal(locked.comidas[0].nombre, "Comida registrada", "locked meal se conserva");
assert.equal(locked.status, "no_solution", "locked meal fuera de contrato debe reportarse");
assert.ok((locked.no_solution || []).some(item => item.reason === "locked_meal_contract_miss"),
  "locked meal que impide contrato debe reportar causa dedicada");

// ── REQ-137: pasada global de cierre sobre residuos acumulados ──────────────
// Dos platos de una sola linea de proteina pura (kcal=p*4, sin carbohidratos
// ni grasa) para aislar el efecto de la pasada global. El plato de la comida 2
// tiene un limite de escalado (max_g) que impide alcanzar su propio target;
// el plato de la comida 1 tiene margen de sobra. El solver por comida deja a
// cada slot en su optimo local (100 g cada uno), acumulando un residuo de
// proteina/kcal que supera la tolerancia del DIET_CONTRACT. La pasada global
// debe reasignar gramos hacia la comida 1 (aunque se aleje de su propio
// target local) para cerrar el residuo del dia completo.
const closureCatalog = {
  ingredients: [
    { id: 1, name: "Proteina A", slug: "proteina-a", category: "Proteina", kcal: 100, protein_g: 25, carbs_g: 0, fat_g: 0 },
    { id: 2, name: "Proteina B", slug: "proteina-b", category: "Proteina", kcal: 100, protein_g: 25, carbs_g: 0, fat_g: 0 },
  ],
  dishes: [
    { id: 20, name: "Plato proteico A", slug: "plato-proteico-a", slot: "desayuno", compatible_slots: ["desayuno"], diet_tags: ["omnivoro", "vegetariano", "vegano"] },
    { id: 21, name: "Plato proteico B", slug: "plato-proteico-b", slot: "almuerzo", compatible_slots: ["almuerzo"], diet_tags: ["omnivoro", "vegetariano", "vegano"] },
  ],
  dishIng: [
    { dish_id: 20, ingredient_id: 1, grams: 100, scalable: true, min_g: 20, max_g: 400, step_g: 5 },
    { dish_id: 21, ingredient_id: 2, grams: 100, scalable: true, min_g: 20, max_g: 100, step_g: 5 },
  ],
};
const closurePrefs = { mealCount: 2, mainMealIndex: 1, diet: ["omnivoro"] };
const closureSlots = [
  { id: "desayuno", slot: "Desayuno", target: { kcal: 100, p: 25, c: 0, f: 0 } },
  { id: "almuerzo", slot: "Almuerzo", target: { kcal: 240, p: 60, c: 0, f: 0 } },
];
const closureDayTarget = { kcal: 340, p: 85, c: 0, f: 0 };
const closureProposal = {
  comidas: [
    { slot_id: "desayuno", nombre: "Plato proteico A", dishSlug: "plato-proteico-a", ingredientes: [{ nombre: "Proteina A", ingredientSlug: "proteina-a", gramos: 100 }] },
    { slot_id: "almuerzo", nombre: "Plato proteico B", dishSlug: "plato-proteico-b", ingredientes: [{ nombre: "Proteina B", ingredientSlug: "proteina-b", gramos: 100 }] },
  ],
};
const beforeClosure = d.validateDietContractTotals({ kcal: 200, p: 50, c: 0, f: 0 }, closureDayTarget);
assert.equal(beforeClosure.ok, false, "el residuo acumulado sin pasada global debe quedar fuera de contrato (control del fixture)");

const closed = d.finalizeNutritionDay({
  prefs: closurePrefs,
  dayTarget: closureDayTarget,
  catalog: closureCatalog,
  slots: closureSlots,
  proposal: closureProposal,
});
assert.equal(closed.status, "ok", "la pasada global debe cerrar el residuo acumulado dentro del contrato");
assert.equal(closed.contract.ok, true, "contract.ok debe ser true tras la pasada global");
assert.deepEqual(closed.totals, { kcal: 340, p: 85, c: 0, f: 0 }, "los totales del dia deben igualar el target tras redistribuir gramos");
assert.equal(closed.comidas.find(m => m.slot_id === "almuerzo").proteina_g, 25, "la comida topada por max_g se mantiene en su limite");
assert.ok(closed.comidas.find(m => m.slot_id === "desayuno").proteina_g > 25,
  "la comida con margen debe absorber el residuo aunque se aleje de su propio target local");

// Caso imposible: ambos platos topados por max_g no alcanzan el target del dia
// y no hay ningun plato snack/batido en el catalogo para complementar. Debe
// devolver no_solution con causa medible, nunca un dia aplicable fuera de
// contrato.
const impossibleCatalog = {
  ingredients: closureCatalog.ingredients,
  dishes: closureCatalog.dishes,
  dishIng: [
    { dish_id: 20, ingredient_id: 1, grams: 100, scalable: true, min_g: 20, max_g: 150, step_g: 5 },
    { dish_id: 21, ingredient_id: 2, grams: 100, scalable: true, min_g: 20, max_g: 100, step_g: 5 },
  ],
};
const impossible = d.finalizeNutritionDay({
  prefs: closurePrefs,
  dayTarget: closureDayTarget,
  catalog: impossibleCatalog,
  slots: closureSlots,
  proposal: closureProposal,
});
assert.equal(impossible.status, "no_solution", "un target inalcanzable por catalogo debe reportarse como no_solution");
assert.equal(impossible.contract.ok, false, "no debe marcarse contract.ok cuando el catalogo no alcanza");
assert.ok((impossible.no_solution || []).some(item => item.reason === "protein_contract"),
  "la causa debe identificar la metrica que no cierra");

console.log("validate-finalize-nutrition-day: todos los checks pasaron.");
