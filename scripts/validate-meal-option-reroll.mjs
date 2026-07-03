#!/usr/bin/env node
// Regresión: una comida puede rehacer opciones con límite diario y catálogo cerrado.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const api = readFileSync(new URL("../api/claude.js", import.meta.url), "utf8");

function extractFunction(source, name) {
  let start = source.indexOf(`function ${name}(`);
  if (start === -1) start = source.indexOf(`async function ${name}(`);
  assert.notEqual(start, -1, `No se encontró function ${name}`);
  let depth = 0;
  let opened = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") { depth++; opened = true; }
    if (ch === "}") {
      depth--;
      if (opened && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`No se pudo extraer ${name}`);
}

assert.ok(html.includes("MEAL_OPTION_REROLL_DAILY_LIMIT=4"), "Debe existir límite diario local de rehacer opciones.");
assert.ok(html.includes("fitbud_meal_option_rerolls_v1"), "El contador diario debe persistir por día/usuario.");

const openChangeMeal = extractFunction(html, "openChangeMeal");
assert.ok(openChangeMeal.includes("changeMealRerollControlsHtml()"), "Cambiar comida debe mostrar controles de rehacer opciones.");

const moreMenu = extractFunction(html, "openNutritionMoreMenu");
assert.ok(!moreMenu.includes("aiSuggest"), "Más opciones no debe duplicar el reemplazo de comidas.");
assert.ok(!moreMenu.includes("Ver otra opción de comida"), "La acción de ver otra opción debe vivir en cada comida, no en Más opciones.");
assert.ok(!html.includes("function aiSuggest("), "No debe quedar el flujo global que generaba extras como si fueran reemplazos.");

const reroll = extractFunction(html, "rerollChangeMealOptions");
assert.ok(reroll.includes("consumeMealOptionReroll()"), "Rehacer opciones debe consumir el límite diario.");
assert.ok(reroll.includes('coachQuota("meal_option"'), "Rehacer opciones debe usar la cuota meal_option.");
assert.ok(reroll.includes("allowedNames"), "Rehacer opciones debe cerrar la respuesta a platos permitidos del catálogo.");
assert.ok(reroll.includes("changeMealCandidatePool"), "Rehacer opciones debe tener fallback determinista del catálogo.");

const regenerate = html.slice(html.indexOf("async function regenerateGenMeal("), html.indexOf("function regenerateGenMealRestore("));
assert.ok(regenerate.includes("consumeMealOptionReroll()"), "Otra opción de una comida generada debe compartir el mismo límite diario.");

const validateMealOptions = extractFunction(api, "validateMealOptions");
assert.ok(validateMealOptions.includes("allowedNames"), "El proxy debe validar allowedNames para meal_option.");
assert.ok(validateMealOptions.includes("allowedNames.has"), "El proxy debe rechazar opciones fuera de la lista cerrada.");

console.log("validate-meal-option-reroll: rehacer opciones limitado y validado contra catálogo.");
