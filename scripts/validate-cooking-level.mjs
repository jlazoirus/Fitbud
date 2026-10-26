#!/usr/bin/env node
// REQ-254 — "¿Cuánto cocinas?": cada plato tiene nivel (none/basic/cook), la
// migración y el seed coinciden, el plan no propone platos por encima del nivel
// elegido, relaja un nivel con aviso si una franja queda vacía, y con
// "No cocino" el plan sigue cuadrando en planes de 4 y 6 comidas.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";
import { parseCatalog, parseCookingLevels } from "./seed-catalog.mjs";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
const ORDER = ["none", "basic", "cook"];
const catalog = parseCatalog();
const levels = parseCookingLevels();
const sql = readFileSync(new URL("../supabase/cooking_level.sql", import.meta.url), "utf8");
const seed = readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8");
const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

// 1. Clasificación completa y coherente con el seed.
const unclassified = catalog.dishes.filter((x) => !levels.has(x.name)).map((x) => x.name);
assert.deepEqual(unclassified, [], `Platos sin nivel de cocina: ${unclassified.join(", ")}`);
const unknown = [...levels.keys()].filter((name) => !catalog.dishes.some((x) => x.name === name));
assert.deepEqual(unknown, [], `cooking_level.sql clasifica platos que no están en seed.sql: ${unknown.join(", ")}`);
assert.ok(/cooking_level text check \(cooking_level is null or cooking_level in \('none','basic','cook'\)\)/.test(schema), "schema.sql declara dishes.cooking_level con vocabulario");
assert.ok(/alter table dishes add column if not exists cooking_level text/.test(sql), "la migración agrega la columna de forma idempotente");
assert.ok(/where not exists \(select 1 from dishes d where d.name = v.name\)/.test(sql), "los platos nuevos se insertan sin duplicar");
console.log(`  ${levels.size} platos clasificados: ${ORDER.map((l) => `${l}=${[...levels.values()].filter((v) => v.level === l).length}`).join(" · ")}`);

// 2. Los platos nuevos de la migración son idénticos a los del seed (nombre, slot y receta).
const block = (text, start, end) => text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)));
const migDishes = [...block(sql, "insert into dishes", "insert into dish_ingredients").matchAll(/\('((?:[^']|'')*)','(\w+)'\)/g)].map((m) => [m[1], m[2]]);
assert.ok(migDishes.length >= 10, "la migración trae los platos nuevos");
migDishes.forEach(([name, slot]) => {
  const dish = catalog.dishes.find((x) => x.name === name.replace(/''/g, "'"));
  assert.ok(dish, `plato nuevo ausente en seed.sql: ${name}`);
  assert.equal(dish.slot, slot, `slot distinto para ${name}`);
  assert.ok(["none", "basic"].includes(levels.get(dish.name).level), `${name} debe ser sin cocinar o básico`);
});
const migLines = [...block(sql, "insert into dish_ingredients", "-- ---------- Clasificación").matchAll(/\('((?:[^']|'')*)','((?:[^']|'')*)',([\d.]+)\)/g)].map((m) => m.slice(1).join("|"));
const seedLines = new Set([...block(seed, "insert into dish_ingredients", "-- ---------- DIETAS").matchAll(/\('((?:[^']|'')*)','((?:[^']|'')*)',\s*([\d.]+)\)/g)].map((m) => m.slice(1).join("|")));
migLines.forEach((line) => assert.ok(seedLines.has(line), `receta de la migración distinta al seed: ${line}`));
const migIngredients = [...block(sql, "insert into ingredients", "where not exists (select 1 from ingredients").matchAll(/\('((?:[^']|'')*)','/g)].map((m) => m[1]);
migIngredients.forEach((name) => assert.ok(catalog.ingredients.some((i) => i.name === name), `ingrediente nuevo ausente en seed.sql: ${name}`));
console.log(`  ${migDishes.length} platos y ${migIngredients.length} ingrediente(s) nuevos idénticos en seed y migración`);

// 3. Con "No cocino" hay opciones en cada franja para cada dieta (4 comidas).
for (const diet of ["omnivoro", "vegetariano", "vegano"]) {
  for (const slot of ["desayuno", "almuerzo", "snack", "cena"]) {
    const n = d.compatibleDishesForSlot(slot, { mealCount: 4, diet: [diet], cookingLevel: "none" }, catalog).length;
    assert.ok(n >= 2, `"No cocino" + ${diet}: ${slot} tiene ${n} opciones`);
  }
}
const lunchNone = d.compatibleDishesForSlot("almuerzo", { diet: ["omnivoro"], cookingLevel: "none" }, catalog);
assert.ok(lunchNone.every((x) => x.cooking_level === "none"), "el filtro no deja pasar platos que piden cocinar");
assert.ok(!lunchNone.some((x) => /Tacos de frijol negro y queso fresco/.test(x.name)), "el caso de Diego (tacos con frijol) no aparece con No cocino");
assert.equal(d.compatibleDishesForSlot("almuerzo", { diet: ["omnivoro"] }, catalog).length,
  d.compatibleDishesForSlot("almuerzo", { diet: ["omnivoro"], cookingLevel: "cook" }, catalog).length, "sin preferencia o con cook no se filtra");
