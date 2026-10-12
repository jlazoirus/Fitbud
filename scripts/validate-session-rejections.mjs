#!/usr/bin/env node
// REQ-169 — Los descartes de la sesión ("Otra opción", "No me gusta") no vuelven al regenerar.
// REQ-170 — Comidas propuestas fuera de catálogo no pasan como desayuno si son de almuerzo.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";
import { parseCatalog } from "./seed-catalog.mjs";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
const catalog = parseCatalog();
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const prefs = { mealCount: 4, mainMealIndex: 2, diet: ["omnivoro"] };
const target = { kcal: 1800, p: 128, c: 207, f: 51 };
const slots = d.mealSlotTargets(target, prefs);
const breakfast = slots.find(s => s.id === "desayuno");
assert.ok(breakfast, "el día de 4 comidas tiene desayuno");

function finalizeWith(proposal, extraPrefs) {
  return d.finalizeNutritionDay({ prefs: { ...prefs, ...extraPrefs }, dayTarget: target, catalog, slots, proposal });
}
function breakfastOf(out) { return out.comidas.find(m => m.slot_id === "desayuno"); }

// ── REQ-170: heurística de momento del día (por tokens, sin falsos positivos) ──
for (const heavy of ["Arroz con pollo", "Bowl de pollo con arroz al olivo", "Lomo saltado", "Ají de gallina", "Carne de res con quinua"]) {
  assert.ok(d.slotMomentTextConflict(heavy, "desayuno", prefs), `"${heavy}" no es desayuno`);
}
for (const ok of ["Tostadas con fresas y queso", "Pan con pasta de maní", "Huevos revueltos con jamón", "Avena con plátano"]) {
  assert.equal(d.slotMomentTextConflict(ok, "desayuno", prefs), "", `"${ok}" es un desayuno válido`);
}
assert.equal(d.slotMomentTextConflict("Arroz con pollo", "almuerzo", prefs), "", "en almuerzo no aplica");
for (const slot of ["desayuno", "media_manana", "merienda", "recena"]) {
  const flagged = d.compatibleDishesForSlot(slot, { ...prefs, mealCount: 5 }, catalog)
    .filter(dish => d.slotMomentTextConflict(dish.name, slot, prefs)).map(dish => dish.name);
  assert.deepEqual(flagged, [], `ningún plato del catálogo apto para ${slot} debe marcarse como contundente`);
}
assert.equal(d.slotMomentTextConflict("Arroz con pollo", "desayuno", { ...prefs, mainMealIndex: 1 }), "",
  "si el desayuno es la comida principal, se permite un plato contundente");

const arroz = catalog.ingredients.find(i => /^arroz/i.test(i.name));
const pollo = catalog.ingredients.find(i => /pechuga de pollo/i.test(i.name));
assert.ok(arroz && pollo, "el seed tiene arroz y pollo");
const heavyBreakfast = finalizeWith([{
  slot_id: "desayuno", nombre: "Arroz con pollo casero",
  ingredientes: [{ nombre: arroz.name, gramos: 180 }, { nombre: pollo.name, gramos: 120 }],
}]);
assert.ok(heavyBreakfast.diagnostics.some(x => x.slot === "desayuno" && x.reason === "slot_moment_heuristic"),
  "el desayuno contundente se diagnostica");
assert.notEqual(breakfastOf(heavyBreakfast).nombre, "Arroz con pollo casero", "y se reemplaza");
assert.ok(d.compatibleSlotsForDish(catalog.dishes.find(x => x.name === breakfastOf(heavyBreakfast).nombre)).includes("desayuno"),
  "el reemplazo es un plato de desayuno del catálogo");
console.log("  REQ-170: desayuno contundente fuera de catálogo se reemplaza por un desayuno real");

// ── REQ-169: un nombre descartado no vuelve, esté o no en el catálogo ──────────
const avena = catalog.ingredients.find(i => /^avena/i.test(i.name));
const invented = { slot_id: "desayuno", nombre: "Avena cremosa de la abuela", ingredientes: [{ nombre: avena.name, gramos: 70 }] };
assert.equal(breakfastOf(finalizeWith([invented])).nombre, invented.nombre, "sin descarte, la propuesta se conserva");
const rejected = finalizeWith([invented], { blockedDishes: [{ key: "avena_cremosa_de_la_abuela", name: invented.nombre }] });
assert.ok(rejected.diagnostics.some(x => x.reason === "dish_blocked_by_user"), "el descarte se diagnostica");
assert.notEqual(breakfastOf(rejected).nombre, invented.nombre, "la propuesta descartada se reemplaza");

const catalogBreakfast = d.compatibleDishesForSlot("desayuno", prefs, catalog)[0];
const rejectedCatalog = finalizeWith([], { blockedDishes: [{ key: d.dishBlockKey(catalogBreakfast), name: catalogBreakfast.name }] });
assert.notEqual(breakfastOf(rejectedCatalog).nombre, catalogBreakfast.name, "el fallback determinista tampoco lo usa");
console.log("  REQ-169: descartes bloquean propuestas inventadas y platos del catálogo");

// ── Cableado en index.html ────────────────────────────────────────────────────
const fn = name => {
  const i = html.indexOf(`function ${name}(`);
  assert.ok(i >= 0, `${name} debe existir`);
  return html.slice(i, html.indexOf("\n}\n", i));
};
const gen = fn("generateOneDay");
assert.ok(gen.includes("prefsWithSessionRejections("), "generateOneDay usa los descartes de la sesión");
assert.ok(gen.includes("coachRejectedMealsLine(ds)"), "el prompt del día lista los descartes");
assert.ok(gen.includes("rejectionScope("), "la reutilización de respuestas separa por descartes");
assert.ok(/±50 kcal de \$\{target\.kcal\}/.test(gen), "el prompt pide cerrar el día a ±50 kcal (REQ-171)");
const regen = fn("regenerateGenMeal");
assert.ok(regen.includes("rememberRejectedMeal(draft.ds"), "Otra opción descarta la comida reemplazada");
assert.ok(regen.includes("coachRejectedMealsLine(draft.ds)"), "y la lista en el prompt");
assert.ok(regen.includes("slotMomentTextConflict"), "y rechaza platos contundentes para el momento");
const blockDraft = fn("blockGenDraftMeal");
assert.ok(blockDraft.includes("rememberRejectedMeal(draft.ds"), "No me gusta en el borrador descarta en la sesión");
assert.ok(blockDraft.includes("finalizeDayWithGate("), "y reemplaza el plato del borrador al instante");
assert.ok(fn("deterministicDayPayload").includes("prefsWithSessionRejections("), "el fallback determinista evita descartes");
assert.ok(/desayuno:"[^"]*NUNCA platos contundentes como arroz con pollo, lomo, guisos/.test(html), "arquetipo de desayuno reforzado");
console.log("  Cableado: prompt, reutilización, Otra opción, No me gusta y fallback");

console.log("validate-session-rejections: OK");
