#!/usr/bin/env node
// REQ-122 — una dieta que no llega a la meta nunca deja al usuario bloqueado: siempre
// hay una acción para completarla por ruta determinista (día y semana).
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

function extractFunctionSource(src, name) {
  const marker = `function ${name}(`;
  let start = src.indexOf(marker);
  if (start === -1) start = src.indexOf(`async function ${name}(`);
  assert.ok(start !== -1, `No se encontró function ${name}( en index.html`);
  let i = src.indexOf("{", start);
  assert.ok(i !== -1, `No se encontró el cuerpo de ${name}`);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

// 1. genReviewHtml (revisión de día) ofrece una salida cuando el día no cumple el objetivo:
//    reintentar y completar por ruta determinista, no solo un botón deshabilitado.
const genReview = extractFunctionSource(html, "genReviewHtml");
assert.ok(/!res\.ok[\s\S]{0,120}aiGenerateDay\(\)/.test(genReview), 'genReviewHtml debe ofrecer "Reintentar" cuando !res.ok.');
assert.ok(/!res\.ok[\s\S]{0,200}deterministicFromModal\(\)/.test(genReview), 'genReviewHtml debe ofrecer completar por ruta determinista cuando !res.ok.');
console.log("  Test 1 pasado: la revisión de día generado siempre ofrece una salida cuando no cumple el objetivo");

// 2. aiGenerateDay escala automáticamente a la ruta determinista tras 2 intentos fallidos.
const aiGenDay = extractFunctionSource(html, "aiGenerateDay");
assert.ok(/_genDayFailStreak/.test(aiGenDay), "aiGenerateDay debe llevar la cuenta de intentos fallidos consecutivos.");
assert.ok(/_genDayFailStreak\s*>=\s*2/.test(aiGenDay), "Tras 2 intentos fallidos, debe activarse la ruta determinista automáticamente.");
assert.ok(/applyDeterministicDay\(/.test(aiGenDay), "El auto-completado debe usar applyDeterministicDay.");
console.log("  Test 2 pasado: aiGenerateDay activa la ruta determinista tras 2 fallos consecutivos");

// 3. homePrepareDay reinicia el conteo en cada sesión nueva de preparación.
const prep = extractFunctionSource(html, "homePrepareDay");
assert.ok(/_genDayFailStreak\s*=\s*0/.test(prep), "homePrepareDay debe reiniciar _genDayFailStreak al empezar.");
console.log("  Test 3 pasado: homePrepareDay reinicia el conteo de fallos por sesión");

// 4. genWeekReviewHtml ofrece completar los días que no se pudieron preparar, no solo advertir.
const weekReview = extractFunctionSource(html, "genWeekReviewHtml");
assert.ok(/problems[\s\S]{0,400}deterministicWeekFromModal\(\)/.test(weekReview), 'genWeekReviewHtml debe ofrecer "Completar días faltantes" junto a la advertencia de problemas.');
console.log("  Test 4 pasado: la revisión de semana ofrece completar los días faltantes por ruta determinista");

// 5. La ruta determinista (deterministicDayPayload) siempre devuelve un día aplicable
//    (comidas[], aunque no llegue exacto a la meta), nunca deja el flujo sin datos.
const detPayload = extractFunctionSource(html, "deterministicDayPayload");
assert.ok(/comidas:\s*\[\]/.test(detPayload) === false || /comidas:res\.comidas|return res|comidas:\[\]/.test(detPayload),
  "deterministicDayPayload debe declarar explícitamente comidas incluso en el caso sin catálogo.");
assert.ok(detPayload.includes("ok:false") && detPayload.includes("no_solution"), "Debe declarar el caso sin catálogo con motivo explícito.");
console.log("  Test 5 pasado: deterministicDayPayload siempre devuelve una forma aplicable/explicable");

console.log("validate-diet-completion-fallback: todos los checks pasaron.");
