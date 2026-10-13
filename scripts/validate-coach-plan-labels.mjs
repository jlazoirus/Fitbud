#!/usr/bin/env node
// REQ-177 — Un plan cargado desde un coach conserva sus textos exactos:
// calentamiento por día, duración ("45–60 min") y descanso ("90–120 s").
import assert from "node:assert/strict";
import fs from "node:fs";
import "../training-plan.js";
import "../workout-player.js";

const TP = globalThis.FITBUD_TRAINING_PLAN;
const WP = globalThis.FITBUD_WORKOUT_PLAYER;
const session = {
  id: "generated-2026-10-14-legs", date: "2026-10-14", weekday: 3, location: "gym", role: "legs", type: "strength",
  name: "Legs", objective: "Cuádriceps · glúteos · femorales · pantorrillas", durationMinutes: 70, durationLabel: "55–70 min",
  warmup: "Haz 8 sentadillas sin peso, 8 bisagras de cadera y 6 zancadas por lado.", intensity: "RIR 2",
  exercises: [{ exerciseId: "goblet-squat", sets: 4, reps: "8–15", restSeconds: 120, restLabel: "2–3 min", targetRpe: 8, targetRir: 2, tempo: "Controlado" }],
  blocks: [],
};
const workout = TP.workoutFromSession(session, "gym");
assert.ok(workout.detail.includes("55–70 min"), "el detalle usa la duración del coach");
const prescription = WP.buildPrescription({
  workout: { ...workout, kind: "Gimnasio" },
  exercises: [{ slug: "goblet-squat", name: "Sentadilla goblet", discipline: "gym" }],
  context: { sessionMinutes: 60, week: 1, durationWeeks: 10 },
});
assert.equal(prescription.durationLabel, "55–70 min", "la prescripción conserva la duración");
assert.equal(prescription.steps[0].target, session.warmup, "el calentamiento es el del coach");
const strength = prescription.steps.find(step => step.type === "strength");
assert.equal(strength.restLabel, "2–3 min", "el descanso conserva el rango del coach");
assert.equal(strength.restSeconds, 120, "el temporizador usa el mínimo");
assert.equal(strength.prescribedSets, 4);
assert.equal(strength.reps, "8–15");

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(html.includes("step.restLabel||`${step.restSeconds}s`"), "el reproductor muestra el rango de descanso");
assert.ok(html.includes("prescription.durationLabel?"), "el resumen previo muestra la duración del coach");
console.log("validate-coach-plan-labels: OK");