console.log("  Cada franja tiene opciones sin cocinar para omnívoro, vegetariano y vegano");

// 4. Un plato sin clasificar no se excluye (catálogo sin la migración).
assert.equal(d.dishAllowedForCookingLevel({ name: "x" }, "none"), true);
assert.equal(d.dishAllowedForCookingLevel({ cooking_level: "cook" }, "basic"), false);
assert.equal(d.dishAllowedForCookingLevel({ cooking_level: "basic" }, "basic"), true);

// 5. Relajación con aviso cuando una franja no tiene nada al nivel elegido.
const onlyCookDinners = { ...catalog, dishes: catalog.dishes.filter((x) => x.slot !== "cena" || x.cooking_level === "cook") };
const relaxed = d.planDeterministicNutritionDay({ prefs: { mealCount: 4, diet: ["omnivoro"], cookingLevel: "none" }, dayTarget: { kcal: 2000, p: 150, c: 205, f: 64 }, catalog: onlyCookDinners, date: "2026-07-06" });
const warn = relaxed.cookingWarns.find((w) => w.slot_id === "cena");
assert.ok(warn && warn.to === "cook", "la cena sube de nivel y se avisa");
assert.match(warn.message, /Hoy no encontramos algo más simple para la cena/);
assert.ok(relaxed.comidas.some((c) => c.slot_id === "cena"), "la cena no queda vacía");
const finalized = d.finalizeNutritionDay({ prefs: { mealCount: 4, diet: ["omnivoro"], cookingLevel: "none" }, dayTarget: { kcal: 2000, p: 150, c: 205, f: 64 }, catalog: onlyCookDinners, date: "2026-07-06" });
assert.ok((finalized.cookingWarns || []).some((w) => w.slot_id === "cena"), "el aviso llega al día finalizado");
console.log("  Si una franja queda vacía se relaja un nivel y se avisa");

// 6. Una propuesta del coach con un plato por encima del nivel se descarta.
const cookLunch = catalog.dishes.find((x) => x.slot === "almuerzo" && x.cooking_level === "cook");
const withProposal = d.finalizeNutritionDay({
  prefs: { mealCount: 4, diet: ["omnivoro"], cookingLevel: "none" },
  dayTarget: { kcal: 2000, p: 150, c: 205, f: 64 }, catalog, date: "2026-07-06",
  proposal: [{ slot_id: "almuerzo", nombre: cookLunch.name, ingredientes: [] }],
});
assert.ok(withProposal.diagnostics.some((x) => x.reason === "dish_cooking_level"), "la propuesta queda diagnosticada");
assert.ok(withProposal.comidas.every((c) => c.dishSlug !== cookLunch.slug), "y no entra al día");
console.log("  Las propuestas por encima del nivel se descartan");

// 7. Con "No cocino" el plan cuadra en 4 y 6 comidas y nunca usa platos que piden cocinar.
const TARGETS = { normal: { kcal: 2000, p: 150, c: 205, f: 64 }, alta_proteina: { kcal: 2250, p: 190, c: 215, f: 70 } };
const bySlug = new Map(catalog.dishes.map((x) => [x.slug, x]));
let ok = 0, total = 0, above = 0;
for (const mealCount of [4, 6]) for (const diet of ["omnivoro", "vegetariano", "vegano"]) for (const dayTarget of Object.values(TARGETS)) for (const dis of ["", "tofu", "yogur"]) {
  const prefs = { mealCount, mainMealIndex: 2, diet: [diet], dislikedIngredients: dis, cookingLevel: "none" };
  let prev = new Set(); const recent = new Set();
  for (let i = 0; i < 7; i++) {
    const day = d.finalizeNutritionDay({ prefs, dayTarget, catalog, date: `2026-07-06+${i}`, prevDayUsed: prev, recentUsed: recent });
    prev = new Set((day.comidas || []).map((c) => c.dishSlug || "").filter(Boolean)); prev.forEach((x) => recent.add(x));
    total++; if (day.ok && day.contract && day.contract.ok) ok++;
    (day.comidas || []).forEach((c) => { const dish = bySlug.get(c.dishSlug); if (dish && dish.cooking_level !== "none") above++; });
  }
}
assert.equal(above, 0, `"No cocino" recibió ${above} platos que piden cocinar`);
assert.ok(ok / total >= 0.9, `"No cocino" cuadra solo ${ok}/${total} días con 4 y 6 comidas`);
console.log(`  "No cocino": ${ok}/${total} días cuadran con 4 y 6 comidas; 0 platos que piden cocinar`);

console.log("validate-cooking-level: OK");
