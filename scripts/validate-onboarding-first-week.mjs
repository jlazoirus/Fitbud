#!/usr/bin/env node
// REQ-118 — onboarding debe preparar y aplicar la primera semana completa.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");

function extractFunctionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Debe existir function ${name}.`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`No se pudo extraer ${name}.`);
}

const saveOnboarding = extractFunctionSource(html, "saveOnboarding");
assert.ok(
  saveOnboarding.includes("prepareFirstCycleWeek(current)") &&
    !saveOnboarding.includes("prepareFirstCycleDay(current)"),
  "saveOnboarding debe preparar la primera semana, no solo el primer día.",
);
assert.ok(
  saveOnboarding.includes("cycleFirstWeekPreparedAt:null"),
  "Un ciclo nuevo debe reiniciar el marcador cycleFirstWeekPreparedAt.",
);

const setup = extractFunctionSource(html, "prepareFirstCycleWeek");
assert.ok(setup.includes("loadEntitlement()"), "Debe refrescar entitlement/trial tras guardar onboarding.");
assert.ok(setup.includes("prepareFirstWeekNutrition") && setup.includes("prepareFirstWeekTraining"),
  "Debe orquestar nutrición y entrenamiento.");
assert.ok(setup.includes("persistFirstWeekPlan"), "Debe persistir la semana preparada.");
assert.ok(setup.includes("skipPlanVersion:true"), "El marcador final no debe crear otra versión manual.");
assert.ok(setup.includes("cycleFirstWeekPreparedAt"), "Debe marcar idempotencia de primera semana.");

const nutrition = extractFunctionSource(html, "prepareFirstWeekNutrition");
assert.ok(nutrition.includes("generateOneDay") && nutrition.includes('action:"diet_week"'),
  "La nutrición inicial debe usar el flujo semanal del coach cuando esté disponible.");
assert.ok(nutrition.includes("deterministicDaysForWeek"),
  "La nutrición inicial debe completar faltantes por ruta determinista.");
assert.ok(nutrition.includes("buildNutritionPlanSnapshot"),
  "La nutrición inicial debe materializar snapshot nutritionPlan.");

const training = extractFunctionSource(html, "prepareFirstWeekTraining");
assert.ok(training.includes("generateTrainingWeek"), "El entrenamiento inicial debe usar el generador semanal existente.");
assert.ok(training.includes("trialFirstWeekOnly") && training.includes("fallbackOnly:true"),
  "El trial debe personalizar semana 1 y completar semanas posteriores con alternativa validada.");
assert.ok(training.includes("TRAINING_PLAN.validatePlan"), "El plan de entrenamiento debe validarse antes de persistir.");

const persist = extractFunctionSource(html, "persistFirstWeekPlan");
assert.ok(persist.includes("ensurePlanVersion"), "Debe guardar un snapshot activo en plan_versions.");
assert.ok(persist.includes("trainingPlan") && persist.includes("nutritionPlan"),
  "El snapshot inicial debe combinar entrenamiento y nutrición.");
assert.ok(persist.includes("applyDayComidas"), "Debe aplicar comidas para compatibilidad local/offline.");

const digest = extractFunctionSource(html, "planSnapshotDigest");
assert.ok(digest.includes("nutritionPlan:"), "planSnapshotDigest debe incluir nutritionPlan explícito.");

const ensure = extractFunctionSource(html, "ensurePlanVersion");
assert.ok(ensure.includes("explicitNutritionPlan") && ensure.includes("!explicitNutritionPlan"),
  "ensurePlanVersion no debe ignorar snapshots explícitos de nutrición.");

const savePrefs = extractFunctionSource(html, "saveProfilePrefs");
assert.ok(savePrefs.includes("skipPlanVersion"), "saveProfilePrefs debe poder guardar prefs sin crear versión extra.");

assert.ok(html.includes("firstWeekIssueModal") && html.includes("retryInitialWeekSetup"),
  "Debe existir aviso con opción de reintento para fallos parciales.");

console.log("REQ-118 onboarding first week: wiring de activación automática validado.");
