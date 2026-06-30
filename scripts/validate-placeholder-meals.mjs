// REQ-85 — validateGeneratedDay debe rechazar nombres ficticios/placeholder,
// los fallbacks deben usar platos reales del catálogo, y los prompts deben
// prohibir explícitamente nombres genéricos.
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

function extractFunctionSource(src, name) {
  const marker = `function ${name}(`;
  const start = src.indexOf(marker);
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

// 1. validateGeneratedDay rechaza placeholders
const valSrc = extractFunctionSource(html, "validateGeneratedDay");
assert.ok(
  valSrc.includes("placeholderRe") && /práctica|genéric|compatible/.test(valSrc),
  "validateGeneratedDay debe tener un regex placeholderRe que detecte nombres ficticios."
);
assert.ok(
  valSrc.includes("parece un nombre ficticio"),
  "validateGeneratedDay debe emitir issue cuando detecta un nombre ficticio de plato."
);
assert.ok(
  valSrc.includes("parece ficticio"),
  "validateGeneratedDay debe emitir issue cuando detecta un ingrediente ficticio."
);

// 2. regenerateGenMeal NO usa placeholder "práctica" ni "Alimento compatible"
const regenSrc = extractFunctionSource(html, "regenerateGenMeal");
assert.ok(
  !regenSrc.includes("práctica"),
  "regenerateGenMeal NO debe usar 'práctica' en el fallback."
);
assert.ok(
  !regenSrc.includes("Alimento compatible"),
  "regenerateGenMeal NO debe usar 'Alimento compatible' en el fallback."
);
assert.ok(
  regenSrc.includes("fbDish") && regenSrc.includes("dishMacros"),
  "regenerateGenMeal debe construir el fallback desde un plato real del catálogo (fbDish)."
);

// 3. deterministicSuggestionPayload no usa nombres genéricos
const detSrc = extractFunctionSource(html, "deterministicSuggestionPayload");
assert.ok(
  !detSrc.includes("compatible") && !detSrc.includes("completar el día"),
  "deterministicSuggestionPayload NO debe usar nombres genéricos como 'compatible' o 'completar el día'."
);

// 4. Prompt de generateOneDay prohíbe nombres ficticios
const genSrc = extractFunctionSource(html, "generateOneDay");
assert.ok(
  genSrc.includes("PROHIBIDO inventar nombres genéricos"),
  "El prompt de generateOneDay debe prohibir nombres genéricos/ficticios."
);

// 5. Prompt de regenerateGenMeal prohíbe nombres ficticios
assert.ok(
  regenSrc.includes("PROHIBIDO inventar nombres genéricos"),
  "El prompt de regenerateGenMeal debe prohibir nombres genéricos/ficticios."
);

console.log("Validación de placeholders: nombres ficticios rechazados, fallbacks reales, prompts reforzados — OK.");
