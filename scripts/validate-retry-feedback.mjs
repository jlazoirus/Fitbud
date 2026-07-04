#!/usr/bin/env node
// REQ-123 — Los botones "Otra opción"/"Rehacer opciones"/"Preparar otro día" deben
// funcionar en reintentos repetidos y avisar claramente cuando se agotó el cupo de
// generaciones frescas del día (en vez de repetir la misma sugerencia en silencio).
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const claude = fs.readFileSync(new URL("../api/claude.js", import.meta.url), "utf8");

function extractFunctionSource(src, name) {
  const marker = `function ${name}(`;
  let start = src.indexOf(marker);
  if (start === -1) start = src.indexOf(`async function ${name}(`);
  assert.ok(start !== -1, `No se encontró function ${name}( en el archivo`);
  let i = src.indexOf("{", start);
  assert.ok(i !== -1, `No se encontró el cuerpo de ${name}`);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

// 1. El servidor marca explícitamente cuando una respuesta es reutilizada (cupo
//    agotado), no solo para admins — el cliente lo necesita para dar feedback.
assert.ok(/text:\s*selected\.selected_text,\s*reused:\s*true/.test(claude),
  "api/claude.js debe devolver reused:true en la respuesta cuando reservation.mode es 'reuse'.");
console.log("  Test 1 pasado: /api/claude expone reused:true en el camino de reutilización");

// 2. callClaude (cliente) expone esa señal para que los llamadores puedan reaccionar.
const callClaudeSrc = extractFunctionSource(html, "callClaude");
assert.ok(/lastCoachCallReused\s*=\s*!!data\.reused/.test(callClaudeSrc),
  "callClaude debe capturar data.reused en lastCoachCallReused.");
console.log("  Test 2 pasado: callClaude expone lastCoachCallReused");

// 3. Las tres superficies de "otra opción"/"rehacer opciones"/"preparar otro día"
//    leen esa señal y avisan al usuario en vez de fallar en silencio.
["rerollChangeMealOptions", "regenerateGenMeal", "regenerateDayInWeekDraft"].forEach((name) => {
  const src = extractFunctionSource(html, name);
  assert.ok(/reused/i.test(src), `${name} debe usar la señal de reutilización (reused).`);
  assert.ok(/toast\(/.test(src), `${name} debe mostrar feedback (toast) al usuario.`);
});
console.log("  Test 3 pasado: rerollChangeMealOptions, regenerateGenMeal y regenerateDayInWeekDraft avisan cuando se reutiliza una respuesta");

// 4. Ningún botón de reintento deja un modal muerto: siempre hay una acción hacia
//    adelante (reintentar y/o volver al borrador) en el estado de error.
const regenWeekDay = extractFunctionSource(html, "regenerateDayInWeekDraft");
assert.ok(/regenerateDayInWeekDraft\(\$\{index\}\)/.test(regenWeekDay) || /onclick="regenerateDayInWeekDraft/.test(regenWeekDay),
  "regenerateDayInWeekDraft debe ofrecer reintentar cuando falla, no solo volver al borrador.");
const regenGenMeal = extractFunctionSource(html, "regenerateGenMeal");
assert.ok(/regenerateGenMealRestore\(\)/.test(regenGenMeal), "regenerateGenMeal debe poder volver al borrador si falla.");
console.log("  Test 4 pasado: los estados de error de regeneración ofrecen una acción hacia adelante");

// 5. rerollChangeMealOptions descarta candidatos ya vistos incluso cuando la IA
//    reutiliza una respuesta anterior, para no repetir el mismo plato.
const reroll = extractFunctionSource(html, "rerollChangeMealOptions");
assert.ok(/freshSelected/.test(reroll), "rerollChangeMealOptions debe filtrar candidatos ya vistos (freshSelected).");
console.log("  Test 5 pasado: rerollChangeMealOptions filtra candidatos repetidos antes de mostrarlos");

console.log("validate-retry-feedback: todos los checks pasaron.");
