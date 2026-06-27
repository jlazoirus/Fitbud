// REQ-68 — Regresión: "Preparar mi plan de entrenamiento" mostraba
// "La semana 2 está fuera de orden." porque trainingPlanValidationConfig()
// en index.html armaba el config de validación con la clave `expectedWeek`,
// mientras training-plan.js#normalizeWeek lee `config.week`. Como la clave
// nunca coincidía, normalizeWeek asumía siempre semana 1 (vía el fallback
// integer(config&&config.week,1)) y el plan completo quedaba mal numerado
// a partir de la segunda semana — tanto en el camino con IA como en el
// determinista (fallbackOnly), porque ambos pasan por el mismo wiring.
//
// Este test extrae la función real trainingPlanValidationConfig (y su
// dependencia trainingBlockedTerms) del código fuente de index.html —igual
// que el resto de scripts/validate-*.mjs que auditan index.html sin DOM— y
// reproduce el flujo real de generateTrainingWeek/normalizeWeek/validatePlan
// para detectar si el wiring real (no una copia reescrita a mano) vuelve a
// romperse.
import assert from "node:assert/strict";
import fs from "node:fs";
import "../training-plan.js";

const domain = globalThis.FITBUD_TRAINING_PLAN;
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

// trainingPlanValidationConfig depende de trainingBlockedTerms; extraemos
// ambas del fuente real y las evaluamos juntas en un sandbox aislado.
const blockedTermsSrc = extractFunctionSource(html, "trainingBlockedTerms");
const validationConfigSrc = extractFunctionSource(html, "trainingPlanValidationConfig");

const sandbox = new Function(`
  ${blockedTermsSrc}
  ${validationConfigSrc}
  return { trainingBlockedTerms, trainingPlanValidationConfig };
`)();

const { trainingPlanValidationConfig } = sandbox;

function expectedWeekSpec(week, duration) {
  const phase = domain.phaseForWeek(week, duration);
  const date = `2026-09-${String(week).padStart(2, "0")}`;
  return {
    week,
    phase,
    sessions: [{
      date, weekday: 1, location: "gym", role: "fullA", type: "strength",
      allowedExerciseIds: ["back-squat", "bench-press", "seated-cable-row"],
    }],
  };
}

function rawWeekPayload(expected) {
  const spec = expected.sessions[0];
  return {
    week: expected.week,
    phase: expected.phase,
    reason: "Carga progresiva compatible con el perfil.",
    sessions: [{
      date: spec.date, weekday: spec.weekday, location: spec.location, role: spec.role, type: spec.type,
      name: "Fuerza de cuerpo completo",
      objective: "Completar la dosis con técnica estable",
      duration_minutes: 60, intensity: "RPE 6",
      exercises: spec.allowedExerciseIds.map(exerciseId => ({
        exercise_id: exerciseId, sets: 3, reps: "8-10",
        rest_seconds: 90, target_rpe: 6, target_rir: 3, tempo: "Controlado",
      })),
      blocks: [],
    }],
  };
}

const prefs = { sessionMinutes: 60, avoidMovements: "" };

for (const duration of [4, 10]) {
  const weeks = [];
  for (let week = 1; week <= duration; week++) {
    const expected = expectedWeekSpec(week, duration);
    // Reproduce exactamente generateTrainingWeek(): construye `validation` con
    // la función real de index.html y la pasa con spread a normalizeWeek, tal
    // como hace index.html en el camino con IA y en el fallbackOnly.
    const validation = trainingPlanValidationConfig(expected, prefs);
    const result = domain.normalizeWeek(rawWeekPayload(expected), {
      ...validation, durationWeeks: duration, sessions: expected.sessions, blockedTerms: [],
    });
    assert.equal(result.ok, true, `La semana ${week}/${duration} debe validarse con el wiring real: ${result.issues.join(", ")}`);
    assert.equal(result.week.week, week, `normalizeWeek debe asignar week=${week}, recibió ${result.week.week} (config.week=${validation.week})`);
    weeks.push(result.week);
  }
  const plan = { version: domain.VERSION, durationWeeks: duration, weeks };
  const check = domain.validatePlan(plan, { durationWeeks: duration });
  assert.equal(check.ok, true, `El plan de ${duration} semanas no debe reportar semanas fuera de orden: ${check.issues.join(", ")}`);
  weeks.forEach((week, index) => {
    assert.equal(week.week, index + 1, `plan.weeks[${index}].week debe ser ${index + 1}, fue ${week.week}`);
  });
}

console.log("Wiring real de index.html → training-plan.js: numeración y fase de semanas validadas (4 y 10 semanas).");
