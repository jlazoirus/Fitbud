#!/usr/bin/env node
// REQ-82 — Validador de snapshot nutritionPlan en plan_versions.snapshot.nutritionPlan.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../domain-contracts.js";

const dc = globalThis.FITBUD_DOMAIN_CONTRACTS;
assert.ok(dc, "FITBUD_DOMAIN_CONTRACTS debe existir");
assert.ok(typeof dc.validateNutritionPlanSnapshot === "function", "validateNutritionPlanSnapshot debe existir");

const { validateNutritionPlanSnapshot } = dc;

// ── Snapshot mínimo válido ────────────────────────────────────────────────────
const validSnapshot = {
  version: 1,
  catalogVersion: 42,
  createdAt: "2026-06-30T03:00:00.000Z",
  days: [
    {
      date: "2026-06-30",
      target: { kcal: 2000, p: 150, c: 200, f: 65 },
      meals: [
        {
          id: "desayuno", slot: "desayuno",
          dishSlug: "avena-proteica", dishName: "Avena proteica", dishId: 101,
          ingredients: [
            { ingredientSlug: "avena", name: "Avena", grams: 80, kcal: 311, protein_g: 10, carbs_g: 53, fat_g: 6 },
            { ingredientSlug: "proteina-en-polvo", name: "Proteína en polvo", grams: 30, kcal: 113, protein_g: 24, carbs_g: 2, fat_g: 2 },
          ],
          macros: { kcal: 424, p: 34, c: 55, f: 8 },
        },
        {
          id: "almuerzo", slot: "almuerzo",
          dishSlug: "pollo-arroz", dishName: "Pollo con arroz", dishId: 107,
          ingredients: [
            { ingredientSlug: "pechuga-de-pollo", name: "Pechuga de pollo", grams: 200, kcal: 330, protein_g: 62, carbs_g: 0, fat_g: 7 },
            { ingredientSlug: "arroz-cocido", name: "Arroz cocido", grams: 200, kcal: 260, protein_g: 5, carbs_g: 56, fat_g: 1 },
          ],
          macros: { kcal: 590, p: 67, c: 56, f: 8 },
        },
        {
          id: "cena", slot: "cena",
          dishSlug: "garbanzos-verdura", dishName: "Garbanzos con verdura",
          ingredients: [
            { ingredientSlug: "garbanzos-cocidos", name: "Garbanzos cocidos", grams: 300, kcal: 492, protein_g: 27, carbs_g: 81, fat_g: 8 },
          ],
          macros: { kcal: 492, p: 27, c: 81, f: 8 },
        },
        {
          id: "merienda", slot: "merienda",
          dishSlug: "yogur-proteico", dishName: "Yogur proteico",
          ingredients: [
            { ingredientSlug: "yogur-griego", name: "Yogur griego", grams: 250, kcal: 150, protein_g: 25, carbs_g: 9, fat_g: 1 },
          ],
          macros: { kcal: 150, p: 25, c: 9, f: 1 },
        },
      ],
    },
  ],
  shoppingList: [
    { slug: "pechuga-de-pollo", nombre: "Pechuga de pollo", gramos: 200 },
    { slug: "arroz-cocido", nombre: "Arroz cocido", gramos: 200 },
    { slug: "garbanzos-cocidos", nombre: "Garbanzos cocidos", gramos: 300 },
    { slug: "avena", nombre: "Avena", gramos: 80 },
    { slug: "yogur-griego", nombre: "Yogur griego", gramos: 250 },
    { slug: "proteina-en-polvo", nombre: "Proteína en polvo", gramos: 30 },
  ],
};

// ── Test 1: snapshot válido pasa ──────────────────────────────────────────────
const r1 = validateNutritionPlanSnapshot(validSnapshot);
assert.ok(r1.ok, `snapshot válido debe pasar: ${r1.errors.join(", ")}`);
console.log("  Test 1 pasado: snapshot válido pasa sin errores");

// ── Test 2: falta nutritionPlan.days falla ────────────────────────────────────
const r2 = validateNutritionPlanSnapshot({ version: 1, days: [] });
assert.ok(!r2.ok, "days vacío debe fallar");
assert.ok(r2.errors.some(e => /days/.test(e)), "error debe mencionar days");
console.log("  Test 2 pasado: days vacío detectado");

