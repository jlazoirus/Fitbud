#!/usr/bin/env node
// REQ-81 — Planner semanal nutricional determinista y lista de compras derivada.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");
assert.ok(typeof d.planNutritionWeek === "function", "planNutritionWeek debe existir");
assert.ok(typeof d.scoreWeeklyVariety === "function", "scoreWeeklyVariety debe existir");
assert.ok(typeof d.buildShoppingListFromNutritionPlan === "function", "buildShoppingListFromNutritionPlan debe existir");

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
  { id: 101, slug: "avena-proteica-vegana", name: "Avena proteica vegana", slot: "desayuno", compatible_slots: ["desayuno"], diet_tags: ["vegano", "vegetariano", "omnivoro"] },
  { id: 102, slug: "shake-vegano", name: "Shake vegano de frutos rojos", slot: "snack", compatible_slots: ["media_manana", "merienda", "snack", "recena"], diet_tags: ["vegano", "vegetariano", "omnivoro"] },
  { id: 103, slug: "tofu-arroz", name: "Bowl de tofu con arroz", slot: "almuerzo", compatible_slots: ["almuerzo", "cena"], diet_tags: ["vegano", "vegetariano", "omnivoro"] },
  { id: 104, slug: "garbanzos-papa", name: "Garbanzos con papa y tofu", slot: "cena", compatible_slots: ["almuerzo", "cena"], diet_tags: ["vegano", "vegetariano", "omnivoro"] },
  { id: 105, slug: "yogur-proteico", name: "Yogur proteico", slot: "snack", compatible_slots: ["media_manana", "merienda", "snack", "recena"], diet_tags: ["vegetariano", "omnivoro"] },
  { id: 106, slug: "huevos-avena", name: "Huevos revueltos con avena", slot: "desayuno", compatible_slots: ["desayuno"], diet_tags: ["vegetariano", "omnivoro"] },
  { id: 107, slug: "pollo-arroz", name: "Pollo a la plancha con arroz", slot: "almuerzo", compatible_slots: ["almuerzo", "cena"], diet_tags: ["omnivoro"] },
  { id: 108, slug: "pollo-papa", name: "Pollo con papa", slot: "cena", compatible_slots: ["almuerzo", "cena"], diet_tags: ["omnivoro"] },
];

