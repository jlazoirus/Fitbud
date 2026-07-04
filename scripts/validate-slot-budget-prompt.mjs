#!/usr/bin/env node
// REQ-131 — Presupuestos por slot, referencia filtrada y heurística de contundencia.
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

const helpers = sliceBetween("function nutritionSlotTargetsForDay(", "function coachDishText(");
assert.ok(
  helpers.includes("mealSlotTargets(target,prefs,{isTrainingDay})"),
  "Los presupuestos de slot deben venir de mealSlotTargets y respetar mainMealIndex."
);
assert.ok(
  helpers.includes("slotArchetypePromptLine") && helpers.includes("no guisos ni platos de almuerzo"),
  "Debe existir una línea de arquetipos por slot, incluyendo desayuno sin platos de almuerzo."
);
assert.ok(
  helpers.includes("compatibleDishesForSlot(slotId,prefs,DB)") && helpers.includes("slotDishReferenceLines"),
  "La referencia del prompt debe filtrarse con compatibleDishesForSlot por slot."
);

const validateGeneratedDay = sliceBetween("function validateGeneratedDay(", "// REQ-89:");
assert.ok(
  validateGeneratedDay.includes("findDishForMeal") && validateGeneratedDay.includes("compatibleSlotsForDish"),
  "validateGeneratedDay debe verificar compatible_slots cuando una comida matchea el catálogo."
);
assert.ok(
  validateGeneratedDay.includes("dish_slot_incompatible") && validateGeneratedDay.includes("no corresponde a"),
  "Una comida catalogada en un slot incompatible debe convertirse en issue."
);
assert.ok(
  validateGeneratedDay.includes("slotKcalCeiling") && validateGeneratedDay.includes("demasiado contundente"),
  "validateGeneratedDay debe bloquear comidas no principales que excedan el techo kcal del slot."
);
assert.ok(
  validateGeneratedDay.includes("dishAllowedForSlotMoment") && validateGeneratedDay.includes("metadata de momento del día"),
  "validateGeneratedDay debe consumir meal_weight/meal_form cuando el catálogo lo trae."
);

const generateOneDay = sliceBetween("async function generateOneDay(", "async function aiGenerateDay(");
assert.ok(
  generateOneDay.includes("slotBudgetPromptLine(slotTargets)") && generateOneDay.includes("Presupuesto por slot"),
  "generateOneDay debe incluir presupuesto kcal/proteína por slot."
);
assert.ok(
  generateOneDay.includes("slotArchetypePromptLines(slotTargets)") && generateOneDay.includes("${slotArchetypesLine}"),
  "generateOneDay debe incluir arquetipos por momento del día."
);
assert.ok(
  generateOneDay.includes("slotDishReferenceLines(slotTargets,prefs)") &&
    generateOneDay.includes("Referencia de platos compatibles por slot"),
  "generateOneDay debe usar una referencia filtrada por slot."
);
assert.ok(
  !generateOneDay.includes("compatDishes.slice(0,60)"),
  "generateOneDay no debe volver a una lista mezclada de platos compatibles."
);

const regenerateMeal = sliceBetween("async function regenerateGenMeal(", "function regenerateGenMealRestore(");
assert.ok(
  regenerateMeal.includes("slotArchetypePromptLine(slotId)") && regenerateMeal.includes("Momento del día"),
  "regenerateGenMeal debe recordar el arquetipo del slot al pedir otra opción."
);

const coachCompatibilityContext = sliceBetween("function coachCompatibilityContext(", "function coachQuota(");
assert.ok(
  coachCompatibilityContext.includes("meal_weight") && coachCompatibilityContext.includes("meal_form"),
  "La metadata de momento del catálogo debe invalidar el contextKey del pool."
);

console.log("validate-slot-budget-prompt: prompt y validación por slot verificados.");
