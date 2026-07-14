#!/usr/bin/env node
// REQ-83 — Motor de reemplazos equivalentes con rebalanceo de comidas futuras.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");
assert.ok(typeof d.rankReplacementCandidates === "function", "rankReplacementCandidates debe existir");
assert.ok(typeof d.solveReplacement === "function", "solveReplacement debe existir");
assert.ok(typeof d.rebalanceFutureMeals === "function", "rebalanceFutureMeals debe existir");

// ── Catálogo de prueba ────────────────────────────────────────────────────────
const ingredients = [
  { id: 1, slug: "proteina-en-polvo", name: "Proteína en polvo", category: "Proteína", kcal: 375, protein_g: 80, carbs_g: 8, fat_g: 5 },
  { id: 2, slug: "tofu-firme", name: "Tofu firme", category: "Proteína", kcal: 145, protein_g: 16, carbs_g: 3, fat_g: 9 },
  { id: 3, slug: "avena", name: "Avena", category: "Cereal", kcal: 389, protein_g: 13, carbs_g: 66, fat_g: 7 },
  { id: 4, slug: "arroz-cocido", name: "Arroz cocido", category: "Cereal", kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { id: 5, slug: "aceite-de-oliva", name: "Aceite de oliva", category: "Grasa", kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },
  { id: 6, slug: "frutos-rojos", name: "Frutos rojos", category: "Fruta", kcal: 50, protein_g: 1, carbs_g: 12, fat_g: 0.3 },
  { id: 7, slug: "garbanzos-cocidos", name: "Garbanzos cocidos", category: "Legumbre", kcal: 164, protein_g: 9, carbs_g: 27, fat_g: 2.6 },
  { id: 8, slug: "yogur-griego", name: "Yogur griego natural 0%", category: "Lácteo", kcal: 60, protein_g: 10, carbs_g: 3.6, fat_g: 0.4 },
  { id: 9, slug: "pechuga-de-pollo", name: "Pechuga de pollo", category: "Proteína animal", kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { id: 10, slug: "huevo-entero", name: "Huevo entero", category: "Proteína animal", kcal: 143, protein_g: 13, carbs_g: 1, fat_g: 9.5 },
  { id: 11, slug: "papa", name: "Papa", category: "Verdura", kcal: 77, protein_g: 2, carbs_g: 17, fat_g: 0.1 },
];
const dishes = [
  { id: 101, slug: "avena-proteica", name: "Avena proteica", slot: "desayuno", compatible_slots: ["desayuno"], diet_tags: ["omnivoro"] },
  { id: 102, slug: "shake-proteico", name: "Shake proteico", slot: "snack", compatible_slots: ["media_manana", "merienda", "snack"], diet_tags: ["omnivoro"] },
  { id: 103, slug: "tofu-arroz", name: "Bowl de tofu con arroz", slot: "almuerzo", compatible_slots: ["almuerzo", "cena"], diet_tags: ["vegano", "vegetariano", "omnivoro"] },
  { id: 104, slug: "garbanzos-papa", name: "Garbanzos con papa", slot: "cena", compatible_slots: ["almuerzo", "cena"], diet_tags: ["vegano", "vegetariano", "omnivoro"] },
  { id: 105, slug: "yogur-proteico", name: "Yogur proteico", slot: "snack", compatible_slots: ["media_manana", "merienda", "snack"], diet_tags: ["vegetariano", "omnivoro"] },
  { id: 106, slug: "huevos-avena", name: "Huevos con avena", slot: "desayuno", compatible_slots: ["desayuno"], diet_tags: ["vegetariano", "omnivoro"] },
  { id: 107, slug: "pollo-arroz", name: "Pollo con arroz", slot: "almuerzo", compatible_slots: ["almuerzo", "cena"], diet_tags: ["omnivoro"] },
  { id: 108, slug: "pollo-papa", name: "Pollo con papa", slot: "cena", compatible_slots: ["almuerzo", "cena"], diet_tags: ["omnivoro"] },
];
function line(did, iid, g) {
  return { dish_id: did, ingredient_id: iid, grams: g, scalable: true, min_g: Math.max(5, Math.round(g * 0.5)), max_g: Math.max(g, Math.round(g * 2)), step_g: 5 };
}
const dishIng = [
  line(101, 1, 45), line(101, 3, 50), line(101, 6, 80),
  line(102, 1, 55), line(102, 6, 100),
  line(103, 2, 250), line(103, 4, 180), line(103, 5, 8),
  line(104, 7, 250), line(104, 2, 180), line(104, 11, 220), line(104, 5, 8),
  line(105, 8, 250), line(105, 1, 35), line(105, 6, 80),
  line(106, 10, 150), line(106, 3, 70),
  line(107, 9, 180), line(107, 4, 220), line(107, 5, 8),
  line(108, 9, 180), line(108, 11, 260), line(108, 5, 8),
];
const catalog = { ingredients, dishes, dishIng };
const dayTarget = { kcal: 2000, p: 150, c: 205, f: 64 };
const prefs = { mealCount: 4, mainMealIndex: 2, diet: ["omnivoro"] };

// Comida actual de almuerzo (600 kcal, P 55)
const currentMeal = { slot_id: "almuerzo", kcal: 600, proteina_g: 55, carbohidratos_g: 65, grasa_g: 14 };
// Target del slot almuerzo (comida principal)
const mealTarget = { kcal: 700, p: 60, c: 70, f: 22 };
// Candidatos compatibles con slot almuerzo
const almuerzoCandidates = dishes.filter(d2 => (d2.compatible_slots || []).includes("almuerzo"));

// ── Test 1: rankReplacementCandidates devuelve candidatos ordenados por cercanía ──
const ranked = d.rankReplacementCandidates(currentMeal, almuerzoCandidates, mealTarget, catalog);
assert.ok(Array.isArray(ranked) && ranked.length > 0, "debe devolver candidatos rankeados");
assert.ok(ranked.every(r => r.dish && r.macros && typeof r.deltaKcal === "number"),
  "cada candidato debe tener dish, macros y deltaKcal");
assert.ok(ranked.every(r => typeof r.deltaP === "number" && typeof r.deltaC === "number" && typeof r.deltaF === "number"),
  "cada candidato debe tener deltaP, deltaC, deltaF");
// El primero debe ser el más cercano al target
assert.ok(Math.abs(ranked[0].deltaKcal) <= Math.abs(ranked[ranked.length - 1].deltaKcal) || ranked.length === 1,
  "candidatos deben estar ordenados por cercanía");
console.log(`  Test 1 pasado: ${ranked.length} candidatos rankeados, primero es "${ranked[0].dish.name}" (Δ${ranked[0].deltaKcal} kcal)`);

// ── Test 2: reemplazo dentro de tolerancia, sin rebalanceo ───────────────────
// currentMeal.kcal=600, si el reemplazo tiene delta ≤50 kcal → no rebalancear
const smallDelta = 30; // dentro de tolerancia (≤50)
const dayMeals = [
  { id: "desayuno", slot: "desayuno", kcal: 400, proteina_g: 30 },
  { id: "almuerzo", slot: "almuerzo", kcal: 600, proteina_g: 55 },
  { id: "merienda", slot: "merienda", kcal: 200, proteina_g: 15 },
  { id: "cena", slot: "cena", kcal: 600, proteina_g: 50 },
];
const dayLog_noRebal = { meals: { desayuno: { done: true }, almuerzo: { done: false }, merienda: { done: false }, cena: { done: false } } };
const solv1 = d.solveReplacement("almuerzo", smallDelta, dayMeals, dayLog_noRebal);
assert.equal(solv1.rebalanceNeeded, false, "delta pequeño no debe requerir rebalanceo");
assert.ok(Array.isArray(solv1.futureMeals), "futureMeals debe ser array");
console.log("  Test 2 pasado: reemplazo dentro de tolerancia sin rebalanceo");

// ── Test 3: reemplazo que requiere rebalanceo en comidas futuras ─────────────
const largeDelta = 250; // excede 50 kcal → requiere rebalanceo
const solv2 = d.solveReplacement("almuerzo", largeDelta, dayMeals, dayLog_noRebal);
assert.equal(solv2.rebalanceNeeded, true, "delta grande debe requerir rebalanceo");
assert.ok(solv2.futureMeals.length > 0, "debe identificar comidas futuras para rebalancear");
assert.ok(!solv2.futureMeals.some(fm => fm.id === "desayuno"), "desayuno (ya hecho) no debe incluirse");
assert.ok(!solv2.futureMeals.some(fm => fm.id === "almuerzo"), "almuerzo (cambiado) no debe incluirse");
console.log(`  Test 3 pasado: ${solv2.futureMeals.length} comidas futuras para rebalancear`);

// ── Test 4: comida ya registrada no se toca en el rebalanceo ─────────────────
const dayLog_merDone = {
  meals: {
    desayuno: { done: true },
    almuerzo: { done: false },
    merienda: { done: true }, // ya registrada
    cena: { done: false },
  }
};
const solv3 = d.solveReplacement("almuerzo", largeDelta, dayMeals, dayLog_merDone);
assert.ok(!solv3.futureMeals.some(fm => fm.id === "merienda"), "merienda ya registrada no debe ser candidata a rebalanceo");
assert.ok(solv3.futureMeals.some(fm => fm.id === "cena"), "cena (no hecha) sí debe ser candidata");
console.log("  Test 4 pasado: comida ya registrada excluida del rebalanceo");

// ── Test 5: rebalanceFutureMeals distribuye el delta correctamente ───────────
const futureMeals = [
  { id: "merienda", slot: "merienda", kcal: 200 },
  { id: "cena", slot: "cena", kcal: 600, dishSlug: "pollo-arroz" },
];
const adjustments = d.rebalanceFutureMeals(futureMeals, largeDelta, dayTarget, prefs, catalog);
assert.equal(adjustments.length, 2, "debe generar un ajuste por comida futura");
const totalAdjust = adjustments.reduce((s, a) => s + a.adjustKcal, 0);
// El total de ajustes debe compensar el delta (signo opuesto)
assert.ok(Math.abs(totalAdjust + largeDelta) <= 10,
  `ajuste total (${totalAdjust}) debe compensar el delta (${largeDelta})`);
console.log(`  Test 5 pasado: ajuste de ${totalAdjust} kcal distribuido en ${adjustments.length} comidas`);

// ── Test 6: comida con dishSlug recibe newOvr re-solver ───────────────────────
const cenaAdj = adjustments.find(a => a.slot_id === "cena");
assert.ok(cenaAdj, "debe existir ajuste para cena");
// cena tiene dishSlug "pollo-arroz" → debe re-solver la porción
assert.ok(cenaAdj.newOvr !== null, "cena con dishSlug debe recibir newOvr con porción re-solucionada");
assert.ok(cenaAdj.newOvr && cenaAdj.newOvr.kcal > 0, "newOvr.kcal debe ser positivo");
console.log(`  Test 6 pasado: cena con dishSlug recibe newOvr (${cenaAdj.newOvr && cenaAdj.newOvr.kcal} kcal)`);

// ── Test 7: comida sin dishSlug no recibe newOvr (solo nota) ─────────────────
const merAdj = adjustments.find(a => a.slot_id === "merienda");
assert.ok(merAdj, "debe existir ajuste para merienda");
// merienda no tiene dishSlug → no hay newOvr, solo adjustKcal
assert.equal(merAdj.newOvr, null, "merienda sin dishSlug no debe recibir newOvr");
console.log("  Test 7 pasado: comida sin dishSlug no recibe newOvr (solo registra ajuste)");

// ── Test 8: día completado (todas hechas) → solveReplacement advierte ─────────
const dayLog_allDone = {
  meals: { desayuno: { done: true }, almuerzo: { done: true }, merienda: { done: true }, cena: { done: true } }
};
const solv4 = d.solveReplacement("almuerzo", largeDelta, dayMeals, dayLog_allDone);
assert.equal(solv4.rebalanceNeeded, true, "sigue siendo necesario rebalancear");
assert.equal(solv4.futureMeals.length, 0, "día completado: no hay comidas futuras disponibles");
assert.ok(solv4.warns.length > 0, "debe advertir que no hay comidas futuras para compensar");
console.log(`  Test 8 pasado: día completado genera advertencia "${solv4.warns[0]}"`);

// ── Test 9: restricción dietaria dura excluye candidatos incompatibles ─────────
// Solo pasamos candidatos que NO sean veganos para usuario vegano (pre-filtrado por slot)
// El ranker no filtra dieta — eso es responsabilidad del llamador (compatibleDishesForSlot)
// Verificamos que rankReplacementCandidates procese solo los candidatos dados
const veganCandidates = dishes.filter(d2 => (d2.compatible_slots || []).includes("almuerzo") && (d2.diet_tags || []).includes("vegano"));
const veganRanked = d.rankReplacementCandidates(currentMeal, veganCandidates, mealTarget, catalog);
assert.ok(veganRanked.every(r => (r.dish.diet_tags || []).includes("vegano")),
  "solo candidatos veganos deben aparecer cuando se filtra por dieta");
console.log(`  Test 9 pasado: restricción de dieta vegana respetada (${veganRanked.length} candidatos)`);

// ── Test 10: reemplazo conectado a finalizeNutritionDay() (REQ-142) ──────────
// Cambiar almuerzo por "Bowl de tofu con arroz" (delta grande) debe poder
// cerrarse con finalizeNutritionDay(): la comida cambiada queda lockedMeals
// (no la toca globalClosePass), las futuras entran como proposal y el cierre
// global reemplaza el reparto proporcional de rebalanceFutureMeals().
assert.ok(typeof d.finalizeNutritionDay === "function", "finalizeNutritionDay debe existir");
const changedDish = dishes.find(d2 => d2.slug === "tofu-arroz");
const changedSolved = d.solveDishPortion(changedDish, mealTarget, { catalog });
assert.ok(changedSolved.ok, "debe resolver porción del plato recién elegido");
const changedMeal = {
  slot_id: "almuerzo", nombre: changedDish.name, dishSlug: changedDish.slug,
  kcal: changedSolved.macros.kcal, proteina_g: changedSolved.macros.p,
  carbohidratos_g: changedSolved.macros.c, grasa_g: changedSolved.macros.f,
  ingredientes: changedSolved.ingredients,
};
const deltaKcalChanged = changedMeal.kcal - currentMeal.kcal;
const solv5 = d.solveReplacement("almuerzo", deltaKcalChanged, dayMeals, dayLog_noRebal);
assert.ok(solv5.rebalanceNeeded, "el cambio de plato debe requerir rebalanceo");
assert.ok(solv5.futureMeals.some(fm => fm.id === "merienda") && solv5.futureMeals.some(fm => fm.id === "cena"),
  "merienda y cena deben quedar como candidatas a rebalanceo");
const desayunoLocked = { slot_id: "desayuno", nombre: "Avena proteica", dishSlug: "avena-proteica", kcal: 400, proteina_g: 30, carbohidratos_g: 45, grasa_g: 12, ingredientes: [] };
const merCurrent = { slot_id: "merienda", nombre: "Yogur proteico", dishSlug: "yogur-proteico", kcal: 200, proteina_g: 15, carbohidratos_g: 20, grasa_g: 5, ingredientes: [] };
const cenaCurrent = { slot_id: "cena", nombre: "Pollo con arroz", dishSlug: "pollo-arroz", kcal: 600, proteina_g: 50, carbohidratos_g: 60, grasa_g: 15, ingredientes: [] };
const finalized = d.finalizeNutritionDay({
  prefs, dayTarget, catalog,
  slots: [
    { id: "desayuno", slot: "desayuno" },
    { id: "almuerzo", slot: "almuerzo" },
    { id: "merienda", slot: "merienda" },
    { id: "cena", slot: "cena" },
  ],
  proposal: [merCurrent, cenaCurrent],
  lockedMeals: [desayunoLocked, changedMeal],
});
assert.ok(Array.isArray(finalized.comidas) && finalized.comidas.length === 4,
  "el día cerrado debe seguir cubriendo los 4 slots");
const closedAlmuerzo = finalized.comidas.find(c => c.slot_id === "almuerzo");
assert.ok(closedAlmuerzo, "almuerzo debe seguir presente tras el cierre");
assert.equal(closedAlmuerzo.dishSlug, "tofu-arroz", "almuerzo (locked) conserva el plato recién elegido");
assert.equal(closedAlmuerzo.kcal, changedMeal.kcal, "almuerzo (locked) no se toca en el cierre global");
const closedDesayuno = finalized.comidas.find(c => c.slot_id === "desayuno");
assert.equal(closedDesayuno && closedDesayuno.kcal, 400, "desayuno (locked) no se toca en el cierre global");
const closedCena = finalized.comidas.find(c => c.slot_id === "cena");
assert.ok(closedCena && closedCena.dishSlug === "pollo-arroz", "cena conserva su plato cuando el cierre lo permite");
console.log(`  Test 10 pasado: finalizeNutritionDay() cierra el día tras el reemplazo (totales ${finalized.totals.kcal} kcal vs meta ${dayTarget.kcal} kcal)`);

console.log("validate-nutrition-replacements: todos los checks pasaron.");
