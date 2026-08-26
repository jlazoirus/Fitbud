// REQ-160: analyzeCheckinAnswers() ramificaba por goal==="surplus"/"maintain",
// pero el perfil real solo guarda goal en "deficit"/"mantenimiento"/"volumen"
// (#ob_goal). "volumen" y "mantenimiento" caían siempre en la rama else
// (déficit): en volumen, ganar peso dentro de lo esperado RECORTABA calorías
// (saboteando la masa); en mantenimiento, una deriva de peso no recibía
// ningún ajuste. Ejecuta la función REAL extraída de index.html (no una
// reimplementación) vía node:vm — mismo patrón que test-meal-value-replacement.mjs.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(HERE, "..", "index.html"), "utf8");

function extractFunctionSource(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `No se encontró "${signature}" en index.html`);
  let depth = 0, i = source.indexOf("{", start);
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) break; }
  }
  return source.slice(start, i + 1);
}

const constsMatch = html.match(/const CHECKIN_MAX_KCAL_ADJUST=\d+;[\s\S]*?const CHECKIN_MIN_KCAL=\d+;/);
assert.ok(constsMatch, "No se encontraron las constantes CHECKIN_MAX_KCAL_ADJUST/CHECKIN_MIN_KCAL");
const fnSrc = extractFunctionSource(html, "function analyzeCheckinAnswers(answers,prefs){");
const fullSrc = constsMatch[0] + "\n" + fnSrc;

const context = vm.createContext({ console });
vm.runInContext(fullSrc, context, { filename: "analyzeCheckinAnswers.js" });
function analyze(answers, prefs) {
  context.answers = answers; context.prefs = prefs;
  return vm.runInContext("analyzeCheckinAnswers(answers, prefs)", context);
}

// ── deficit (ya funcionaba; cobertura de no-regresión) ──
{
  const r = analyze({ weight: 81, prevWeight: 80 }, { goal: "deficit", calorieTarget: 2000 }); // +1.0 kg
  assert.equal(r.calorieAdjust, -100, "deficit: subir >0.3kg/sem debe recortar 100 kcal.");
}
{
  const r = analyze({ weight: 79, prevWeight: 80 }, { goal: "deficit", calorieTarget: 2000 }); // -1.0 kg
  assert.equal(r.calorieAdjust, 100, "deficit: bajar <-0.8kg/sem debe añadir 100 kcal.");
}
console.log("  Test 1 pasado: goal=deficit sin regresión (sube→recorta, baja rápido→añade)");

// ── volumen: dentro de 0.15–0.6 kg/sem → sin ajuste; ganancia MENOR a 0.15 → añadir kcal ──
{
  const r = analyze({ weight: 80.3, prevWeight: 80 }, { goal: "volumen", calorieTarget: 2800 }); // +0.3 kg, dentro de rango
  assert.equal(r.calorieAdjust, 0, "volumen: ganar 0.15–0.6 kg/sem no debe recortar ni añadir calorías.");
}
{
  const r = analyze({ weight: 80.05, prevWeight: 80 }, { goal: "volumen", calorieTarget: 2800 }); // +0.05 kg, muy poco
  assert.equal(r.calorieAdjust, 100, "volumen: ganar menos de 0.15 kg/sem debe añadir calorías (antes caía a deficit y recortaba).");
}
{
  const r = analyze({ weight: 80.8, prevWeight: 80 }, { goal: "volumen", calorieTarget: 2800 }); // +0.8 kg, ganancia rápida
  assert.equal(r.calorieAdjust, -100, "volumen: ganancia muy rápida (>0.6kg/sem) sí debe recortar un poco.");
}
console.log("  Test 2 pasado: goal=volumen ya no se trata como déficit (antes recortaba con ganancia esperada)");

