#!/usr/bin/env node
// REQ-121 — Editar preferencias (gustos/disgustos/platos bloqueados) invalida el cache
// de generación de inmediato, y regenerar día/semana nunca reescribe lo ya ejecutado.
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

// 1. coachCompatibilityContext incluye gustos/disgustos/platos bloqueados en el context
//    serializado, para que contextKey cambie al editar preferencias (REQ-121 alcance #1).
const ctx = extractFunctionSource(html, "coachCompatibilityContext");
["preferredIngredients", "preferredDishes", "dislikedIngredients", "blockedDishes"].forEach((field) => {
  assert.ok(ctx.includes(field), `coachCompatibilityContext debe incluir "${field}" en el context.`);
});
console.log("  Test 1 pasado: coachCompatibilityContext incluye gustos/disgustos/platos bloqueados");

// 2. COACH_PROMPT_VERSION se subió para invalidar resultados cacheados antes de este cambio.
const verMatch = html.match(/const\s+COACH_PROMPT_VERSION\s*=\s*(\d+)/);
assert.ok(verMatch, "Debe existir const COACH_PROMPT_VERSION.");
assert.ok(Number(verMatch[1]) >= 8, `COACH_PROMPT_VERSION debe ser >= 8 tras REQ-132 (actual: ${verMatch[1]}).`);
console.log(`  Test 2 pasado: COACH_PROMPT_VERSION=${verMatch[1]} (>=8)`);

// 3. applyDayComidas nunca reescribe una comida ya registrada (done=true).
const applyDay = extractFunctionSource(html, "applyDayComidas");
assert.ok(/if\s*\(\s*ms\.done\s*\)/.test(applyDay), "applyDayComidas debe saltar comidas con ms.done=true.");
assert.ok(/preserved/.test(applyDay), "applyDayComidas debe contar cuántas comidas se preservaron.");
console.log("  Test 3 pasado: applyDayComidas preserva comidas ya registradas");

// 4. homePrepareDay rechaza preparar/regenerar un día pasado.
const prep = extractFunctionSource(html, "homePrepareDay");
assert.ok(/ds\s*<\s*todayStr\(\)/.test(prep), "homePrepareDay debe rechazar fechas pasadas (ds<todayStr()).");
console.log("  Test 4 pasado: homePrepareDay excluye días pasados");

// 5. El menú de Nutrición no ofrece "volver a preparar" para un día pasado.
const menu = extractFunctionSource(html, "openNutritionMoreMenu");
assert.ok(/ds\s*>=\s*todayStr\(\)/.test(menu), '"Volver a preparar este día" debe exigir ds>=todayStr().');
console.log("  Test 5 pasado: menú de Nutrición no ofrece regenerar días pasados");

console.log("validate-preference-cache-invalidation: todos los checks pasaron.");