// ── Test 3: comida sin dishName ni dishSlug falla ─────────────────────────────
const bad3 = JSON.parse(JSON.stringify(validSnapshot));
delete bad3.days[0].meals[0].dishName;
delete bad3.days[0].meals[0].dishSlug;
const r3 = validateNutritionPlanSnapshot(bad3);
assert.ok(!r3.ok, "comida sin dishName/dishSlug debe fallar");
assert.ok(r3.errors.some(e => /dishName|dishSlug/.test(e)), "error debe mencionar dishName o dishSlug");
console.log("  Test 3 pasado: comida sin nombre materializado detectada");

// ── Test 4: macros faltantes en comida falla ──────────────────────────────────
const bad4 = JSON.parse(JSON.stringify(validSnapshot));
delete bad4.days[0].meals[0].macros;
const r4 = validateNutritionPlanSnapshot(bad4);
assert.ok(!r4.ok, "macros ausentes deben fallar");
assert.ok(r4.errors.some(e => /macros/.test(e)), "error debe mencionar macros");
console.log("  Test 4 pasado: macros ausentes detectados");

// ── Test 5: ingrediente con grams=0 falla ────────────────────────────────────
const bad5 = JSON.parse(JSON.stringify(validSnapshot));
bad5.days[0].meals[0].ingredients[0].grams = 0;
const r5 = validateNutritionPlanSnapshot(bad5);
assert.ok(!r5.ok, "ingrediente con grams=0 debe fallar");
assert.ok(r5.errors.some(e => /grams/.test(e)), "error debe mencionar grams");
console.log("  Test 5 pasado: ingrediente con grams=0 detectado");

// ── Test 6: suma kcal fuera de tolerancia (>20%) falla ───────────────────────
const bad6 = JSON.parse(JSON.stringify(validSnapshot));
// Target=2000, suma real≈1656 → ≈17% → dentro de tolerancia
// Forzar macro absurdo para superar 20%
bad6.days[0].target = { kcal: 3000, p: 200, c: 300, f: 100 };
const r6 = validateNutritionPlanSnapshot(bad6);
// 1656 kcal vs 3000 target → 44.8% fuera de tolerancia
assert.ok(!r6.ok, "suma kcal muy alejada del target debe fallar");
assert.ok(r6.errors.some(e => /tolerancia/.test(e)), "error debe mencionar tolerancia");
console.log("  Test 6 pasado: suma kcal fuera de tolerancia detectada");

// ── Test 7: shoppingList con slug duplicado falla ─────────────────────────────
const bad7 = JSON.parse(JSON.stringify(validSnapshot));
bad7.shoppingList.push({ slug: "avena", nombre: "Avena (extra)", gramos: 50 });
const r7 = validateNutritionPlanSnapshot(bad7);
assert.ok(!r7.ok, "slug duplicado en shoppingList debe fallar");
assert.ok(r7.errors.some(e => /duplicado/.test(e)), "error debe mencionar duplicado");
console.log("  Test 7 pasado: slug duplicado en shoppingList detectado");

// ── Test 8: snapshot de 7 días generado por planNutritionWeek también pasa ───
import "../js/nutrition-domain.js";
const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d && d.planNutritionWeek, "planNutritionWeek debe existir");