// ── mantenimiento: |Δ|>0.4 kg/sem corrige en el signo esperado ──
{
  const r = analyze({ weight: 70.6, prevWeight: 70 }, { goal: "mantenimiento", calorieTarget: 2200 }); // +0.6 kg
  assert.equal(r.calorieAdjust, -100, "mantenimiento: subir >0.4kg/sem debe recortar (antes no ajustaba nada, caía a deficit con umbral 0.3/-0.8).");
}
{
  const r = analyze({ weight: 69.4, prevWeight: 70 }, { goal: "mantenimiento", calorieTarget: 2200 }); // -0.6 kg
  assert.equal(r.calorieAdjust, 100, "mantenimiento: bajar >0.4kg/sem debe añadir calorías.");
}
{
  const r = analyze({ weight: 70.2, prevWeight: 70 }, { goal: "mantenimiento", calorieTarget: 2200 }); // +0.2 kg, dentro de tolerancia
  assert.equal(r.calorieAdjust, 0, "mantenimiento: deriva pequeña (≤0.4kg/sem) no debe ajustar.");
}
console.log("  Test 3 pasado: goal=mantenimiento corrige en cualquier dirección (antes nunca ajustaba)");

// ── REQ-165: escalas 1-5 opcionales sin responder (readCiScale→null) no deben
// leerse como el peor valor. Repro exacta del REQ (meta déficit, 2000 kcal). ──

// (A) Enviar sin marcar nada → keep:true, sin ninguna razón de "energía/sueño bajos".
{
  const r = analyze({ hunger: null, energy: null, sleep: null, nutrition: null, difficulty: null, soreness: null, stress: null }, { goal: "deficit", calorieTarget: 2000 });
  assert.equal(r.calorieAdjust, 0, "sin responder nada, no debe ajustar calorías.");
  assert.equal(r.keep, true, "sin responder nada, debe quedar keep:true.");
  assert.ok(!r.details.some(d => /energía y sueño bajos/i.test(d)), "no debe mencionar 'energía y sueño bajos' sobre escalas nunca respondidas.");
  assert.ok(!/energía|sueño/i.test(r.reason), "la razón mostrada con keep:true no debe hablar de una molestia sobre datos inexistentes.");
}
console.log("  Test 4 pasado: check-in vacío → keep:true sin razón negativa fantasma (antes: 'Energía y sueño bajos' con keep:true)");

// (B) hambre=5, energía/sueño SIN marcar → debe igualar al control (C) hambre=5+energía=5+sueño=5.
{
  const base = { hunger: 5, nutrition: 3, difficulty: 3, soreness: 3, stress: 3 };
  const casoB = analyze({ ...base, energy: null, sleep: null }, { goal: "deficit", calorieTarget: 2000 });
  const control = analyze({ ...base, energy: 5, sleep: 5 }, { goal: "deficit", calorieTarget: 2000 });
  assert.equal(casoB.calorieAdjust, control.calorieAdjust,
    `hambre alta con energía/sueño SIN responder debe dar el mismo ajuste que con energía/sueño altos (B=${casoB.calorieAdjust}, control=${control.calorieAdjust}).`);
  assert.equal(casoB.calorieAdjust, 50, "hambre alta sola (sin energía baja real) debe sumar +50, no +100.");
}
console.log("  Test 5 pasado: hambre alta + energía/sueño sin responder = mismo ajuste que hambre+energía+sueño altos (+50, no +100)");

// (C, no regresión) energía/sueño REALMENTE bajos sí deben seguir disparando el aviso.
{
  const r = analyze({ hunger: 2, energy: 1, sleep: 1, nutrition: 3, difficulty: 3, soreness: 3 }, { goal: "deficit", calorieTarget: 2000 });
  assert.ok(r.details.some(d => /energía y sueño bajos/i.test(d)), "energía y sueño REALMENTE bajos (respondidos) sí deben seguir generando el aviso.");
}
console.log("  Test 6 pasado: energía/sueño realmente bajos (respondidos) siguen generando el aviso — sin regresión");

console.log("analyzeCheckinAnswers (REQ-160/REQ-165): metas correctas y escalas sin responder no se leen como el peor valor. Verificado con vm sobre la función real.");
