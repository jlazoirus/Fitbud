// REQ-87 — "Preparar mi semana" debe saltar días pasados o con comidas
// ya consumidas, no sobrescribirlos. aiGenerateWeek debe filtrar con
// weekPendingDays antes de iterar.
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

// 1. weekPendingDays existe y filtra por todayStr() y doneMeals
const wpd = extractFunctionSource(html, "weekPendingDays");
assert.ok(wpd.includes("todayStr()"), "weekPendingDays debe comparar con todayStr().");
assert.ok(wpd.includes("dayTotals") && wpd.includes("doneMeals"), "weekPendingDays debe verificar dayTotals().doneMeals.");

// 2. aiGenerateWeek usa weekPendingDays, no itera allDays directamente
const aiGW = extractFunctionSource(html, "aiGenerateWeek");
assert.ok(aiGW.includes("weekPendingDays"), "aiGenerateWeek debe filtrar días con weekPendingDays.");
assert.ok(!aiGW.includes("for(let i=0;i<allDays"), "aiGenerateWeek NO debe iterar sobre allDays (debe usar days filtrados).");

// 3. El contador de progreso refleja days.length (filtrados), no allDays.length
assert.ok(
  /día \$\{i\+1\} de \$\{days\.length\}/.test(aiGW),
  "El progreso debe mostrar 'día X de days.length' (filtrados), no allDays.length."
);

// 4. generateDeterministicWeek se llama con days (filtrados)
assert.ok(
  aiGW.includes("generateDeterministicWeek(w,days)"),
  "generateDeterministicWeek debe recibir days (filtrados), no allDays."
);

console.log("Semana salta días pasados: weekPendingDays filtra, progreso refleja pendientes — OK.");
