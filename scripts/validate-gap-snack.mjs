// REQ-89 — Cuando un día generado no llega a la meta de kcal/proteína,
// sugerir un snack del catálogo para cerrar el déficit en vez de obligar
// a descartar las comidas.
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

function extractFunctionSource(src, name) {
  const marker = `function ${name}(`;
  let start = src.indexOf(marker);
  if (start === -1) {
    const asyncMarker = `async function ${name}(`;
    start = src.indexOf(asyncMarker);
  }
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

// 1. findGapSnack existe y usa coachDishBlockedByProfile para filtrar
const fgs = extractFunctionSource(html, "findGapSnack");
assert.ok(fgs.includes("coachDishBlockedByProfile"), "findGapSnack debe respetar restricciones del perfil con coachDishBlockedByProfile.");
assert.ok(fgs.includes("dishMacros"), "findGapSnack debe calcular macros de candidatos con dishMacros.");
assert.ok(fgs.includes("dishCompatibleSlots"), "findGapSnack debe verificar que el plato sea de tipo snack/batido.");

// 2. genReviewHtml llama findGapSnack cuando hay déficit
const grh = extractFunctionSource(html, "genReviewHtml");
assert.ok(grh.includes("findGapSnack"), "genReviewHtml debe llamar findGapSnack para sugerir snacks en déficit.");
assert.ok(grh.includes("addGapSnackToDay"), "genReviewHtml debe ofrecer botón addGapSnackToDay.");

// 3. addGapSnackToDay existe y re-valida el borrador
const ags = extractFunctionSource(html, "addGapSnackToDay");
assert.ok(ags.includes("validateGeneratedDay"), "addGapSnackToDay debe re-validar tras agregar el snack.");
assert.ok(ags.includes("genReviewHtml"), "addGapSnackToDay debe re-renderizar el review.");
assert.ok(ags.includes("draft.comidas.push"), "addGapSnackToDay debe agregar el snack a las comidas del borrador.");

// 4. applyGeneratedDay separa comidas de slot de extras
const agd = extractFunctionSource(html, "applyGeneratedDay");
assert.ok(agd.includes("extras"), "applyGeneratedDay debe manejar comidas extra (snack_extra) vía extras.");
assert.ok(agd.includes("slotIds") || agd.includes("slot"), "applyGeneratedDay debe distinguir comidas con slot existente de extras.");

// 5. findGapSnack rechaza gaps demasiado grandes (>700 kcal)
assert.ok(fgs.includes("700"), "findGapSnack debe rechazar gaps > ~700 kcal (demasiado grande para un solo snack).");

// 6. findGapSnack escala ingredientes proporcionalmente
assert.ok(fgs.includes("scale") && fgs.includes("gramos"), "findGapSnack debe escalar gramos de ingredientes proporcionalmente.");

console.log("Gap snack: findGapSnack filtra, escala y sugiere; genReviewHtml muestra botón; applyGeneratedDay separa extras — OK.");
