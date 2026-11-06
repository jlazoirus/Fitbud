// REQ-87/349: saltar pasado/días cerrados; completar franjas pendientes
// de un día parcial sin sobrescribir el consumo ni elecciones manuales.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../app/index.html", import.meta.url), "utf8");

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

// 1. Ejecutar el selector real: desayuno registrado no oculta almuerzo/cena.
const wpd = extractFunctionSource(html, "weekPendingDays");
assert.ok(wpd.includes("todayStr()"), "weekPendingDays debe comparar con todayStr().");
const states={
  "2026-11-05":[{done:true},{done:false},{done:false}],
  "2026-11-06":[{done:true},{done:true},{done:true}],
  "2026-11-07":[{skipped:true},{skipped:true},{skipped:true}],
  "2026-11-08":[{ovr:{userSet:true}},{ovr:{userSet:true}},{ovr:{userSet:true}}],
  "2026-11-09":[{done:true},{ovr:{userSet:true}},{done:false}],
};
const ctx=vm.createContext({todayStr:()=>"2026-11-05",buildDay:()=>({meals:[0,1,2].map(id=>({id}))}),mealState:(ds,id)=>states[ds]?.[id]||{done:false}});
const selected=vm.runInContext(`(${wpd})`,ctx)(["2026-11-04",...Object.keys(states)]);
assert.deepEqual(Array.from(selected),["2026-11-05","2026-11-09"]);

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
