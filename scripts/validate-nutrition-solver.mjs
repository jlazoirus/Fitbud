#!/usr/bin/env node
// REQ-80 — Solver determinista de porciones nutricionales.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");

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
  { id: 101, slug: "avena-proteica-vegana", name: "Avena proteica vegana", slot: "desayuno", compatible_slots: ["desayuno"], diet_tags: ["vegano", "vegetariano", "omnivoro"] },
  { id: 102, slug: "shake-vegano", name: "Shake vegano de frutos rojos", slot: "snack", compatible_slots: ["media_manana", "merienda", "snack", "recena"], diet_tags: ["vegano", "vegetariano", "omnivoro"] },
  { id: 103, slug: "tofu-arroz", name: "Bowl de tofu con arroz", slot: "almuerzo", compatible_slots: ["almuerzo", "cena"], diet_tags: ["vegano", "vegetariano", "omnivoro"] },
  { id: 104, slug: "garbanzos-papa", name: "Garbanzos con papa y tofu", slot: "cena", compatible_slots: ["almuerzo", "cena"], diet_tags: ["vegano", "vegetariano", "omnivoro"] },
  { id: 105, slug: "yogur-proteico", name: "Yogur proteico", slot: "snack", compatible_slots: ["media_manana", "merienda", "snack", "recena"], diet_tags: ["vegetariano", "omnivoro"] },
  { id: 106, slug: "huevos-avena", name: "Huevos revueltos con avena", slot: "desayuno", compatible_slots: ["desayuno"], diet_tags: ["vegetariano", "omnivoro"] },
  { id: 107, slug: "pollo-arroz", name: "Pollo a la plancha con arroz", slot: "almuerzo", compatible_slots: ["almuerzo", "cena"], diet_tags: ["omnivoro"] },
  { id: 108, slug: "pollo-papa", name: "Pollo con papa", slot: "cena", compatible_slots: ["almuerzo", "cena"], diet_tags: ["omnivoro"] },
];

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

function line(dish_id, ingredient_id, grams) {
  return {
    dish_id,
    ingredient_id,
    grams,
    scalable: true,
    min_g: Math.max(5, Math.round(grams * 0.5)),
    max_g: Math.max(grams, Math.round(grams * 2)),
    step_g: 5,
  };
}

function assertDay(result, target, mealCount) {
  assert.equal(result.comidas.length, mealCount, `debe crear ${mealCount} comidas`);
  assert.ok(result.totals.kcal >= target.kcal * 0.85 && result.totals.kcal <= target.kcal * 1.15,
    `kcal ${result.totals.kcal} debe quedar en tolerancia de ${target.kcal}`);
  assert.ok(result.totals.p >= target.p * 0.85,
    `proteína ${result.totals.p} debe cubrir al menos 85% de ${target.p}`);
  for (const meal of result.comidas) {
    assert.ok(meal.nombre && meal.slot_id, "cada comida tiene nombre y slot");
    assert.ok(meal.ingredientes.length > 0, "cada comida tiene ingredientes");
    assert.ok(meal.ingredientes.every(i => i.gramos > 0 && i.kcal >= 0), "ingredientes con gramos y macros");
  }
}

const normalTarget = { kcal: 2000, p: 150, c: 205, f: 64 };
for (const mealCount of [2, 4, 6]) {
  const result = d.planDeterministicNutritionDay({
    dayTarget: normalTarget,
    prefs: { mealCount, mainMealIndex: Math.min(2, mealCount), diet: ["omnivoro"] },
    catalog,
  });
  assertDay(result, normalTarget, mealCount);
}

const vegan = d.planDeterministicNutritionDay({
  dayTarget: { kcal: 1900, p: 135, c: 205, f: 58 },
  prefs: { mealCount: 4, mainMealIndex: 2, diet: ["vegano"] },
  catalog,
});
assertDay(vegan, { kcal: 1900, p: 135, c: 205, f: 58 }, 4);
assert.ok(!/pollo|huevo|yogur/i.test(vegan.comidas.map(m => `${m.nombre} ${m.ingredientes.map(i => i.nombre).join(" ")}`).join(" ")),
  "perfil vegano no debe usar pollo, huevo ni yogur");

const vegetarianLunches = d.compatibleDishesForSlot("almuerzo", { diet: ["vegetariano"] }, catalog);
assert.ok(vegetarianLunches.some(x => x.name === "Bowl de tofu con arroz"), "vegetariano conserva platos compatibles");
assert.ok(!vegetarianLunches.some(x => /Pollo/i.test(x.name)), "vegetariano excluye pollo");

const highProtein = d.planDeterministicNutritionDay({
  dayTarget: { kcal: 2250, p: 190, c: 210, f: 70 },
  prefs: { mealCount: 4, mainMealIndex: 2, diet: ["omnivoro"] },
  catalog,
});
assertDay(highProtein, { kcal: 2250, p: 190, c: 210, f: 70 }, 4);

const missingSlot = d.planDeterministicNutritionDay({
  dayTarget: normalTarget,
  prefs: { mealCount: 6, mainMealIndex: 3, diet: ["omnivoro"] },
  catalog: { ...catalog, dishes: catalog.dishes.filter(dish => dish.slot !== "snack") },
});
assert.equal(missingSlot.status, "no_solution", "slot sin candidatos debe devolver no_solution");
assert.ok(missingSlot.no_solution.some(x => x.reason === "slot_without_candidates"), "no_solution debe indicar slot_without_candidates");

const kcalAuthorityCatalog = {
  ingredients: [{ id: 999, slug: "ingrediente-especial", name: "Ingrediente especial", category: "Prueba", kcal: 200, protein_g: 100, carbs_g: 0, fat_g: 0 }],
  dishes: [{ id: 999, slug: "plato-especial", name: "Plato especial", slot: "desayuno", compatible_slots: ["desayuno"], diet_tags: ["omnivoro"] }],
  dishIng: [{ dish_id: 999, ingredient_id: 999, grams: 100, scalable: false }],
};
const solved = d.solveDishPortion(kcalAuthorityCatalog.dishes[0], { kcal: 200, p: 100, c: 0, f: 0 }, { catalog: kcalAuthorityCatalog });
assert.equal(solved.macros.kcal, 200, "kcal debe venir de ingredient.kcal, no de 4/4/9");
assert.equal(solved.macros.p, 100, "proteína debe calcularse desde el ingrediente");

console.log("validate-nutrition-solver: todos los checks pasaron.");
