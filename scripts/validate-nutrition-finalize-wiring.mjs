#!/usr/bin/env node
// REQ-138 — verifica que los flujos principales del cliente (index.html) pasen
// su composición propuesta por la puerta única finalizeNutritionDay() (via el
// helper finalizeDayWithGate) antes de mostrarla/aplicarla, sin activar el
// rechazo estricto de DIET_CONTRACT (eso es REQ-139). Es un chequeo estructural
// sobre el texto fuente, no ejecuta la app.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const src = readFileSync(join(ROOT, "index.html"), "utf8");

const errors = [];
function fail(msg) { errors.push(msg); }

// Extrae el cuerpo de una función top-level `function name(` o `async function name(`
// contando llaves balanceadas desde el primer `{` tras la firma.
function extractFunctionBody(name) {
  const re = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`);
  const m = re.exec(src);
  if (!m) return null;
  const braceStart = src.indexOf("{", m.index);
  if (braceStart < 0) return null;
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(braceStart, i + 1);
    }
  }
  return null;
}

// Cada flujo listado en el alcance de REQ-138 debe invocar la puerta única.
const GATE_CALL = "finalizeDayWithGate(";
const WIRED_FLOWS = [
  "generateOneDay",
  "deterministicDayPayload",
  "generateDeterministicWeek",
  "regenerateDayInWeekDraft",
  "regenerateGenMeal",
];

for (const name of WIRED_FLOWS) {
  const body = extractFunctionBody(name);
  if (!body) { fail(`No se encontró la función ${name}() en index.html.`); continue; }
  if (!body.includes(GATE_CALL)) {
    fail(`${name}() no invoca ${GATE_CALL} (puerta única finalizeNutritionDay()).`);
  }
}

// El helper debe existir y llamar realmente a finalizeNutritionDay().
const gateHelperBody = extractFunctionBody("finalizeDayWithGate");
if (!gateHelperBody) fail("No se encontró el helper finalizeDayWithGate().");
else if (!gateHelperBody.includes("nd.finalizeNutritionDay(")) {
  fail("finalizeDayWithGate() no invoca nd.finalizeNutritionDay().");
}

// El prompt de generateOneDay ya no debe exigirle al modelo verificar los
// totales del día como autoridad final (ese cierre ahora lo hace el dominio).
const generateOneDayBody = extractFunctionBody("generateOneDay");
if (generateOneDayBody) {
  if (/OBLIGATORIO.*AMBAS metas/i.test(generateOneDayBody)) {
    fail("generateOneDay() todavía exige al modelo verificar totales como autoridad final.");
  }
  if (!generateOneDayBody.includes("res.ok")) {
    fail("generateOneDay() debe seguir dependiendo de validación estructural (res.ok) para el gating visible.");
  }
}

// validateGeneratedDay ya no debe bloquear (issues) por desvío de tolerancia
// de macros del día; ahora es un aviso (warns), porque finalizeNutritionDay()
// hace el cierre real.
const validateGeneratedDayBody = extractFunctionBody("validateGeneratedDay");
if (!validateGeneratedDayBody) {
  fail("No se encontró validateGeneratedDay() en index.html.");
} else {
  if (/issues\.push\(`kcal del día/.test(validateGeneratedDayBody)) {
    fail("validateGeneratedDay() todavía bloquea (issues) por tolerancia de kcal del día.");
  }
  if (/issues\.push\(`Proteína .*por debajo del 85%/.test(validateGeneratedDayBody)) {
    fail("validateGeneratedDay() todavía bloquea (issues) por tolerancia de proteína del día.");
  }
}

// lockedMealsForDay debe existir para proteger comidas done=true (REQ-138 alcance #3).
if (!extractFunctionBody("lockedMealsForDay")) {
  fail("No se encontró lockedMealsForDay(), requerido para proteger comidas registradas.");
}

console.log("Wiring de finalizeNutritionDay() en index.html (REQ-138):");
if (errors.length) {
  console.error(`\n✗ ${errors.length} error(es):`);
  errors.forEach(e => console.error("    ✗ " + e));
  process.exit(1);
}
console.log(`✓ ${WIRED_FLOWS.length} flujos conectados a la puerta única, contrato estricto sigue dormido.`);
