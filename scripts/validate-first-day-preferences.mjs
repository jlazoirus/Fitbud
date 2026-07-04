#!/usr/bin/env node
// Regresión: la primera dieta posterior al onboarding debe respetar preferencias alimenticias.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function sliceBetween(startNeedle, endNeedle) {
  const start = html.indexOf(startNeedle);
  assert.notEqual(start, -1, `No se encontró ${startNeedle}`);
  const end = html.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `No se encontró ${endNeedle} después de ${startNeedle}`);
  return html.slice(start, end);
}

const validateGeneratedDay = sliceBetween("function validateGeneratedDay(", "// REQ-89:");
assert.ok(
  validateGeneratedDay.includes("coachFoodBlockTerms(false)"),
  "validateGeneratedDay debe construir restricciones duras completas del perfil."
);
assert.ok(
  validateGeneratedDay.includes("foodTextConflictForProfile") && validateGeneratedDay.includes("profileConflict(hay)"),
  "validateGeneratedDay debe validar cada comida contra el contrato nutricional del perfil."
);
assert.ok(
  !validateGeneratedDay.includes("noEgg&&"),
  "validateGeneratedDay no debe limitarse a la antigua validación especial de huevo."
);

const firstWeekNutrition = sliceBetween("async function prepareFirstWeekNutrition(", "async function prepareFirstWeekTraining(");
assert.ok(
  firstWeekNutrition.includes("res&&res.ok") && firstWeekNutrition.includes("deterministicDaysForWeek"),
  "prepareFirstWeekNutrition debe aceptar solo días validados y completar faltantes por plan determinista."
);
assert.ok(
  firstWeekNutrition.includes("buildNutritionPlanSnapshot"),
  "prepareFirstWeekNutrition debe materializar únicamente el set final de comidas ya validado o determinístico."
);

const persistFirstWeek = sliceBetween("async function persistFirstWeekPlan(", "function firstWeekIssueModal(");
assert.ok(
  persistFirstWeek.includes("applyDayComidas(day.ds,day.comidas)"),
  "persistFirstWeekPlan debe aplicar únicamente comidas ya validadas o determinísticas."
);

const generateOneDay = sliceBetween("async function generateOneDay(", "async function aiGenerateDay(");
assert.ok(
  generateOneDay.includes("const hardRes=coachFoodBlockTerms(false)"),
  "generateOneDay debe pedir el día con las mismas restricciones duras que luego valida."
);

const dietQuota = sliceBetween("function dietQuotaValidation(", "function mealOptionValidation(");
assert.ok(
  dietQuota.includes("hardRestrictions:coachFoodBlockTerms(false)"),
  "dietQuotaValidation debe enviar restricciones duras completas al proxy."
);

const regenerateMeal = sliceBetween("async function regenerateGenMeal(", "function regenerateGenMealRestore(");
assert.ok(
  regenerateMeal.includes("coachTextHasTerms(hay,hardTerms)"),
  "regenerateGenMeal debe bloquear restricciones con matcher por palabra."
);
assert.ok(
  !regenerateMeal.includes("some(term=>hay.includes(term))"),
  "regenerateGenMeal no debe volver al matcher por substring."
);

console.log("validate-first-day-preferences: primera dieta respeta preferencias y fallback validado.");
