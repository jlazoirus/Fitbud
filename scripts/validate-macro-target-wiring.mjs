// REQ-69 — Regresión: "Macros del día" mostraba el objetivo de proteína
// del snapshot del plan (valores calculados al generar el plan) en vez de
// los valores actuales del perfil del usuario.
//
// Causa raíz: buildDay() pasaba ctx.prefs (snapshot) a effectiveDayTarget(),
// y planPrefsForDate() devuelve version.snapshot.prefs cuando hay un plan
// activo para esa fecha. Si el usuario editaba sus macros en el perfil sin
// regenerar el plan, effectiveDayTarget usaba los valores viejos del snapshot.
//
// REQ-389: buildDay pasa la fecha sin ctx.prefs. El perfil actual conserva
// prioridad, salvo la vigencia futura explícita de una edición de metas.
//
// Este test extrae buildDay del fuente real de index.html y verifica
// estructuralmente que la llamada no pasa ctx.prefs.
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../app/index.html", import.meta.url), "utf8");

function extractFunctionSource(src, name) {
  const marker = `function ${name}(`;
  const start = src.indexOf(marker);
  assert.ok(start !== -1, `No se encontró function ${name}( en index.html`);
  let i = src.indexOf("{", start);
  assert.ok(i !== -1, `No se encontró el cuerpo de ${name}`);
  let depth = 0;
  const bodyStart = i;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  return src.slice(start, i);
}

const buildDaySrc = extractFunctionSource(html, "buildDay");

// El bug original: buildDay pasaba ctx.prefs a effectiveDayTarget, lo que hacía
// que el objetivo diario usara los macros del snapshot (valores viejos) cuando
// el usuario había editado su perfil sin regenerar el plan.
assert.ok(
  !buildDaySrc.includes("effectiveDayTarget(ctx.prefs)"),
  "REQ-69: buildDay NO debe pasar ctx.prefs a effectiveDayTarget — causaría que " +
  "el objetivo del día use el snapshot del plan en vez del perfil actual del usuario."
);

// El resolver recibe una fecha, nunca el snapshot nutricional obsoleto.
assert.ok(
  buildDaySrc.includes("effectiveDayTarget(null,ds)"),
  "REQ-69: buildDay resuelve metas desde el perfil para la fecha, sin usar ctx.prefs."
);

console.log("Wiring de macro targets: perfil actual priorizado, con fecha explícita para cambios que comienzan mañana.");
