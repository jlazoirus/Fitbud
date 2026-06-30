// REQ-88 — generateOneDay debe pasar la fecha (ds) como scope a coachQuota
// para que cada día tenga un contextKey diferente y no se reutilicen resultados
// de un día para otro.
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

// 1. generateOneDay pasa ds como scope (7 args a coachQuota)
const gen = extractFunctionSource(html, "generateOneDay");
// Extract full coachQuota(...) call handling nested parens
const cqStart = gen.indexOf("coachQuota(");
assert.ok(cqStart !== -1, "generateOneDay debe llamar a coachQuota.");
let depth2 = 0, cqEnd = cqStart;
for (let k = gen.indexOf("(", cqStart); k < gen.length; k++) {
  if (gen[k] === "(") depth2++;
  else if (gen[k] === ")") { depth2--; if (depth2 === 0) { cqEnd = k + 1; break; } }
}
const quotaCallStr = gen.slice(cqStart, cqEnd);
// Count top-level commas (args separators)
let topCommas = 0; let d = 0;
for (const ch of quotaCallStr) {
  if (ch === "(" ) d++;
  else if (ch === ")") d--;
  else if (ch === "," && d === 1) topCommas++;
}
const argCount = topCommas + 1;
assert.ok(argCount >= 6, `coachQuota en generateOneDay debe recibir 6 args (scope=ds). Tiene ${argCount}.`);
assert.ok(
  /,\s*\n?\s*ds\s*\n?\s*\)/.test(quotaCallStr),
  "El último argumento de coachQuota en generateOneDay debe ser ds (la fecha del día)."
);

// 2. COACH_PROMPT_VERSION >= 3 (purga de entradas viejas sin scope)
const constMatch = html.match(/const\s+COACH_PROMPT_VERSION\s*=\s*(\d+)/);
assert.ok(constMatch, "Debe existir const COACH_PROMPT_VERSION.");
const ver = Number(constMatch[1]);
assert.ok(ver >= 3, `COACH_PROMPT_VERSION debe ser >= 3 tras REQ-88 (actual: ${ver}).`);

// 3. coachQuota acepta scope y lo usa en el contexto serializado
const cq = extractFunctionSource(html, "coachQuota");
assert.ok(cq.includes("scope"), "coachQuota debe aceptar parámetro scope.");
assert.ok(cq.includes("scope:scope") || cq.includes("scope: scope"), "coachQuota debe incluir scope en el context serializado.");

// 4. regenerateGenMeal también pasa scope (ya lo hacía, verificamos que no regresione)
const regen = extractFunctionSource(html, "regenerateGenMeal");
const regenCq = regen.indexOf("coachQuota(");
assert.ok(regenCq !== -1, "regenerateGenMeal debe llamar a coachQuota.");
assert.ok(
  /draft\.ds/.test(regen.slice(regenCq, regenCq + 300)),
  "regenerateGenMeal debe incluir draft.ds en scope de coachQuota."
);

// 5. generateOneDay usa action diet_day vía coachRequest
assert.ok(
  gen.includes("coachRequest.action") || gen.includes('"diet_day"'),
  "generateOneDay debe usar action diet_day (vía coachRequest.action)."
);

console.log(`Scope por día en contextKey: ds pasado como scope, COACH_PROMPT_VERSION=${ver} — OK.`);
