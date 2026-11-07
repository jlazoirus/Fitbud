#!/usr/bin/env node
// REQ-124 / REQ-364 — el consumo precede a la acción de Hoy y Nutrición
// conserva el desglose antes de las comidas y de "Más opciones".
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../app/index.html", import.meta.url), "utf8");

function extractFunctionSource(src, name) {
  const marker = `function ${name}(`;
  let start = src.indexOf(marker);
  assert.ok(start !== -1, `No se encontró function ${name}( en index.html`);
  let i = src.indexOf("{", start);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

// 1. El resumen de Hoy precede a la tarjeta principal.
const renderHoy = extractFunctionSource(html, "renderHoy");
const summaryIdx = renderHoy.indexOf("homeConsumptionHtml(agenda.totals)");
const agendaIdx = renderHoy.indexOf("homeAgendaHtml(ds,agenda)");
assert.ok(summaryIdx !== -1, "renderHoy debe incluir el resumen de consumo.");
assert.ok(agendaIdx !== -1, "renderHoy debe renderizar homeAgendaHtml.");
assert.ok(summaryIdx < agendaIdx, "El resumen de Hoy debe preceder a la agenda.");
assert.ok(!renderHoy.includes("heroDash("), "El desglose de macros vive en Nutrición.");
console.log("  Test 1 pasado: el consumo va antes de la agenda en Hoy");

// 2. renderNutrition: orden anillo/resumen -> comidas del día (incluye extras, REQ-125) -> más opciones.
const renderNutrition = extractFunctionSource(html, "renderNutrition");
const macrosIdx = renderNutrition.indexOf('section("nut.macros"');
const planIdx = renderNutrition.indexOf('section("nut.plan"');
const moreBtnIdx = renderNutrition.lastIndexOf("${moreBtn}");
assert.ok(macrosIdx !== -1 && planIdx !== -1 && moreBtnIdx !== -1,
  "renderNutrition debe incluir las secciones de macros, plan y el botón de más opciones.");
assert.ok(macrosIdx < planIdx && planIdx < moreBtnIdx,
  'En Nutrición, el orden debe ser: macros -> comidas del día -> "Más opciones".');
console.log('  Test 2 pasado: en Nutrición, "Más opciones" aparece después del resumen y las comidas');

// 3. El tour sigue el orden de la pantalla.
const stepsSrc = extractFunctionSource(html, "tourSteps");
const consumptionStep = stepsSrc.indexOf(".home-consumption");
const actionStep = stepsSrc.indexOf(".home-primary");
assert.ok(consumptionStep !== -1 && actionStep > consumptionStep,
  "El tour debe presentar el consumo y luego la acción de Hoy.");
console.log("  Test 3 pasado: el tour apunta al consumo y luego a la acción de Hoy");

console.log("validate-home-macro-ring-first: todos los checks pasaron.");
