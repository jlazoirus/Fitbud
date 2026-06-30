// REQ-90 — Los ingredientes de comidas generadas deben tener inputs editables
// para ajustar gramos antes de aplicar. Al cambiar gramos, se recalculan macros
// y se re-valida el día.
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

// 1. genReviewHtml muestra inputs editables para gramos (día individual)
const grh = extractFunctionSource(html, "genReviewHtml");
assert.ok(
  grh.includes('type="number"') && grh.includes("updateGenMealGrams"),
  "genReviewHtml debe tener inputs numéricos con onchange→updateGenMealGrams."
);

// 2. updateGenMealGrams existe, recalcula macros y re-valida
const ugm = extractFunctionSource(html, "updateGenMealGrams");
assert.ok(ugm.includes("recalcCoachMealMacros"), "updateGenMealGrams debe recalcular macros con recalcCoachMealMacros.");
assert.ok(ugm.includes("validateGeneratedDay"), "updateGenMealGrams debe re-validar con validateGeneratedDay.");
assert.ok(ugm.includes("genReviewHtml"), "updateGenMealGrams debe re-renderizar con genReviewHtml.");

// 3. genWeekReviewHtml muestra inputs editables para gramos (semana)
const gwrh = extractFunctionSource(html, "genWeekReviewHtml");
assert.ok(
  gwrh.includes('type="number"') && gwrh.includes("updateGenWeekMealGrams"),
  "genWeekReviewHtml debe tener inputs numéricos con onchange→updateGenWeekMealGrams."
);

// 4. updateGenWeekMealGrams existe, recalcula macros y re-renderiza
const ugwm = extractFunctionSource(html, "updateGenWeekMealGrams");
assert.ok(ugwm.includes("recalcCoachMealMacros"), "updateGenWeekMealGrams debe recalcular macros con recalcCoachMealMacros.");
assert.ok(ugwm.includes("genWeekReviewHtml"), "updateGenWeekMealGrams debe re-renderizar con genWeekReviewHtml.");
assert.ok(ugwm.includes("buildShoppingListFromNutritionPlan"), "updateGenWeekMealGrams debe actualizar la lista de compras.");

// 5. Los inputs tienen min y step razonables
assert.ok(grh.includes('min="5"') && grh.includes('step="5"'), "Los inputs de gramos deben tener min=5 y step=5.");

console.log("Edición de porciones: inputs editables en día y semana, recálculo de macros, re-validación — OK.");
