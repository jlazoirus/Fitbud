#!/usr/bin/env node
// REQ-125 — Nutrición: reordenar comidas planificadas y extras (visual, sin tocar
// slot/horario/macros/historial) y saltar una comida sin que cuente como consumida.
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

function extractFunctionSource(src, name) {
  const marker = `function ${name}(`;
  let start = src.indexOf(marker);
  if (start === -1) start = src.indexOf(`async function ${name}(`);
  assert.ok(start !== -1, `No se encontró function ${name}( en index.html`);
  let i = src.indexOf("{", start);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

// 1. El orden visual combina comidas y extras, y su clave no depende del índice del
//    array de extras (para no romperse cuando se elimina una comida extra).
const itemKey = extractFunctionSource(html, "dayItemKey");
assert.ok(/oid/.test(itemKey), "dayItemKey debe identificar extras por oid cuando existe, no solo por índice.");
const nextOid = extractFunctionSource(html, "nextExtraOid");
assert.ok(/extraSeq/.test(nextOid), "nextExtraOid debe usar un contador persistente por día (extraSeq).");
console.log("  Test 1 pasado: las claves de orden identifican extras de forma estable (oid), no por índice");

// 2. dayEffectiveOrder conserva el orden guardado, agrega ítems nuevos al final y
//    descarta claves de ítems que ya no existen (ej. un extra eliminado).
const effOrder = extractFunctionSource(html, "dayEffectiveOrder");
assert.ok(/mealOrder/.test(effOrder), "dayEffectiveOrder debe leer el orden guardado (mealOrder).");
assert.ok(/seen/.test(effOrder), "dayEffectiveOrder debe deduplicar/reconciliar claves.");
console.log("  Test 2 pasado: dayEffectiveOrder reconcilia el orden guardado con los ítems actuales");

// 3. El reordenamiento es solo visual — moveDayItem solo reescribe mealOrder, nunca
//    slot/horario/macros; y no aplica a días pasados.
const moveItem = extractFunctionSource(html, "moveDayItem");
assert.ok(/canReorderDay/.test(moveItem), "moveDayItem debe respetar canReorderDay (no reordenar el pasado).");
assert.ok(/st\.mealOrder\s*=\s*order/.test(moveItem), "moveDayItem solo debe reescribir mealOrder.");
assert.ok(!/\.ovr\s*=/.test(moveItem) && !/\.kcal\s*=/.test(moveItem), "moveDayItem no debe tocar overrides ni macros.");
const canReorder = extractFunctionSource(html, "canReorderDay");
assert.ok(/todayStr\(\)/.test(canReorder), "canReorderDay debe comparar contra el día de hoy.");
console.log("  Test 3 pasado: moveDayItem es puramente visual y no reordena días pasados");

// 4. Saltar una comida: no cuenta como consumida, se puede deshacer, y una comida ya
//    registrada no puede saltarse (no se pisa el historial).
const skip = extractFunctionSource(html, "skipMeal");
assert.ok(/ms\.done/.test(skip), "skipMeal debe rechazar saltar una comida ya registrada (ms.done).");
assert.ok(/skipped\s*=\s*true/.test(skip), "skipMeal debe marcar ms.skipped=true.");
const unskip = extractFunctionSource(html, "unskipMeal");
assert.ok(/delete\s+ms\.skipped/.test(unskip), "unskipMeal debe poder deshacer el salto (delete ms.skipped).");
console.log("  Test 4 pasado: skipMeal/unskipMeal implementan saltar y deshacer correctamente");

// 5. dayTotals no cuenta una comida saltada como pendiente (no infla el denominador).
const totals = extractFunctionSource(html, "dayTotals");
assert.ok(/skipped/.test(totals), "dayTotals debe excluir comidas saltadas del conteo de totMeals.");
console.log("  Test 5 pasado: dayTotals excluye comidas saltadas del total de comidas del día");

// 6. Home usa el orden visual para elegir la próxima comida pendiente y excluye las
//    comidas saltadas de esa selección.
const agendaData = extractFunctionSource(html, "homeAgendaData");
assert.ok(/dayEffectiveOrder\(ds\)/.test(agendaData), "homeAgendaData debe usar dayEffectiveOrder para ordenar comidas pendientes.");
assert.ok(/!ms\.skipped/.test(agendaData) || /ms\.skipped/.test(agendaData), "homeAgendaData debe excluir comidas saltadas de las pendientes.");
console.log("  Test 6 pasado: Home usa el orden visual y excluye comidas saltadas al elegir la siguiente");

// 7. mealCard/extraCard exponen controles de reordenamiento condicionados a canReorderDay
//    (fallback accesible de botones subir/bajar, sin depender de drag-and-drop).
const mealCard = extractFunctionSource(html, "mealCard");
assert.ok(/reorderControlsHtml/.test(mealCard), "mealCard debe incluir los controles de reordenamiento.");
const extraCard = extractFunctionSource(html, "extraCard");
assert.ok(/reorderControlsHtml/.test(extraCard), "extraCard debe incluir los controles de reordenamiento.");
console.log("  Test 7 pasado: mealCard y extraCard exponen controles subir/bajar accesibles");

console.log("validate-meal-reorder-skip: todos los checks pasaron.");
