#!/usr/bin/env node
// REQ-124 — el anillo/resumen de macros va primero en Home y Nutrición; en Nutrición,
// "Más opciones" no puede aparecer antes del resumen y las comidas.
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

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

// 1. renderHoy: heroDash (anillo) debe aparecer antes que homeAgendaHtml (agenda).
const renderHoy = extractFunctionSource(html, "renderHoy");
const heroIdx = renderHoy.indexOf("heroDash(ds,{compact:true})");
const agendaIdx = renderHoy.indexOf("homeAgendaHtml(ds)");
assert.ok(heroIdx !== -1, "renderHoy debe renderizar heroDash.");
assert.ok(agendaIdx !== -1, "renderHoy debe renderizar homeAgendaHtml.");
assert.ok(heroIdx < agendaIdx, "En Home, el anillo de macros (heroDash) debe ir antes que la agenda (homeAgendaHtml).");
console.log("  Test 1 pasado: en Home, el anillo de macros va antes que la agenda");

// 2. renderNutrition: orden anillo/resumen -> comidas del día -> comidas extra -> más opciones.
const renderNutrition = extractFunctionSource(html, "renderNutrition");
const macrosIdx = renderNutrition.indexOf('section("nut.macros"');
const planIdx = renderNutrition.indexOf('section("nut.plan"');
const extraIdx = renderNutrition.indexOf('section("nut.extra"');
const moreBtnIdx = renderNutrition.lastIndexOf("${moreBtn}");
assert.ok(macrosIdx !== -1 && planIdx !== -1 && extraIdx !== -1 && moreBtnIdx !== -1,
  "renderNutrition debe incluir las secciones de macros, plan, extra y el botón de más opciones.");
assert.ok(macrosIdx < planIdx && planIdx < extraIdx && extraIdx < moreBtnIdx,
  'En Nutrición, el orden debe ser: macros -> comidas del día -> comidas extra -> "Más opciones".');
console.log('  Test 2 pasado: en Nutrición, "Más opciones" aparece después del resumen y las comidas');

// 3. El tour apunta primero al anillo de macros (nuevo primer elemento de Home).
const stepsSrc = extractFunctionSource(html, "tourSteps");
const miniMacroIdx = stepsSrc.indexOf(".mini-macro-dash");
const agendaCardIdx = stepsSrc.indexOf(".agenda-card");
assert.ok(miniMacroIdx !== -1, "tourSteps debe incluir un paso para .mini-macro-dash (el anillo de Home).");
assert.ok(agendaCardIdx !== -1, "tourSteps debe seguir incluyendo un paso para .agenda-card.");
assert.ok(miniMacroIdx < agendaCardIdx, "El paso del tour para el anillo de macros debe ir antes que el de la agenda.");
console.log("  Test 3 pasado: el tour apunta primero al anillo de macros, luego a la agenda");

console.log("validate-home-macro-ring-first: todos los checks pasaron.");
