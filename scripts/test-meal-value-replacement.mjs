// REQ-154 — "Cambiar comida" guarda en ms.ovr los macros de la porción YA
// ESCALADA al target del slot (rankReplacementCandidates/solveDishPortion,
// REQ-83/131), pero mealValue() resolvía el override por nombre de plato y
// recalculaba desde la receta BASE sin escalar (dishMacros), contradiciendo
// el encabezado de la tarjeta con la receta/ingredientes ya escalados que se
// despliegan debajo y descuadrando dayTotals(). Reproduce con el mismo
// catálogo/target de scripts/validate-nutrition-replacements.mjs (candidato
// real, escalado real) y ejecuta la función mealValue() REAL extraída de
// index.html (no una reimplementación) contra ese override.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(HERE, "..", "index.html"), "utf8");

// Extrae el código fuente de una función de nivel superior por conteo de llaves
// (misma técnica que test-service-worker-cache.mjs usa para service-worker.js).
function extractFunctionSource(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `No se encontró "${signature}" en index.html`);
  let depth = 0, i = source.indexOf("{", start);
  const bodyStart = i;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) break; }
  }
  return source.slice(start, i + 1);
}

const mealValueSrc = extractFunctionSource(html, "function mealValue(base,ms){");

// ── Catálogo de prueba idéntico a validate-nutrition-replacements.mjs ───────
const ingredients = [
  { id: 9, slug: "pechuga-de-pollo", name: "Pechuga de pollo", category: "Proteína animal", kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { id: 4, slug: "arroz-cocido", name: "Arroz cocido", category: "Cereal", kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { id: 5, slug: "aceite-de-oliva", name: "Aceite de oliva", category: "Grasa", kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },
];
const dishes = [
  { id: 107, slug: "pollo-arroz", name: "Pollo con arroz", slot: "almuerzo", compatible_slots: ["almuerzo", "cena"], diet_tags: ["omnivoro"] },
];
function line(did, iid, g) {
  return { dish_id: did, ingredient_id: iid, grams: g, scalable: true, min_g: Math.max(5, Math.round(g * 0.5)), max_g: Math.max(g, Math.round(g * 2)), step_g: 5 };
}
const dishIng = [line(107, 9, 180), line(107, 4, 220), line(107, 5, 8)];
const catalog = { ingredients, dishes, dishIng };

// Comida actual pequeña; target del slot bien por encima → el solver ESCALA
// la porción hacia arriba (mismo patrón que la reproducción del REQ: 654→1004 kcal).
const currentMeal = { slot_id: "almuerzo", kcal: 500, proteina_g: 40, carbohidratos_g: 55, grasa_g: 12 };
const mealTarget = { kcal: 1000, p: 90, c: 100, f: 30 };

const ranked = d.rankReplacementCandidates(currentMeal, dishes, mealTarget, catalog);
assert.ok(ranked.length > 0, "debe rankear al menos un candidato");
const candidate = ranked[0];

// Receta BASE sin escalar (180g pollo + 220g arroz + 8g aceite), para probar
// que el fix NO recalcula desde ahí — debe ser claramente distinta del candidato.
const baseKcal = 180 * 1.65 + 220 * 1.30 + 8 * 8.84; // ≈ 660 kcal
assert.ok(Math.abs(candidate.macros.kcal - baseKcal) > 100,
  "el candidato escalado debe diferir claramente de la receta base sin escalar (si no, el test no prueba nada)");

// ── Ejecuta mealValue() REAL en un contexto vm con DB/dishByName/dishMacros
// simulados devolviendo la receta BASE (para demostrar que el fix las ignora).
function runMealValue(base, ms) {
  const DB = { loaded: true, byName: { [candidate.dish.name]: { id: 107 } } };
  function dishByName(name) { return DB.byName[name] || null; }
  function dishMacros(_dishId) { return { kcal: Math.round(baseKcal), p: 62, c: 68, f: 12 }; } // receta base, NO escalada
  const context = vm.createContext({ DB, dishByName, dishMacros, base, ms, console });
  vm.runInContext(mealValueSrc, context, { filename: "mealValue.js" });
  return vm.runInContext("mealValue(base, ms)", context);
}

// El override que applyChangeMeal() realmente construye para un reemplazo rankeado
// (index.html: newOvr = {name, dishName, gen:true, kcal, p, c, f, ingredientes}).
const base = { name: "Almuerzo genérico", dishName: null, kcal: 0, p: 0, c: 0, f: 0 };
const replacementOvr = {
  name: candidate.dish.name, dishName: candidate.dish.name, gen: true,
  kcal: candidate.macros.kcal, p: candidate.macros.p, c: candidate.macros.c, f: candidate.macros.f,
};

// ── Test 1: el reemplazo materializado debe mostrar los macros ESCALADOS del
// candidato elegido, no los de la receta base recalculada por dishMacros().
{
  const v = runMealValue(base, { ovr: replacementOvr });
  assert.equal(v.kcal, candidate.macros.kcal, "mealValue() debe honrar ovr.kcal del reemplazo escalado, no dishMacros() de la receta base");
  assert.equal(v.p, candidate.macros.p);
  assert.notEqual(v.kcal, Math.round(baseKcal), "no debe coincidir con la receta base sin escalar (eso es justo el bug)");
  console.log(`  Test 1 pasado: reemplazo escalado → mealValue()=${v.kcal} kcal (candidato real), no ${Math.round(baseKcal)} kcal (receta base)`);
}

// ── Test 2 (no regresión, Riesgos del REQ): dishName SIN kcal (solo prescribe
// plato, p. ej. index.html:5778/7227) debe seguir recalculando desde dishMacros().
{
  const v = runMealValue(base, { ovr: { name: candidate.dish.name, dishName: candidate.dish.name } });
  assert.equal(v.kcal, Math.round(baseKcal), "sin ovr.kcal, debe seguir cayendo al recálculo por dishMacros() (comportamiento REQ-82 preexistente)");
  console.log("  Test 2 pasado: dishName sin kcal sigue recalculando desde dishMacros() (sin regresión)");
}

// ── Test 3 (no regresión): override manual custom (kcal sin dishName, editor) ──
{
  const v = runMealValue(base, { ovr: { name: "Comida personalizada", kcal: 777, p: 50, c: 80, f: 20 } });
  assert.equal(v.kcal, 777, "override manual custom (sin dishName) debe seguir mostrando sus propios macros");
  assert.equal(v.src, "custom");
  console.log("  Test 3 pasado: override manual custom sin dishName no se ve afectado");
}

console.log("mealValue() (REQ-154): reemplazos escalados de 'Cambiar comida' se muestran con sus propios macros, sin regresión en los otros dos caminos.");
