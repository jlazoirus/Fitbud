// REQ-162 — una comida del snapshot nutritionPlan (REQ-82, ya materializada
// con la porción ESCALADA al target del slot) debe mostrar y sumar SUS
// PROPIOS macros/ingredientes, no los de la receta BASE del catálogo aunque
// el catálogo esté cargado y tenga un plato con el mismo nombre. Antes del
// fix, mealValue()/mealRecipe() resolvían por nombre de plato en el catálogo
// ANTES de mirar el snapshot, así que un plato materializado en 495 kcal
// (300g de pollo) se mostraba como 165 kcal (100g, receta base sin escalar).
// Ejecuta las funciones REALES extraídas de index.html vía node:vm.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(HERE, "..", "index.html"), "utf8");

function extractFunctionSource(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `No se encontró "${signature}" en index.html`);
  let depth = 0, i = source.indexOf("{", start);
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) break; }
  }
  return source.slice(start, i + 1);
}

const mealValueSrc = extractFunctionSource(html, "function mealValue(base,ms){");
const mealHasContentSrc = extractFunctionSource(html, "function mealHasContent(v){");
const mealRecipeSrc = extractFunctionSource(html, "function mealRecipe(b,ms){");
const dishByNameSrc = extractFunctionSource(html, "function dishByName(name){");
const dishMacrosSrc = extractFunctionSource(html, "function dishMacros(dishId){");
const ingByIdSrc = extractFunctionSource(html, "function ingById(id){");
const fullSrc = [mealHasContentSrc, dishByNameSrc, dishMacrosSrc, ingByIdSrc, mealValueSrc, mealRecipeSrc].join("\n");

// Catálogo cargado con "Pollo con arroz": receta BASE = 100g pollo + 150g arroz.
const DISH_ID = 107;
const DB = {
  loaded: true,
  byName: { "Pollo con arroz": { id: DISH_ID } },
  ingredients: [
    { id: 9, name: "Pechuga de pollo" },
    { id: 4, name: "Arroz cocido" },
  ],
  dishIng: [
    { dish_id: DISH_ID, ingredient_id: 9, grams: 100 },
    { dish_id: DISH_ID, ingredient_id: 4, grams: 150 },
  ],
};
// macrosFromLines() es parte de nutrition-pure.js — dishMacros() extraída la
// usa; para esta prueba de mealValue/mealRecipe basta con stubearla acorde a
// la receta base declarada arriba (100g pollo ≈165kcal/31p + 150g arroz ≈195kcal).
function macrosFromLines() { return { kcal: 165, p: 31, c: 43, f: 4 }; } // receta BASE (100g), NO escalada

const context = vm.createContext({ DB, macrosFromLines, console });
vm.runInContext(fullSrc, context, { filename: "meal-functions.js" });
function mealValue(base, ms) { context.base = base; context.ms = ms; return vm.runInContext("mealValue(base, ms)", context); }
function mealRecipe(b, ms) { context.b = b; context.ms = ms; return vm.runInContext("mealRecipe(b, ms)", context); }

// La comida del snapshot: plan materializó Almuerzo en 495 kcal (300g de pollo,
// porción escalada al target del slot) — bien distinto de la receta base.
const nutritionPlanMeal = {
  name: "Almuerzo", dishName: "Pollo con arroz", src: "nutritionPlan",
  kcal: 495, p: 93, c: 40, f: 12,
  ingredientes: [{ nombre: "Pechuga de pollo", gramos: 300 }, { nombre: "Arroz cocido", gramos: 150 }],
};

// ── Test 1: mealValue() debe devolver los macros del SNAPSHOT, no de dishMacros() ──
{
  const v = mealValue(nutritionPlanMeal, {}); // ms={} → sin ms.ovr
  assert.equal(v.kcal, 495, "mealValue() debe devolver los kcal materializados del plan, no la receta base del catálogo (165).");
  assert.equal(v.p, 93);
  assert.equal(v.src, "nutritionPlan");
  console.log("  Test 1 pasado: mealValue() prioriza el snapshot nutritionPlan (495 kcal) sobre el catálogo (165 kcal)");
}

// ── Test 2: mealRecipe() debe devolver los ingredientes/gramos del SNAPSHOT ──
{
  const r = mealRecipe(nutritionPlanMeal, {});
  assert.ok(r, "mealRecipe() debe devolver una receta.");
  const pollo = r.lines.find((l) => l.name === "Pechuga de pollo");
  assert.ok(pollo, "Debe incluir la línea de pollo del snapshot.");
  assert.equal(pollo.grams, 300, "Debe usar los 300g escalados del snapshot, no los 100g de la receta base del catálogo.");
  console.log("  Test 2 pasado: mealRecipe() usa los gramos escalados del snapshot (300g), no la receta base (100g)");
}

// ── Test 3 (no regresión, REQ-154): un reemplazo de "Cambiar comida" (ovr.gen
// + dishName + kcal) sigue mostrando SUS propios macros, no el snapshot viejo ──
{
  const replaced = { ...nutritionPlanMeal }; // el slot conserva el snapshot original...
  const ms = { ovr: { name: "Otro plato", dishName: "Otro plato", gen: true, kcal: 700, p: 60, c: 80, f: 20 } }; // ...pero el usuario lo cambió
  const v = mealValue(replaced, ms);
  assert.equal(v.kcal, 700, "Un reemplazo explícito (Cambiar comida) debe seguir ganándole al snapshot original.");
  console.log("  Test 3 pasado: un reemplazo de 'Cambiar comida' sigue teniendo prioridad sobre el snapshot (sin regresión de REQ-154)");
}

// ── Test 4 (no regresión, REQ-82): comida SIN snapshot (src!=="nutritionPlan")
// con dishName en catálogo sigue resolviendo por catálogo como antes ──
{
  const planless = { name: "Almuerzo", dishName: "Pollo con arroz", src: null, kcal: 0, p: 0, c: 0, f: 0 };
  const v = mealValue(planless, {});
  assert.equal(v.kcal, 165, "Sin snapshot materializado, debe seguir resolviendo por nombre de plato en el catálogo (compatibilidad).");
  assert.equal(v.src, "db");
  console.log("  Test 4 pasado: sin snapshot, la resolución por catálogo sigue funcionando (compatibilidad, sin regresión)");
}

console.log("mealValue()/mealRecipe() (REQ-162): el snapshot nutritionPlan gana al catálogo. Verificado con vm sobre las funciones reales.");