const ingredients = [
  { id: 1, slug: "proteina-en-polvo", name: "Proteína en polvo", category: "Proteína", kcal: 375, protein_g: 80, carbs_g: 8, fat_g: 5 },
  { id: 3, slug: "avena", name: "Avena", category: "Cereal", kcal: 389, protein_g: 13, carbs_g: 66, fat_g: 7 },
  { id: 6, slug: "frutos-rojos", name: "Frutos rojos", category: "Fruta", kcal: 50, protein_g: 1, carbs_g: 12, fat_g: 0.3 },
  { id: 9, slug: "pechuga-de-pollo", name: "Pechuga de pollo", category: "Proteína animal", kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { id: 4, slug: "arroz-cocido", name: "Arroz cocido", category: "Cereal", kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { id: 5, slug: "aceite-de-oliva", name: "Aceite de oliva", category: "Grasa", kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },
  { id: 8, slug: "yogur-griego", name: "Yogur griego natural 0%", category: "Lácteo", kcal: 60, protein_g: 10, carbs_g: 3.6, fat_g: 0.4 },
  { id: 7, slug: "garbanzos-cocidos", name: "Garbanzos cocidos", category: "Legumbre", kcal: 164, protein_g: 9, carbs_g: 27, fat_g: 2.6 },
  { id: 11, slug: "papa", name: "Papa", category: "Verdura", kcal: 77, protein_g: 2, carbs_g: 17, fat_g: 0.1 },
];
const dishes = [
  { id: 101, slug: "avena-proteica", name: "Avena proteica", slot: "desayuno", compatible_slots: ["desayuno"], diet_tags: ["omnivoro"] },
  { id: 107, slug: "pollo-arroz", name: "Pollo con arroz", slot: "almuerzo", compatible_slots: ["almuerzo", "cena"], diet_tags: ["omnivoro"] },
  { id: 108, slug: "pollo-papa", name: "Pollo con papa", slot: "cena", compatible_slots: ["almuerzo", "cena"], diet_tags: ["omnivoro"] },
  { id: 105, slug: "yogur-proteico", name: "Yogur proteico", slot: "snack", compatible_slots: ["media_manana", "merienda", "snack"], diet_tags: ["omnivoro"] },
];
function line(did, iid, g) { return { dish_id: did, ingredient_id: iid, grams: g, scalable: true, min_g: Math.max(5, Math.round(g * 0.5)), max_g: Math.max(g, Math.round(g * 2)), step_g: 5 }; }
const dishIng = [
  line(101, 1, 40), line(101, 3, 60), line(101, 6, 80),
  line(107, 9, 180), line(107, 4, 200), line(107, 5, 8),
  line(108, 9, 160), line(108, 11, 250), line(108, 5, 8),
  line(105, 8, 200), line(105, 1, 30),
];
const catalog = { ingredients, dishes, dishIng };
const weekResult = d.planNutritionWeek({ dayTarget: { kcal: 2000, p: 150, c: 200, f: 65 }, prefs: { mealCount: 4, mainMealIndex: 2, diet: ["omnivoro"] }, catalog });

// Simular buildNutritionPlanSnapshot con los datos del planner
const daysData = weekResult.days.map((day, i) => ({
  ds: `2026-07-0${i + 1}`,
  comidas: day.comidas,
}));
// Construir snapshot manualmente (misma lógica que buildNutritionPlanSnapshot en index.html)
const syntheticSnapshot = {
  version: 1, catalogVersion: dishIng.length, createdAt: new Date().toISOString(),
  days: daysData.map(d2 => ({
    date: d2.ds,
    target: { kcal: 2000, p: 150, c: 200, f: 65 },
    meals: (d2.comidas || []).map(c => ({
      id: c.slot_id, slot: c.slot_id, dishSlug: c.dishSlug || null, dishName: c.nombre || "",
      ingredients: (c.ingredientes || []).map(ing => ({
        ingredientSlug: ing.ingredientSlug || null, name: ing.nombre || "",
        grams: ing.gramos || 0, kcal: ing.kcal || 0,
        protein_g: ing.proteina_g || 0, carbs_g: ing.carbohidratos_g || 0, fat_g: ing.grasa_g || 0,
      })),
      macros: { kcal: c.kcal || 0, p: c.proteina_g || 0, c: c.carbohidratos_g || 0, f: c.grasa_g || 0 },
    })),
  })),
  shoppingList: weekResult.shoppingList.map(i => ({ slug: i.slug, nombre: i.nombre, gramos: i.gramos })),
};
const r8 = validateNutritionPlanSnapshot(syntheticSnapshot);
assert.ok(r8.ok, `snapshot de 7 días del planner debe pasar: ${r8.errors.join(", ")}`);
console.log("  Test 8 pasado: snapshot de 7 días generado por planNutritionWeek es válido");

console.log("validate-nutrition-plan-snapshot: todos los checks pasaron.");
