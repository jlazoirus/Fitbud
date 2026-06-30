// REQ-91 — El snack/shake agregado como sugerencia de REQ-89 al aplicar el día
// debe entrar como pendiente (done:false), no como ya consumido (done:true).
// El usuario lo marca manualmente cuando lo coma, igual que las demás comidas.
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

// 1. applyGeneratedDay pone done:false en extras (no done:true)
const agd = extractFunctionSource(html, "applyGeneratedDay");
assert.ok(agd.includes("extras"), "applyGeneratedDay debe manejar extras.");
assert.ok(
  agd.includes("done:false"),
  "applyGeneratedDay debe poner done:false en extras generados (el usuario marca cuando come)."
);
assert.ok(
  !agd.includes("done:true"),
  "applyGeneratedDay NO debe poner done:true en extras generados."
);

// 2. applyDayComidas NO pone done en las comidas de slot (confirmar que no regresionó)
const adc = extractFunctionSource(html, "applyDayComidas");
assert.ok(
  !adc.includes("done:true") && !adc.includes("done:false"),
  "applyDayComidas no debe tocar el flag done de las comidas de slot."
);

console.log("Gap snack pendiente: extras generados entran con done:false, slot meals sin done — OK.");
