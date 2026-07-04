#!/usr/bin/env node
// REQ-115 — entrenamiento en dos decisiones claras, con compatibilidad interna.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const index = readFileSync("index.html", "utf8");
const pure = readFileSync("js/nutrition-pure.js", "utf8");
const contracts = readFileSync("domain-contracts.js", "utf8");
const trainingPlan = readFileSync("training-plan.js", "utf8");
const workoutPlayer = readFileSync("workout-player.js", "utf8");
const catalog = readFileSync("exercise-catalog.js", "utf8");
const exerciseSql = readFileSync("supabase/exercises.sql", "utf8");

assert.ok(index.includes("¿Practicas alguna actividad física?"), "Onboarding debe preguntar por actividad física, no por cardio.");
assert.ok(index.includes("Actividad física principal"), "Perfil debe editar la actividad física principal.");
assert.ok(!index.includes("¿Tienes un deporte cardio como actividad principal?"), "No debe volver la pregunta de deporte cardio.");
assert.ok(!index.includes(">Deporte cardio<"), "No debe volver el label Deporte cardio.");
assert.ok(!index.includes(">Trabajo de fuerza<"), "No debe volver el label Trabajo de fuerza.");
assert.ok(!index.includes("<label>Lugar de entrenamiento</label>"), "Onboarding no debe duplicar lugar como decisión principal.");

for (const value of ["walking", "running", "cycling", "swimming", "other", "strength_only"]) {
  assert.ok(index.includes(`["${value}"`), `La UI debe ofrecer actividad ${value}.`);
  assert.ok(pure.includes(`${value}:`), `SPORT_LABELS debe reconocer ${value}.`);
}
for (const value of ["gym", "home", "outdoor", "none"]) {
  assert.ok(index.includes(`["${value}"`), `La UI debe ofrecer fuerza/lugar ${value}.`);
}

assert.ok(pure.includes("activityOnlyTemplate"), "El dominio puro debe soportar plantillas sin fuerza.");
assert.ok(pure.includes('none:"Sin fuerza por ahora"'), "El dominio puro debe validar fuerza pausada.");
assert.ok(
  pure.includes('strength==="none"?activityLocation'),
  "Sin fuerza, defaultTrainingLocations debe usar el lugar de la actividad para no bloquear caminata/running.",
);
assert.ok(
  index.includes('if(strength!=="none"&&p.trainingLocations') &&
    index.includes('if(d.strengthMode!=="none")d.trainingDays.forEach'),
  "Los overrides de lugar por día no deben sobrescribir el lugar de actividad cuando strengthMode es none.",
);
assert.ok(index.includes("strengthModeFromChoice"), "La UI debe mapear lugar de fuerza a strengthMode.");
assert.ok(index.includes('d.primarySport==="strength_only"&&d.strengthMode==="none"'), "Debe bloquear actividad ninguna + fuerza pausada.");
assert.ok(index.includes("STRENGTH_RESOURCE_LABELS"), "Casa/aire libre deben pedir recursos disponibles.");
assert.ok(index.includes("strengthPlace"), "El lugar de fuerza debe guardarse para editarlo luego.");

assert.ok(contracts.includes('"walking"') && contracts.includes('"none"'), "Contratos deben aceptar walking y strength none.");
assert.ok(trainingPlan.includes('"walking"'), "El normalizador de plan debe aceptar sesiones walking.");
assert.ok(workoutPlayer.includes('"Caminata"'), "El reproductor debe ejecutar caminatas como cardio/actividad.");
assert.ok(catalog.includes('"walk-brisk"') && catalog.includes("walking:{"), "El catálogo local debe incluir rutinas de caminata.");
assert.ok(exerciseSql.includes("'walk-brisk'") && exerciseSql.includes("'walk-mobility'"), "SQL de ejercicios debe incluir caminata.");

console.log("validate-training-onboarding-decisions: REQ-115 verificado.");
