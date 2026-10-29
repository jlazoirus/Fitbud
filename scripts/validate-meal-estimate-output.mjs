#!/usr/bin/env node
// REQ-246 — "Estimar macros" (texto) fallaba en producción con 422: el schema de
// meal_estimate exige "preguntas" sin tope, el prompt de texto no las pedía y el
// modelo a veces devolvía 4 o más; el validador las rechazaba (máx. 3) y el
// usuario veía "Tu coach no pudo completar esta acción". Las preguntas no
// cambian los macros: no pueden invalidar una estimación.
import assert from "node:assert/strict";
import fs from "node:fs";

const api = fs.readFileSync(new URL("../api/claude.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

const pick = (re, label) => { const m = api.match(re); assert.ok(m, `falta ${label}`); return m[0]; };
const validateCoachOutput = new Function([
  pick(/function parseJsonText\(text\) \{[\s\S]*?\n\}/, "parseJsonText"),
  pick(/function finiteNumber\(value\) \{[\s\S]*?\n\}/, "finiteNumber"),
  pick(/function validateCoachOutput\(action, text, validation\) \{[\s\S]*?\n\}/, "validateCoachOutput"),
  "return validateCoachOutput;",
].join("\n"))();

const estimate = (extra) => JSON.stringify({
  nombre: "Sopa ramen vegetariana", kcal: 520, proteina_g: 18, carbohidratos_g: 78, grasa_g: 14,
  nota: "Tazón mediano.", ...extra,
});
const ok = (text) => validateCoachOutput("meal_estimate", text, {});

// Forma que devolvía producción en los 12 fallos (structured outputs, texto): más de 3 preguntas.
const four = ["¿Cuánto fideo?", "¿Llevaba huevo?", "¿Qué caldo?", "¿Le pusiste aceite?"];
assert.equal(ok(estimate({ preguntas: four })), true, "4 preguntas no invalidan la estimación");
assert.equal(ok(estimate({ preguntas: [...four, ...four] })), true, "8 preguntas tampoco");
assert.equal(ok(estimate({ preguntas: [] })), true, "sin preguntas");
assert.equal(ok(estimate({ preguntas: ["¿Porción?", "¿Aceite?", "¿Salsa?"] })), true, "3 preguntas");
assert.equal(ok(estimate({})), true, "sin el campo (fallback sin structured outputs)");
console.log("  Las preguntas, sean cuantas sean, no invalidan los macros");

assert.equal(ok(estimate({ kcal: "mucho", preguntas: [] })), false, "kcal no numérica se rechaza");
assert.equal(ok(estimate({ preguntas: "¿Porción?" })), false, "preguntas que no son lista se rechazan");
assert.equal(ok(estimate({ preguntas: [42] })), false, "una pregunta que no es texto se rechaza");
assert.equal(ok("no es JSON"), false, "texto que no es JSON se rechaza");
console.log("  Lo que sí rompe la estimación sigue rechazándose");

// El prompt de texto pide la misma forma que el schema y deja "preguntas" vacío
// (la estimación por texto no muestra preguntas).
const aiEstimate = html.slice(html.indexOf("async function aiEstimate("), html.indexOf("// REQ-172 — estimar con foto"));
assert.ok(aiEstimate.includes('\\"preguntas\\":[]') || aiEstimate.includes('"preguntas":[]'), "el prompt de texto pide preguntas vacías");
assert.ok(/deja "preguntas" vac[ií]o/i.test(aiEstimate), "el prompt de texto dice que no haga preguntas");
console.log("  El prompt de texto coincide con el schema y no pide preguntas");

// REQ-299: "Shake proteina gloria pro" se estimó como proteína en polvo con agua
// (es una bebida lista para tomar): un producto de marca no se inventa.
assert.ok(/producto envasado o de marca/.test(aiEstimate) && /listo para tomar/.test(aiEstimate) && /en polvo/.test(aiEstimate), "el prompt de texto decide el formato del producto");
assert.ok(/Nunca afirmes datos de una marca que no conoces/.test(aiEstimate), "el prompt de texto no inventa datos de marca");
assert.ok(/foto de la etiqueta/.test(aiEstimate), "sin la etiqueta, la nota orienta a la foto");
assert.ok(/Perú/.test(aiEstimate), "el prompt de texto considera el mercado local");
const photoRound = html.slice(html.indexOf("async function photoEstimateRound("), html.indexOf("function renderPhotoEstimate("));
assert.ok(/etiqueta o tabla nutricional/.test(photoRound), "la foto de una etiqueta usa sus valores");
console.log("  REQ-299: productos de marca sin inventar formato ni etiqueta; la foto lee la etiqueta");

console.log("validate-meal-estimate-output: OK");
