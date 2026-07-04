#!/usr/bin/env node
// Fix: usuarios strength_only sin actividad ligera (lightCardioEnabled=false),
// o con actividad ligera activa pero en un rol "calidad"/"técnica" (que no tiene
// sesión real), o con primarySport "other" en cualquier combinación de fuerza,
// podían recibir un día planificado "facil"/"calidad"/"técnica" que no resuelve
// a ningún entrenamiento real (sportSessions() devuelve un placeholder sin
// nombre para esos casos), y renderWorkout crasheaba en `ew.workout.name` con
// TypeError: Cannot read properties of null. Reproducido en producción cuando
// el día calendario asignado a ese slot llegaba (ver tests/e2e/entreno.spec.js
// y navegacion.spec.js, que fallaban en fechas concretas).
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

function extractFunctionSource(src, name) {
  const marker = `function ${name}(`;
  const start = src.indexOf(marker);
  assert.ok(start !== -1, `No se encontró function ${name}( en index.html`);
  let i = src.indexOf("{", start);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

// 1. workoutSchedule recibe lightCardioEnabled y sustituye los slots de deporte
//    (calidad/facil/técnica) por descanso cuando no tienen una sesión real detrás:
//    "other" nunca tiene sesión real en esos roles, y "strength_only" solo tiene
//    una ("facil") cuando lightCardioEnabled está activo — nunca debe dejar un id
//    planificado sin sesión real.
const schedule = extractFunctionSource(html, "workoutSchedule");
assert.ok(/lightCardioEnabled/.test(schedule), "workoutSchedule debe recibir el parámetro lightCardioEnabled.");
assert.ok(/primary==="other"\|\|primary==="strength_only"/.test(schedule),
  "workoutSchedule debe distinguir 'other' y 'strength_only' como deportes sin plantilla real.");
assert.ok(/strength_only"&&lightCardioEnabled/.test(schedule),
  "workoutSchedule debe tratar 'facil' como sesión real solo cuando strength_only tiene lightCardioEnabled activo.");
assert.ok(/sportIds\.has\(id\)&&!realSportIds\.has\(id\)\)\?"descanso":id/.test(schedule),
  "workoutSchedule debe sustituir por descanso los slots de deporte sin sesión real.");
console.log("  Test 1 pasado: workoutSchedule nunca deja un slot de deporte sin sesión real para 'other' o strength_only sin cardio ligero");

// 2. trainingPrefsFromPrefs expone lightCardioEnabled para que los llamadores
//    de workoutSchedule puedan pasarlo (si no se propaga, el fix no aplica).
const trainingPrefs = extractFunctionSource(html, "trainingPrefsFromPrefs");
assert.ok(/lightCardioEnabled:/.test(trainingPrefs), "trainingPrefsFromPrefs debe exponer lightCardioEnabled.");
console.log("  Test 2 pasado: trainingPrefsFromPrefs propaga lightCardioEnabled");

// 3. Ambos llamadores de workoutSchedule (plannedWorkoutId y trainingExpectedWeeks)
//    pasan training.lightCardioEnabled — si alguno se queda atrás, regresa el bug.
const callSites = [...html.matchAll(/workoutSchedule\(training\.days,training\.dayIds,training\.priority,training\.locations,training\.primary,training\.experience,training\.workoutSplit,training\.strength(,training\.lightCardioEnabled)?\)/g)];
assert.ok(callSites.length >= 2, "Debe haber al menos 2 llamadas a workoutSchedule con los parámetros de training.");
callSites.forEach((m) => {
  assert.ok(m[1], "Cada llamada a workoutSchedule debe incluir training.lightCardioEnabled.");
});
console.log(`  Test 3 pasado: las ${callSites.length} llamadas a workoutSchedule propagan lightCardioEnabled`);

console.log("validate-strength-only-schedule: todos los checks pasaron.");
