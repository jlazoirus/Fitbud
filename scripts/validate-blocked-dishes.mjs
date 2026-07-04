#!/usr/bin/env node
// REQ-120 — "No me gusta este plato" bloquea el plato en generación de día/semana y reemplazos.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");
assert.ok(typeof d.dishBlockKey === "function", "dishBlockKey debe existir");
assert.ok(typeof d.isDishBlockedByProfile === "function", "isDishBlockedByProfile debe existir");
assert.ok(typeof d.compatibleDishesForSlot === "function", "compatibleDishesForSlot debe existir");
assert.ok(typeof d.planDeterministicNutritionDay === "function", "planDeterministicNutritionDay debe existir");

const ingredients = [
  { id: 1, slug: "pechuga-de-pollo", name: "Pechuga de pollo", kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { id: 2, slug: "arroz-cocido", name: "Arroz cocido", kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { id: 3, slug: "tofu-firme", name: "Tofu firme", kcal: 145, protein_g: 16, carbs_g: 3, fat_g: 9 },
  { id: 4, slug: "aceite-de-oliva", name: "Aceite de oliva", kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },
];
const dishes = [
  { id: 101, slug: "pollo-con-arroz", name: "Pollo con arroz", compatible_slots: ["almuerzo", "cena"], diet_tags: ["omnivoro"] },
  { id: 102, slug: "tofu-salteado", name: "Tofu salteado", compatible_slots: ["almuerzo", "cena"], diet_tags: ["vegano", "vegetariano", "omnivoro"] },
];
function line(did, iid, g) {
  return { dish_id: did, ingredient_id: iid, grams: g, scalable: true, min_g: Math.max(5, Math.round(g * 0.5)), max_g: Math.max(g, Math.round(g * 2)), step_g: 5 };
}
const dishIng = [
  line(101, 1, 180), line(101, 2, 220), line(101, 4, 8),
  line(102, 3, 250), line(102, 2, 180), line(102, 4, 8),
];
const catalog = { ingredients, dishes, dishIng };
const dayTarget = { kcal: 2000, p: 150, c: 205, f: 64 };

// ── Test 1: dishBlockKey usa dish.slug cuando existe, si no coachKey(name) ───
assert.equal(d.dishBlockKey(dishes[0]), "pollo-con-arroz", "debe usar dish.slug");
assert.equal(d.dishBlockKey({ name: "Plato Sin Slug" }), "plato_sin_slug", "sin slug cae a coachKey(name)");
console.log("  Test 1 pasado: dishBlockKey prioriza slug y cae a coachKey(name)");

// ── Test 2: isDishBlockedByProfile detecta coincidencia por key ─────────────
const prefsBlocked = { diet: ["omnivoro"], blockedDishes: [{ key: "pollo-con-arroz", name: "Pollo con arroz" }] };
assert.equal(d.isDishBlockedByProfile(dishes[0], prefsBlocked), true, "plato bloqueado debe detectarse");
assert.equal(d.isDishBlockedByProfile(dishes[1], prefsBlocked), false, "plato no bloqueado no debe marcarse");
assert.equal(d.isDishBlockedByProfile(dishes[0], { diet: ["omnivoro"] }), false, "sin blockedDishes, nada se bloquea");
console.log("  Test 2 pasado: isDishBlockedByProfile distingue platos bloqueados de no bloqueados");

// ── Test 3: compatibleDishesForSlot excluye el plato bloqueado ──────────────
const compatUnblocked = d.compatibleDishesForSlot("almuerzo", { diet: ["omnivoro"] }, catalog);
assert.ok(compatUnblocked.some(dish => dish.slug === "pollo-con-arroz"), "sin bloqueo, el plato debe estar disponible");
const compatBlocked = d.compatibleDishesForSlot("almuerzo", prefsBlocked, catalog);
assert.ok(!compatBlocked.some(dish => dish.slug === "pollo-con-arroz"), "bloqueado, el plato no debe estar disponible");
assert.ok(compatBlocked.some(dish => dish.slug === "tofu-salteado"), "el resto del catálogo sigue disponible");
console.log("  Test 3 pasado: compatibleDishesForSlot excluye el plato bloqueado sin afectar el resto");

// ── Test 4: planDeterministicNutritionDay nunca elige un plato bloqueado ────
const slots = [{ id: "almuerzo", slot: "Almuerzo", target: { kcal: 700, p: 55, c: 70, f: 20 } }];
const resUnblocked = d.planDeterministicNutritionDay({ prefs: { diet: ["omnivoro"] }, dayTarget, catalog, slots });
assert.ok(resUnblocked.comidas.some(c => c.dishSlug === "pollo-con-arroz" || c.nombre === "Pollo con arroz"),
  "sin bloqueo, el determinista puede elegir el plato de referencia");
const resBlocked = d.planDeterministicNutritionDay({ prefs: prefsBlocked, dayTarget, catalog, slots });
assert.ok(!resBlocked.comidas.some(c => c.dishSlug === "pollo-con-arroz" || c.nombre === "Pollo con arroz"),
  "bloqueado, el determinista jamás debe elegir ese plato");
console.log("  Test 4 pasado: planDeterministicNutritionDay respeta el bloqueo persistente");

// ── Test 5: migrateProfilePrefs (index.html) normaliza y dedupea blockedDishes ──
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(html.includes("function normalizedBlockedDishes("), "index.html debe definir normalizedBlockedDishes");
assert.ok(html.includes("blockedDishes:normalizedBlockedDishes(p.blockedDishes)"), "migrateProfilePrefs debe normalizar blockedDishes");
assert.ok(html.includes("function dishBlockedBySavedList("), "coachDishBlockedByProfile debe consultar la lista guardada");
assert.ok(html.includes("function blockDishFromProfile("), "debe existir la acción para bloquear un plato");
assert.ok(html.includes("function unblockDishFromProfile("), "debe existir la acción para desbloquear un plato ('volver a sugerir')");
assert.ok(html.includes('onclick="blockCurrentMealDish('), "la comida aplicada debe ofrecer la acción \"No me gusta\"");
assert.ok(html.includes("function blockedDishesHtml("), "Perfil debe listar los platos bloqueados");
console.log("  Test 5 pasado: wiring de UI (Perfil + acción sobre la comida) presente en index.html");

console.log("validate-blocked-dishes: todos los checks pasaron.");
