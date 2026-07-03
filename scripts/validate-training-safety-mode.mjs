#!/usr/bin/env node
// REQ-116 — modo suave recomendado por edad/restricciones y validacion de carga.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import "../training-plan.js";

const index = readFileSync("index.html", "utf8");
const trainingPlan = readFileSync("training-plan.js", "utf8");
const contracts = readFileSync("domain-contracts.js", "utf8");

assert.ok(index.includes("TRAINING_SAFETY_MODE_LABELS"), "La UI debe declarar opciones de ritmo del plan.");
assert.ok(index.includes("trainingSafetyRecommendation"), "Debe existir recomendacion por edad/restricciones.");
assert.ok(index.includes('trainingSafetyModeHtml("ob"'), "Onboarding debe mostrar ritmo del plan.");
assert.ok(index.includes('trainingSafetyModeHtml("pf"'), "Perfil debe mostrar ritmo del plan.");
assert.ok(index.includes("trainingSafetyMode:d.trainingSafetyMode"), "Onboarding debe persistir trainingSafetyMode.");
assert.ok(index.includes("trainingSafetyMode:draft.trainingSafetyMode"), "Perfil debe persistir trainingSafetyMode.");
assert.ok(index.includes("plannedPrimarySport:effectiveTrainingPrimarySport"), "El contexto debe distinguir deporte elegido y deporte efectivo.");
assert.ok(index.includes("gentleMode:isGentleTrainingPlan"), "La compatibilidad del plan debe incluir modo suave.");

assert.ok(index.includes('"pike-push-up"') && index.includes('"pull-up"'), "Modo suave debe bloquear pike push-ups y dominadas.");
assert.ok(index.includes("exerciseBlockedByGentleMode(exercise)"), "El filtro de ejercicios debe aplicar el bloqueo suave.");
assert.ok(trainingPlan.includes("gentleMode"), "El normalizador de plan debe validar gentleMode.");
assert.ok(contracts.includes("VALID_TRAINING_SAFETY_MODES"), "Contratos deben validar trainingSafetyMode.");

const versionMatch = index.match(/const COACH_PROMPT_VERSION=(\d+);/);
assert.ok(versionMatch && Number(versionMatch[1]) >= 5, "Cambiar el contexto de plan debe invalidar cache de coach.");

const domain = globalThis.FITBUD_TRAINING_PLAN;
const expected = {
  week: 1,
  phase: domain.phaseForWeek(1, 10),
  sessions: [{
    date: "2026-08-03",
    weekday: 1,
    location: "gym",
    role: "fullA",
    type: "strength",
    allowedExerciseIds: ["back-squat", "bench-press", "seated-cable-row"],
  }],
};

function rawWeek(sets, rpe, rir) {
  const spec = expected.sessions[0];
  return {
    week: expected.week,
    phase: expected.phase,
    reason: "Carga compatible con modo suave.",
    sessions: [{
      date: spec.date,
      weekday: spec.weekday,
      location: spec.location,
      role: spec.role,
      type: spec.type,
      name: "Fuerza controlada",
      objective: "Practicar tecnica con margen.",
      duration_minutes: 60,
      intensity: `RPE ${rpe}`,
      exercises: spec.allowedExerciseIds.map(exerciseId => ({
        exercise_id: exerciseId,
        sets,
        reps: "8-10",
        rest_seconds: 90,
        target_rpe: rpe,
        target_rir: rir,
        tempo: "Controlado",
      })),
      blocks: [],
    }],
  };
}

const gentle = domain.normalizeWeek(rawWeek(2, 5, 4), {
  week: 1,
  durationWeeks: 10,
  sessions: expected.sessions,
  sessionMinutes: 60,
  allowedExerciseIds: expected.sessions[0].allowedExerciseIds,
  blockedTerms: [],
  gentleMode: true,
});
assert.equal(gentle.ok, true, `Dosis suave valida debe pasar: ${gentle.issues.join(", ")}`);

const tooHard = domain.normalizeWeek(rawWeek(4, 7, 2), {
  week: 1,
  durationWeeks: 10,
  sessions: expected.sessions,
  sessionMinutes: 60,
  allowedExerciseIds: expected.sessions[0].allowedExerciseIds,
  blockedTerms: [],
  gentleMode: true,
});
assert.equal(tooHard.ok, false, "Modo suave debe rechazar dosis de plan completo.");

console.log("validate-training-safety-mode: REQ-116 verificado.");
