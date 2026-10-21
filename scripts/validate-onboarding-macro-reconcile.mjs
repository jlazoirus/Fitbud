#!/usr/bin/env node
// REQ-227 — reconcileOnboardingMacros(): editar un solo valor en "Ajustar valores"
// (paso 2 del onboarding) no debe dejar kcal != proteína·4 + carbos·4 + grasa·9.
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = html.indexOf("function reconcileOnboardingMacros(");
assert.notEqual(start, -1, "Debe existir function reconcileOnboardingMacros.");
const src = html.slice(start, html.indexOf("\n}\n", start) + 2);
const reconcileOnboardingMacros = new Function(`${src}\nreturn reconcileOnboardingMacros;`)();

function sum(t) { return t.proteinTarget * 4 + t.carbTarget * 4 + t.fatTarget * 9; }

// Caso del reporte de auditoría: fórmula da 1740/120/207/48, el usuario solo baja kcal a 1200.
const calculated = { calorieTarget: 1740, proteinTarget: 120, carbTarget: 207, fatTarget: 48 };
const editedKcal = { ...calculated, calorieTarget: 1200 };
const r1 = reconcileOnboardingMacros(calculated, editedKcal);
assert.equal(r1.calorieTarget, sum(r1), "kcal debe cuadrar con la suma de macros tras editar solo kcal.");
assert.equal(r1.proteinTarget, 120, "proteína queda fija cuando el usuario solo edita kcal.");
assert.ok(r1.carbTarget < 207 && r1.fatTarget < 48, "carbos y grasa deben escalar hacia abajo con el nuevo presupuesto.");
assert.equal(r1.adjusted, "macros", "debe señalar que se ajustaron los macros.");

// Editar solo un macro (subir proteína): kcal se recalcula desde los 4 valores.
const editedProtein = { ...calculated, proteinTarget: 180 };
const r2 = reconcileOnboardingMacros(calculated, editedProtein);
assert.equal(r2.calorieTarget, sum(r2), "kcal debe recalcularse desde los macros tras editar proteína.");
assert.equal(r2.proteinTarget, 180);
assert.equal(r2.carbTarget, 207, "los macros no editados no cambian.");
assert.equal(r2.adjusted, "kcal", "debe señalar que se ajustó kcal.");

// Sin edición (Continuar directo, valores ya coherentes): no debe tocar nada.
const r3 = reconcileOnboardingMacros(calculated, { ...calculated });
assert.deepEqual({ c: r3.calorieTarget, p: r3.proteinTarget, ca: r3.carbTarget, f: r3.fatTarget },
  { c: 1740, p: 120, ca: 207, f: 48 });
assert.equal(r3.adjusted, "", "no hay ajuste si nada cambió.");

// Bajar mucho las calorías no debe colapsar carbos/grasa a 0 (pisos de calculateMacroTargets).
const r4 = reconcileOnboardingMacros(calculated, { ...calculated, calorieTarget: 400 });
assert.ok(r4.carbTarget >= 50 && r4.fatTarget >= 45, "carbos/grasa respetan el piso aunque el presupuesto baje mucho.");
assert.equal(r4.calorieTarget, sum(r4), "kcal sigue cuadrando con la suma incluso tras el piso.");

console.log("validate-onboarding-macro-reconcile: OK");
