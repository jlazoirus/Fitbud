#!/usr/bin/env node
// Variedad de sugerencias de comida:
// 1) dos usuarios con las mismas metas no reciben el mismo plan (varietySeed),
//    y el mismo usuario recibe el mismo plan para la misma fecha;
// 2) una cocina no elegida no se repite dentro del mismo día si hay alternativa;
// 3) las claves de cocina del perfil (CUISINE_LABELS) llegan al solver.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";
import { parseCatalog } from "./seed-catalog.mjs";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");

// ── 1. Planes distintos por usuario, estables por usuario ────────────────────
const seedCatalog = parseCatalog();
const target = { kcal: 2000, p: 150, c: 205, f: 64 };
const prefs = { mealCount: 4, diet: ["omnivoro"] };
function weekFor(varietySeed) {
  return d.planNutritionWeek({ prefs, dayTarget: target, catalog: seedCatalog, startDate: "2026-10-19", varietySeed })
    .days.flatMap(day => day.comidas.map(c => c.dishSlug));
}
const users = ["user-a", "user-b", "user-c", "user-d"].map(weekFor);
users.forEach(week => assert.equal(week.length, 28, "cada semana debe cubrir 7 días x 4 comidas"));
for (let a = 0; a < users.length; a++) {
  for (let b = a + 1; b < users.length; b++) {
    const same = users[a].filter((slug, i) => slug === users[b][i]).length;
    assert.ok(same < users[a].length * 0.6,
      `usuarios ${a} y ${b} no deben compartir la mayoría del plan (${same}/${users[a].length} iguales)`);
  }
}
assert.deepEqual(weekFor("user-a"), users[0], "el mismo usuario debe recibir el mismo plan para la misma semana");

// ── 2. Una cocina no elegida no domina el día ─────────────────────────────────
const ingredients = [
  { id: 1, slug: "pechuga-de-pollo", name: "Pechuga de pollo", kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { id: 2, slug: "arroz-cocido", name: "Arroz cocido", kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { id: 3, slug: "aceite-de-oliva", name: "Aceite de oliva", kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },
  { id: 4, slug: "papa", name: "Papa", kcal: 77, protein_g: 2, carbs_g: 17, fat_g: 0.1 },
];
const mainSlots = ["almuerzo", "cena"];
const dishes = [
  { id: 1, slug: "tacos-de-pollo", name: "Tacos de pollo", compatible_slots: mainSlots, diet_tags: ["omnivoro"], cuisine_tags: ["mexicana"] },
  { id: 2, slug: "burrito-bowl-de-pollo", name: "Burrito bowl de pollo", compatible_slots: mainSlots, diet_tags: ["omnivoro"], cuisine_tags: ["mexicana"] },
  { id: 3, slug: "pollo-con-papa", name: "Pollo con papa", compatible_slots: mainSlots, diet_tags: ["omnivoro"], cuisine_tags: [] },
];
const line = (dish_id, ingredient_id, grams) => ({ dish_id, ingredient_id, grams, scalable: true, min_g: Math.round(grams * 0.5), max_g: grams * 2, step_g: 5 });
const dishIng = [
  line(1, 1, 180), line(1, 2, 220), line(1, 3, 8),
  line(2, 1, 180), line(2, 2, 220), line(2, 3, 8),
  line(3, 1, 180), line(3, 4, 300), line(3, 3, 8),
];
const mini = { ingredients, dishes, dishIng };
const slots = [{ id: "almuerzo", slot: "Almuerzo" }, { id: "cena", slot: "Cena" }];
const dayTarget = { kcal: 1400, p: 110, c: 140, f: 35 };
const cuisinesOf = day => day.comidas.map(c => dishes.find(x => x.slug === c.dishSlug).cuisine_tags[0] || "otra");

const neutral = d.planDeterministicNutritionDay({ prefs: { mealCount: 2, diet: ["omnivoro"] }, dayTarget, catalog: mini, slots });
assert.equal(neutral.comidas.length, 2, "el día de prueba debe cubrir 2 slots");
assert.equal(cuisinesOf(neutral).filter(t => t === "mexicana").length, 1,
  `sin preferencia, no debe haber dos comidas mexicanas el mismo día (${neutral.comidas.map(c => c.nombre).join(", ")})`);

const fan = d.planDeterministicNutritionDay({ prefs: { mealCount: 2, diet: ["omnivoro"], preferredCuisines: ["mexican"] }, dayTarget, catalog: mini, slots });
assert.deepEqual(cuisinesOf(fan), ["mexicana", "mexicana"],
  "si el usuario eligió cocina mexicana, puede repetirla en el día");

// ── 3. Claves del perfil → tags del catálogo ──────────────────────────────────
assert.deepEqual(d.preferredCuisineTags({ preferredCuisines: Object.keys(globalThis.CUISINE_LABELS || {}) }).sort(),
  ["asiatica", "criolla", "mediterranea", "mexicana"],
  "todas las cocinas que ofrece el perfil deben mapear a un tag del catálogo");

console.log("Variedad de comidas validada: planes por usuario, balance de cocina y claves de perfil.");