function line(dish_id, ingredient_id, grams) {
  return { dish_id, ingredient_id, grams, scalable: true, min_g: Math.max(5, Math.round(grams * 0.5)), max_g: Math.max(grams, Math.round(grams * 2)), step_g: 5 };
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
const target = { kcal: 2000, p: 150, c: 205, f: 64 };
const prefs4 = { mealCount: 4, mainMealIndex: 2, diet: ["omnivoro"] };

// ── Test 1: genera exactamente 7 días ────────────────────────────────────────
const week = d.planNutritionWeek({ dayTarget: target, prefs: prefs4, catalog });
assert.equal(week.days.length, 7, "planNutritionWeek debe generar 7 días");
assert.ok(typeof week.weekSummary === "object", "debe incluir weekSummary");
assert.ok(typeof week.weekSummary.avgKcal === "number", "weekSummary.avgKcal debe ser número");
assert.ok(typeof week.weekSummary.avgProt === "number", "weekSummary.avgProt debe ser número");
console.log(`  Semana: avgKcal=${week.weekSummary.avgKcal} avgProt=${week.weekSummary.avgProt}`);

// ── Test 2: cada día tiene sus comidas y totales en tolerancia (±15%) ─────────
week.days.forEach((day, i) => {
  assert.ok(Array.isArray(day.comidas) && day.comidas.length > 0, `día ${i} debe tener comidas`);
  assert.ok(day.totals && day.totals.kcal > 0, `día ${i} debe tener totals.kcal`);
  const pct = Math.abs(day.totals.kcal - target.kcal) / target.kcal;
  assert.ok(pct <= 0.15, `día ${i}: kcal ${day.totals.kcal} fuera de tolerancia 15% de ${target.kcal} (${(pct*100).toFixed(1)}%)`);
  assert.ok(day.totals.p >= target.p * 0.85, `día ${i}: proteína ${day.totals.p} debe cubrir al menos 85% de ${target.p}`);
});
console.log("  Test 2 pasado: 7 días en tolerancia de kcal y proteína");

// ── Test 3: lista de compras coincide con ingredientes de los 7 días ──────────
const shopping = week.shoppingList;
assert.ok(Array.isArray(shopping) && shopping.length > 0, "shoppingList debe ser un array no vacío");

// Sumar gramos manuales por slug desde los días
const manualTotals = new Map();
week.days.forEach(day => {
  day.comidas.forEach(c => {
    (c.ingredientes || []).forEach(ing => {
      const slug = (ing.ingredientSlug || "").trim() || (ing.nombre || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (!slug) return;
      manualTotals.set(slug, (manualTotals.get(slug) || 0) + Math.round(Number(ing.gramos || 0)));
    });
  });
});

// Verificar que la lista de compras tenga los mismos slugs y gramos
shopping.forEach(item => {
  const manual = manualTotals.get(item.slug) || 0;
  assert.equal(item.gramos, manual,
    `shoppingList slug="${item.slug}": lista=${item.gramos}g vs suma manual=${manual}g`);
});
// Verificar que no falte ningún slug de los días
manualTotals.forEach((grams, slug) => {
  const inList = shopping.find(s => s.slug === slug);
  assert.ok(inList, `ingrediente slug="${slug}" (${grams}g) falta en la lista de compras`);
});
console.log(`  Test 3 pasado: lista de compras tiene ${shopping.length} ingredientes y suma correcta`);

// ── Test 4: no duplica ingredientes por nombre distinto si comparten slug ─────
const slugCounts = new Map();
shopping.forEach(item => slugCounts.set(item.slug, (slugCounts.get(item.slug) || 0) + 1));
slugCounts.forEach((count, slug) => {
  assert.equal(count, 1, `slug "${slug}" aparece ${count} veces en la lista de compras (debe ser 1)`);
});
console.log("  Test 4 pasado: sin duplicados por slug en lista de compras");

// ── Test 5: restricciones duras respetadas en todos los días (vegano) ─────────
const veganWeek = d.planNutritionWeek({
  dayTarget: { kcal: 1900, p: 135, c: 200, f: 58 },
  prefs: { mealCount: 4, mainMealIndex: 2, diet: ["vegano"] },
  catalog,
});
const forbidden = ["pollo", "huevo", "yogur", "pechuga"];
veganWeek.days.forEach((day, i) => {
  day.comidas.forEach(c => {
    const text = `${c.nombre} ${(c.ingredientes || []).map(g => g.nombre).join(" ")}`.toLowerCase();
    forbidden.forEach(term => {
      assert.ok(!text.includes(term), `día vegano ${i} contiene término prohibido "${term}": "${text}"`);
    });
  });
});
console.log("  Test 5 pasado: restricciones veganas respetadas en los 7 días");

// ── Test 6: scoreWeeklyVariety identifica repetición consecutiva ──────────────
// Crear días artificiales con repetición y sin repetición
const repeated = Array.from({ length: 4 }, () => ({
  comidas: [{ slot_id: "desayuno", dishSlug: "avena-proteica-vegana", nombre: "Avena proteica vegana", ingredientes: [] }]
}));
const variety = d.scoreWeeklyVariety(repeated);
assert.ok(variety.warnings.some(w => w.type === "no_variety" || w.type === "consecutive"),
  "scoreWeeklyVariety debe detectar repetición en días consecutivos");
const diverse = [
  { comidas: [{ slot_id: "desayuno", dishSlug: "plato-a", ingredientes: [] }] },
  { comidas: [{ slot_id: "desayuno", dishSlug: "plato-b", ingredientes: [] }] },
  { comidas: [{ slot_id: "desayuno", dishSlug: "plato-a", ingredientes: [] }] },
];
const variety2 = d.scoreWeeklyVariety(diverse);
assert.ok(variety2.score > 0, "scoreWeeklyVariety.score debe ser > 0 con variedad");
console.log("  Test 6 pasado: scoreWeeklyVariety detecta repetición y variedad correctamente");

// ── Test 7: buildShoppingListFromNutritionPlan agrega por slug, no por nombre ─
const daysWithSameSlug = [
  { comidas: [{ ingredientes: [{ ingredientSlug: "avena", nombre: "Avena", gramos: 60 }] }] },
  { comidas: [{ ingredientes: [{ ingredientSlug: "avena", nombre: "Avena en copos", gramos: 80 }] }] },
];
const shopSlug = d.buildShoppingListFromNutritionPlan(daysWithSameSlug);
assert.equal(shopSlug.length, 1, "debe agregar ingredientes con mismo slug aunque tengan nombre distinto");
assert.equal(shopSlug[0].gramos, 140, "debe sumar correctamente los gramos");
assert.equal(shopSlug[0].slug, "avena", "debe conservar el slug como clave");
console.log("  Test 7 pasado: buildShoppingListFromNutritionPlan agrega por slug correctamente");

// ── Test 8: conteo de días configurable ─────────────────────────────────────
const week5 = d.planNutritionWeek({ dayTarget: target, prefs: prefs4, catalog, numDays: 5 });
assert.equal(week5.days.length, 5, "numDays=5 debe generar exactamente 5 días");
console.log("  Test 8 pasado: numDays configurable");

console.log("validate-nutrition-week-planner: todos los checks pasaron.");
