// REQ-69 — Regresión: "Macros del día" mostraba el objetivo de proteína
// del snapshot del plan (valores calculados al generar el plan) en vez de
// los valores actuales del perfil del usuario.
//
// Causa raíz: buildDay() pasaba ctx.prefs (snapshot) a effectiveDayTarget(),
// y planPrefsForDate() devuelve version.snapshot.prefs cuando hay un plan
// activo para esa fecha. Si el usuario editaba sus macros en el perfil sin
// regenerar el plan, effectiveDayTarget usaba los valores viejos del snapshot.
//
// Fix: buildDay llama effectiveDayTarget() sin argumentos, por lo que la
// función lee siempre (profile&&profile.prefs)||{} — los valores actuales.
//
// Este test extrae buildDay del fuente real de index.html y verifica
// estructuralmente que la llamada no pasa ctx.prefs.
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

// Después del fix: effectiveDayTarget() sin args lee (profile&&profile.prefs)||{},
// que siempre refleja los valores más recientes que el usuario guardó.
assert.ok(
  buildDaySrc.includes("effectiveDayTarget()"),
  "REQ-69: buildDay debe llamar effectiveDayTarget() sin argumentos."
);

console.log("Wiring de macro targets: buildDay usa effectiveDayTarget() sin snapshot — perfil actual siempre priorizado.");
